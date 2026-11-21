# 01 · Vistas generadas del lado del servidor y backend (Google Apps Script)

## Por qué
El Producto 2 pide "vistas generadas del lado del **cliente y del servidor**". Hoy todo se genera en el navegador. En el plan Spark no hay Cloud Functions, y el equipo ya usa Apps Script para el push (`scripts/apps-script/Codigo.gs` en `alertavecinal-prueba`).
Con **HtmlService + plantillas** (`<?= ?>`), Apps Script genera el HTML **en el servidor de Google** con datos leídos de Firestore. Eso es una vista renderizada en servidor real. Además sirve como el **backend individual del SP7**: cada integrante hace la parte de servidor de su aportación.

## Estructura (carpeta `apps-script/` en la raíz del repo, sincronizada con `clasp`)
| Archivo | Dueño | Contenido |
|---|---|---|
| `appsscript.json` | Jaziel | Manifiesto: `"runtimeVersion": "V8"`, zona `America/Mexico_City`, `webapp: { executeAs: "USER_DEPLOYING", access: "ANYONE_ANONYMOUS" }`, scopes mínimos (`script.external_request`, `datastore` o el OAuth de la cuenta de servicio) |
| `Comun.gs` | Jaziel | `doGet(e)` y `doPost(e)` (router), cuenta de servicio desde Propiedades del script, token OAuth, helpers de Firestore REST (`leerDoc_`, `consultar_`, `crearDoc_`), verificación de `idToken`/usuario aprobado, `responderJson_`, `renderVista_(nombre, datos)`, `incluir_(archivo)` y estilos comunes con los colores de la app |
| `Boletin.gs` + `vista_boletin.html` | Jaziel | Vista de servidor: **Boletín público de alertas** |
| `SinSenal.gs` | Jaziel | Acción de backend de "Alerta sin señal" |
| `Push.gs` | Luis | Acción `push`: lógica migrada de `Codigo.gs` (verificar sesión, leer alerta o aviso, enviar FCM v1, limpiar tokens) |
| `MapaCalor.gs` + `vista_mapacalor.html` | Luis | Vista de servidor: **Reporte de mapa de calor** |
| `Verificado.gs` + `vista_verificado.html` | Yeudiel | Vista de servidor: **Ficha de Vecino Verificado** |

### Convención del router (nadie edita `Comun.gs` salvo Jaziel)
- `GET ?vista=boletin` → el router llama `vista_boletin(e)` si existe (`globalThis['vista_' + nombre]`). Si no existe, muestra una página 404 amigable.
- `POST {accion: "push", ...}` → llama `accion_push(datos)`. **Compatibilidad**: si el POST no trae `accion`, se trata como `push`, porque así lo llama hoy `js/push.js`.
- `GET` sin parámetros → JSON de estado `{ok, servicio, vistas:[...], acciones:[...]}` con las funciones que existen.
- Cada vista devuelve `renderVista_('vista_xxx', datos)`: `HtmlService.createTemplateFromFile`, asigna datos, `.evaluate()`, `.setTitle()`, `.addMetaTag('viewport', ...)` y `.setXFrameOptionsMode(ALLOWALL)`.

## Vistas y acciones (requisitos)
**Jaziel**
- RF-J1 `vista_boletin`: página pública que **el servidor** genera con las alertas de las últimas 24 h y 7 días. Muestra tipo, colonia o zona aproximada (coordenadas redondeadas a 2–3 decimales, **sin nombres de vecinos ni ubicación exacta**), hora relativa, conteo por tipo y un pie "Generado en el servidor el <fecha/hora>" para demostrar que es SSR.
- RF-J2 `accion_alerta_sin_senal`: recibe `{idToken, alertas:[...]}` de la cola de IndexedDB. Valida sesión y usuario aprobado, **deduplica por `idCola`**, sella `creadaEn` con la hora del servidor, marca `enviadaSinSenal: true` y responde qué se aceptó. `js/offline-sync.js` la usa cuando hay `URL_BACKEND` configurada; si no, sigue escribiendo directo a Firestore (respaldo).

**Luis**
- RF-L1 `accion_push`: migración de `Codigo.gs` sin cambiar el contrato con `js/push.js`.
- RF-L2 `vista_mapacalor`: el servidor **agrega** las alertas por celda o zona y por tipo (últimos 30 días) y genera una tabla y un mapa estático (Leaflet en la plantilla con los puntos agregados ya calculados en servidor), con la zona más reportada y la franja horaria más frecuente.

**Yeudiel**
- RF-Y1 `vista_verificado?uid=...`: ficha pública de **Vecino Verificado** generada en servidor: nombre corto, estado de verificación, fecha de aprobación, número de alertas útiles y "insignia". Sin datos sensibles (correo, teléfono, ubicación).
- RF-Y2 (opcional) `accion_verificar`: el admin marca a un vecino como verificado, validando en servidor que quien llama es admin.

## Integración con la PWA
- `js/firebase-config.js` (Jaziel) expone `self.URL_BACKEND = 'https://script.google.com/macros/s/.../exec'`.
- Cada dueño de módulo agrega el enlace a **su** vista en el menú desde **su** módulo (`alertas.js` → Boletín, `heatmap.js` → Reporte de calor, `estadisticas.js`/`admin.js` → Ficha verificada). Se abren en una pestaña nueva.
- Las vistas de servidor no se cachean offline, porque son de otro origen. Documentarlo como decisión: requieren conexión, y la PWA muestra un aviso si no la hay.

## Despliegue (Jaziel, con su cuenta de Google)
1. `npm i -g @google/clasp` → `clasp login` (lo hace Jaziel) → `clasp create --type webapp --title "AlertaVecinal Backend" --rootDir apps-script`, o `clasp clone` si ya existe el proyecto del push. **No subir `.clasp.json` si tiene IDs que no deben publicarse; sí puede ir `.claspignore`.**
2. Propiedad del script `SERVICE_ACCOUNT` = contenido de la clave JSON (la pega Jaziel a mano en el editor; nunca en el repo).
3. `clasp push` → Implementar → Nueva implementación → Aplicación web (ejecutar como yo; acceso: cualquiera). Copiar la URL `/exec` a `URL_BACKEND`.
4. Luis y Yeudiel no necesitan acceso al proyecto de Apps Script: suben su código al repo, y Jaziel hace `clasp push` y una nueva versión de la implementación. También se les puede agregar como editores si lo prefieren.

## Criterios de aceptación
- [ ] `GET /exec` devuelve el JSON de estado con las 3 vistas y las acciones.
- [ ] Las 3 vistas cargan desde la PWA y muestran el pie "Generado en el servidor".
- [ ] Ver el código fuente de la vista muestra los datos ya incrustados en el HTML (prueba de SSR), a diferencia de `index.html`.
- [ ] El push sigue funcionando después de migrar `Codigo.gs` → `Push.gs`.
- [ ] La alerta sin señal pasa por el backend, se deduplica y queda con la hora del servidor.
- [ ] Ningún secreto en el repo (`git log -p | grep -i private_key` vacío).
