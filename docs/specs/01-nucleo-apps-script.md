# Spec · Núcleo del backend en Google Apps Script (Jaziel · commit 2)

**Basada en:** `docs/claude-kit/specs/01-vistas-servidor-apps-script.md`
**Dueño:** Jaziel · **Rama:** `jaziel` · **Commit:** `Backend: núcleo de Apps Script (router, Firestore y sesión)`
**Estado:** aprobada el 21/11/2026 · implementada · pendiente de desplegar en Google

## 1. Objetivo
Crear la base de servidor que usarán los 3 integrantes:
- un **router** (`doGet`/`doPost`) que despacha vistas renderizadas en el servidor (`?vista=...`) y acciones de backend (`{accion: ...}`);
- **utilidades comunes**: cuenta de servicio, token OAuth, Firestore REST, verificación de sesión, respuesta JSON y render de plantillas HTML.

Cada integrante solo agrega funciones con nombre fijo en **su** archivo (`vista_xxx`, `accion_xxx`) y nadie edita `Comun.gs`.

## 2. Auditoría
- Hoy el push vive en `scripts/apps-script/Codigo.gs` (203 líneas, sube Luis) y ya está **publicado**: `js/firebase-config.js` tiene `PUSH_ENDPOINT = https://script.google.com/macros/s/AKfycbx…/exec`.
- `Codigo.gs` ya trae utilidades buenas que se migran al núcleo: `cuentaDeServicio_`, `tokenDeAcceso_` (JWT RS256 + caché de 50 min), `uidDelToken_`, `aObjeto_`, `leerDocumento_`, `crearSiNoExiste_` y `listarTokens_`.
- Las alertas en Firestore usan `creado: serverTimestamp()`, `tipo` ∈ {robo, medica, gas, otro}, `descripcion`, `direccion`, `uid` y la ubicación.
- **Las reglas solo dejan leer alertas a vecinos aprobados.** Por eso las vistas públicas (boletín, mapa de calor, ficha) deben leer en el servidor con la cuenta de servicio y **anonimizar** los datos.
- `apps-script/` no existe y `clasp` no está instalado (se necesita hasta el despliegue).

## 3. Requisitos funcionales
| # | Requisito |
|---|---|
| RF-1 | `appsscript.json`: V8, zona `America/Mexico_City`, `webapp {executeAs: USER_DEPLOYING, access: ANYONE_ANONYMOUS}`, `exceptionLogging: STACKDRIVER` y scope mínimo `script.external_request`. |
| RF-2 | `doGet(e)`: con `?vista=nombre`, valida el nombre (`[a-z0-9_]`) y llama `vista_<nombre>(e)` si existe; si no, muestra una **página 404 amigable**. Sin parámetros, responde un **JSON de estado** `{ok, servicio, vistas:[...], acciones:[...], configurado}` con las funciones que existen. |
| RF-3 | `doPost(e)`: lee el cuerpo JSON (llega como `text/plain`, sin verificación CORS previa) y llama `accion_<accion>(datos)`. **Si no trae `accion`, se trata como `push`**, por compatibilidad con `js/push.js`. Los errores responden `{ok:false, error}`. |
| RF-4 | Cuenta de servicio desde la propiedad `SERVICE_ACCOUNT` y token OAuth con scopes `datastore` y `firebase.messaging`, guardado en caché. |
| RF-5 | Firestore REST: `leerDoc_(ruta, bearer?)`, `consultar_(coleccion, {desde, orden, limite})` (runQuery), `crearDoc_(ruta, datos, {soloSiNoExiste})`, `actualizarDoc_`, `borrarDoc_`, y conversión completa entre objetos y campos de Firestore (texto, número, booleano, fecha, nulo, mapa, arreglo y geopunto). |
| RF-6 | `verificarSesion_(idToken, {rol})`: obtiene el uid del token, valida la firma leyendo el perfil **con el propio token** (Firestore la rechaza si es falsa), exige `estado == 'aprobado'` y, si se pide, `rol == 'admin'`. Devuelve `{uid, perfil}`. |
| RF-7 | `responderJson_(obj)`, `renderVista_(archivo, datos, titulo)` (plantilla de HtmlService con viewport, `ALLOWALL` y `datos.generadoEn` con fecha y hora del servidor), `incluir_(archivo)` y `estilosComunes_()` con los colores de la app. |
| RF-8 | **Contratos documentados en `Comun.gs`** para los demás: `accion_push(datos)` (Luis, misma entrada `{idToken, tipo, id}` y salida que hoy), `vista_mapacalor(e)` (Luis), `vista_verificado(e)` y `accion_verificar(datos)` (Yeudiel), y las mías (`vista_boletin`, `accion_alerta_sin_senal`). |
| RF-9 | `probarConfiguracion()` para ejecutar desde el editor y confirmar que la cuenta de servicio y Firestore responden. |

