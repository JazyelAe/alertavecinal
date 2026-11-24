# Yeudiel · 02 · Vista de servidor: ficha de Vecino Verificado

**Dueño:** Gonzalez Barrios Yeudiel Nain (`yeudiel`) · **Fecha límite del PR:** martes 24 de noviembre de 2026
**Commit:** `Vista de servidor: ficha de Vecino Verificado` · Base: spec 01 de `docs/claude-kit/specs/` (RF-Y1 y RF-Y2)

## Objetivo
Agregar al backend de Apps Script una **vista generada en el servidor**: la ficha pública de un Vecino Verificado. Con esto la aportación *Vecino Verificado Pro* cumple el requisito del Producto 2 de "vistas del lado del servidor" y tiene su parte de backend (base del SP7).

## Cómo encaja con el núcleo (sin editar archivos de otros)
- El router de `apps-script/Comun.gs` (de Jaziel) llama solo a `vista_verificado(e)` con `GET ?vista=verificado&uid=...` y a `accion_verificar(d)` con `POST {accion:"verificar", ...}`.
- Se usan los helpers del núcleo: `leerDoc_`, `consultar_`, `actualizarDoc_`, `verificarSesion_`, `renderVista_`, `escaparHtml_` y `estilosComunes_`.
- `self.URL_BACKEND` (en `js/firebase-config.js`, de Jaziel) hoy está vacío. Mientras siga así, los enlaces nuevos **no se muestran** y la app funciona igual.

## Requisitos
- **RF-1 `vista_verificado(e)`**: valida `uid` (solo letras y números, 1–128). Lee `usuarios/{uid}` y las alertas con la cuenta de servicio y arma el HTML **en el servidor** con la plantilla `vista_verificado.html`.
- **RF-2 Datos públicos de la ficha**: nombre corto (nombre y la inicial del apellido), estado ("Vecino aprobado" y, si aplica, "Domicilio verificado por el comité" con su fecha), miembro desde (mes y año de alta), alertas enviadas, alertas útiles, insignia y pie "Generado en el servidor el <fecha>".
- **RF-3 Privacidad**: la ficha **no** muestra correo, teléfono, calle, número, descripciones ni coordenadas. Si el `uid` no existe o el vecino no está aprobado, se muestra una página genérica, sin revelar si la cuenta existe.
- **RF-4 Mismas reglas que el Panel Pro**: alerta útil = ubicación GPS + descripción de 15 o más caracteres, o foto. Insignias Guardián (8 útiles y 90 días), Vecino confiable (3 y 30), Colaborador (1) y Nuevo. Se repiten en `Verificado.gs` porque Apps Script no puede importar `js/estadisticas.js`; quedan documentadas en ambos archivos.
- **RF-5 (opcional) `accion_verificar(d)`**: `d = {accion:"verificar", idToken, uid, verificado:true|false}`. En el servidor valida con `verificarSesion_(idToken, {rol:'admin'})` que quien llama es admin aprobado y que el vecino existe y está aprobado. Guarda en `usuarios/{uid}` los campos `verificado`, `verificadoEn` (hora del servidor) y `verificadoPor` (uid del admin). Responde `{ok, uid, verificado}`.
- **RF-6 Enlaces desde mis módulos** (solo si `URL_BACKEND` está configurada y no es `?demo=1`):
  - `js/estadisticas.js`: botón "Ver mi ficha pública" en *Mi ficha*, que abre en pestaña nueva.
  - `js/admin.js`: en vecinos aprobados, botón "Verificar domicilio" / "Quitar verificación" (llama a `accion_verificar`) y enlace "Ficha".
- **RF-7 Pruebas locales** con el simulador del equipo, en `apps-script/pruebas/prueba_verificado.mjs`.

## Decisiones
- La ficha es pública **a propósito**: sirve como "credencial" que el vecino puede compartir. Por eso solo lleva datos no sensibles (RF-3).
- La vista no se cachea offline porque es de otro origen (script.google.com). Requiere conexión, igual que el boletín.
- `verificado` es un campo nuevo en `usuarios`. Las reglas actuales ya permiten que el admin cambie cualquier perfil y la cuenta de servicio no pasa por las reglas, así que **no hay que editar `firestore.rules`**.

## Archivos que se tocan
| Archivo | Dueño | Cambio |
|---|---|---|
| `apps-script/Verificado.gs` | Yeudiel | Nuevo |
| `apps-script/vista_verificado.html` | Yeudiel | Nuevo |
| `apps-script/pruebas/prueba_verificado.mjs` | Yeudiel | Nuevo (no lo sube clasp) |
| `js/estadisticas.js` | Yeudiel | Botón "Ver mi ficha pública" |
| `js/admin.js` | Yeudiel | Botones de verificación y enlace a la ficha |
| `docs/specs/yeudiel-02-ficha-vecino-verificado.md` | Yeudiel | Esta spec |

## Despliegue (lo hace Jaziel)
`clasp push` y **nueva versión de la implementación**. No hay propiedades nuevas del script.

## Criterios de aceptación
- [ ] `GET /exec` lista `verificado` en `vistas` y `verificar` en `acciones`.
- [ ] `?vista=verificado&uid=<aprobado>` muestra la ficha con los datos de RF-2 y el pie de servidor.
- [ ] El HTML no contiene correo, teléfono, calle, descripciones ni coordenadas.
- [ ] `uid` inexistente, pendiente o mal formado → página genérica.
- [ ] `accion_verificar` rechaza a quien no es admin y guarda la verificación con hora del servidor.
- [ ] Con `URL_BACKEND` vacía o en `?demo=1`, la app no muestra los enlaces nuevos y sigue sin errores.

## Ajuste durante la implementación
En `?demo=1` el botón "Verificar domicilio" **sí** aparece y la verificación se simula en la tabla, igual que "Aprobar" o "Suspender" en demo. Así se puede capturar como evidencia sin backend. El enlace "Ficha" y "Ver mi ficha pública" solo aparecen con `URL_BACKEND` y fuera de demo.

## Pruebas (23/11/2026)
**Backend con el simulador del equipo** (`node apps-script/pruebas/prueba_verificado.mjs`): **12/12** ✅
1. El estado del backend lista la vista `verificado` y la acción `verificar`.
2. La ficha tiene título, viewport y el pie "Generado en el servidor (Google Apps Script)".
3. Vecina con 11 alertas (9 útiles, 82 %) y 120 días → nombre corto "Ana M." e insignia Guardián.
4. Vecino con 1 útil y 10 días → Colaborador; nombre de una palabra se queda igual.
5. Privacidad: el HTML no contiene correo, teléfono, calle, número, descripciones, coordenadas ni apellidos.
6. `uid` inexistente, pendiente, mal formado (`../usuarios/ana`), vacío o ausente → la misma página genérica.
7. `accion_verificar` con un vecino que no es admin → rechazada, no se guarda nada.
8. Sin token o con token falso → rechazada.
9. El admin verifica → `verificado: true`, `verificadoPor` = uid del admin, `verificadoEn` con hora del servidor; los demás campos del perfil no se tocan.
10. La ficha muestra "Domicilio verificado por el comité" con la fecha.
11. `uid` inválido, sin `verificado`, vecino inexistente o pendiente → error claro.
12. El admin puede quitar la verificación.

Las pruebas existentes siguen pasando: `prueba_comun` 13/13, `prueba_boletin` 9/9, `prueba_sin_senal` 9/9.

**Frontend** (http-server en `localhost:3000`, `?demo=1`):
| # | Prueba | Resultado |
|---|---|---|
| 1 | `node --check` de `js/admin.js` y `js/estadisticas.js` | ✅ |
| 2 | Administración en demo: "Verificar domicilio" en vecinos aprobados; al pulsarlo aparece el chip "Domicilio verificado" y el botón cambia a "Quitar verificación" | ✅ |
| 3 | Panel Pro en demo sigue igual (7 alertas en Mi ficha, 5 vecinos) y **no** muestra "Ver mi ficha pública" porque no hay `URL_BACKEND` | ✅ |
| 4 | Vista previa del HTML generado por el simulador: ficha con nombre corto, sellos, cifras, insignia y pie de servidor | ✅ |
| 5 | Consola sin errores de los módulos | ✅ (solo el aviso del service worker del navegador de prueba) |

**Pendiente de probar con el backend publicado** (requiere `clasp push` y `URL_BACKEND`, a cargo de quien despliega): abrir la ficha real desde el Panel Pro y verificar un domicilio desde la administración.