## 4. Decisiones
- **No se cambia `PUSH_ENDPOINT` todavía.** El backend nuevo tendrá su propia URL (`URL_BACKEND`). Cuando Luis suba `Push.gs`, `PUSH_ENDPOINT` apuntará a la misma URL. Así el push no se rompe en medio.
- `.clasp.json` (que guarda el ID del proyecto) se ignora en git; `.claspignore` sube solo `.gs`, `.html` y `appsscript.json`.
- **Sin secretos en el repo**: la clave solo vive en Propiedades del script.

## 5. Archivos (todos de Jaziel)
| Archivo | Acción |
|---|---|
| `apps-script/appsscript.json` | Nuevo |
| `apps-script/Comun.gs` | Nuevo (router + utilidades + contratos) |
| `apps-script/.claspignore` | Nuevo |
| `apps-script/pruebas/prueba_comun.mjs` | Nuevo: prueba local con Node que simula los servicios de Google (router, 404, compatibilidad del push, conversión de campos, token) |
| `.gitignore` | Agrega `.clasp.json` y `.clasprc.json` |
| `docs/PROGRESO_UNIDAD2.md` | Actualiza el estado |

No se toca `scripts/apps-script/Codigo.gs` (lo retira Luis al migrar a `Push.gs`).

## 6. Criterios de aceptación
| # | Criterio | Cómo se verifica |
|---|---|---|
| CA-1 | `GET` sin parámetros → JSON de estado con las vistas y acciones existentes. | Prueba local con Node · después, `GET /exec` real |
| CA-2 | `GET ?vista=no-existe` → página 404 amigable; un nombre con caracteres raros se rechaza. | Prueba local |
| CA-3 | `POST` sin `accion` llama `accion_push` (compatibilidad); una acción inexistente → `{ok:false}`. | Prueba local |
| CA-4 | La conversión objeto ⇄ campos de Firestore es reversible para todos los tipos. | Prueba local |
| CA-5 | `uidDelToken_` rechaza tokens mal formados. | Prueba local |
| CA-6 | Ningún secreto en el repo; `.clasp.json` ignorado. | `git grep`, `git status` |
| CA-7 | **Funciona en Google** (`GET /exec` y `probarConfiguracion`). | En el paso de despliegue, con tu cuenta |

## 7. Pruebas
Prueba local `node apps-script/pruebas/prueba_comun.mjs`. Simula los servicios de Apps Script y da **13/13**:

| # | Resultado |
|---|---|
| CA-1 | ✅ `GET` sin parámetros → `{ok, servicio, configurado, vistas, acciones, horaServidor}`, listando solo las funciones que existen. |
| CA-2 | ✅ `?vista=demo` → llama a `vista_demo`. Una vista inexistente → página 404 amigable con enlace a la app. Nombres como `../constructor` o `<script>` se rechazan. Una vista que lanza un error → página de error (el servidor no se cae). |
| CA-3 | ✅ `POST` sin `accion` → `accion_push` (compatibilidad con `js/push.js`). Con `accion` → `accion_<nombre>`. Una acción inexistente, un nombre inválido (`__proto__`) o un JSON roto → `{ok:false}`. |
| CA-4 | ✅ La conversión objeto ⇄ campos de Firestore es reversible: texto, entero, decimal, booleano, nulo, fecha, arreglo, mapa y geopunto. |
| CA-5 | ✅ `uidDelToken_` lee el uid y rechaza tokens de 2 partes, base64 inválido, uid con caracteres raros y token vacío. |
| CA-6 | ✅ Sin secretos; `.clasp.json` y `.clasprc.json` están en `.gitignore`. |
| CA-7 | ⏳ Pendiente: se comprueba en Google en el paso de despliegue (`GET /exec` y `probarConfiguracion`). |

**Corrección hecha durante la prueba:** las fechas se detectaban con `instanceof Date`, que falla si el objeto viene de otro contexto. Ahora se usa `Object.prototype.toString`.
