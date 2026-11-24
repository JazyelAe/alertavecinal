# Spec · Sección de Luis para el Producto 2 (Luis · tarea 4)

**Basada en:** `docs/claude-kit/specs/03-producto2-documento.md` y el formato que lee `docs/producto2/generar_pdf.py`
**Dueño:** Luis · **Rama:** `luis`
**Estado:** aprobada el 24/11/2026 · escrita · la conclusión debe revisarla Luis

## 1. Objetivo
Escribir `docs/producto2/luis.md`, mi parte del documento del Producto 2. Jaziel genera el PDF del equipo juntando `jaziel.md`, `luis.md` y `yeudiel.md`: cada apartado `## N. Título` va a la sección N del documento y las referencias se juntan sin repetir.

## 2. Auditoría
- **Formato del generador:** `## N. …` (1 a 8) reparte por número; `## Referencias` con viñetas `- `; tablas Markdown; `### ` subtítulos; imágenes `![pie](evidencias/…)` se numeran como figuras; `✅`/`❌` se convierten en «Aprobada»/«Falla».
- **Ya cubierto por Jaziel** (no repetir): caso de estudio, justificación general (Leaflet, Nominatim y FCM en una línea cada uno), `firebase-config.js` (incluye que la VAPID es pública), Apps Script en general, GitHub Pages, vínculos generales y sus referencias (FCM, Leaflet, Nominatim, Apps Script).
- **Yeudiel** usa el mismo esquema: 7 (aportación y commits), 2, 3, 4 (casos `Y-nn`), 5 (evidencias sugeridas), 8 (conclusión firmada).
- **Mis partes en el repo:** `js/mapa.js` (Leaflet + OSM + Nominatim), `js/push.js`, `sw-push.js`, `demo-push.html`, `scripts/` (push), `js/heatmap.js` (aportación), `apps-script/Push.gs`, `apps-script/MapaCalor.gs` + `vista_mapacalor.html`, `entregables/Subproducto6_Notificaciones.pdf`.
- **Estado del despliegue:** `Push.gs` y `MapaCalor.gs` están en el PR #20, aún sin publicar en Google: sus pruebas en línea quedan como **Pendiente**.

## 3. Contenido de `docs/producto2/luis.md`
| Apartado | Contenido |
|---|---|
| `## 7. Aportación: Mapa de calor de incidentes` | Qué problema resuelve, parte cliente (`js/heatmap.js`) y parte servidor (`MapaCalor.gs`), y también mapa y notificaciones push. Tabla de mis commits con fecha y PR. |
| `## 2. Justificación…` (partes de Luis) | Tabla: Leaflet, OpenStreetMap, Nominatim, Leaflet.heat, FCM + Push API + Notifications API, Apps Script para el push (en lugar de Cloud Functions / script local), agregación en servidor por celdas. Con su alternativa descartada. |
| `## 3. Parámetros de configuración` (partes de Luis) | **FCM y VAPID** (clave pública en la app, privada en Firebase; API v1; cuenta de servicio solo en Propiedades del script), flujo del token y colección `tokens`, mensaje solo de datos y sus campos, `Urgency`/`TTL`, vibración por tipo, `notificationclick`. **Mapa** (centro, tiles, atribución, caché de mosaicos), **Nominatim** (parámetros de la petición, caché, política de uso). **Mapa de calor** (radio, desenfoque, gradiente, pesos, filtros). **Backend**: acción `push` y vista `mapacalor` (parámetros, celda, franjas, privacidad). Sin valores secretos. |
| `## 4. Reporte de pruebas` (casos `L-nn`) | Solo ✅ lo que se ejecutó, con fecha. Se ejecutan sobre la **app publicada** en `?demo=1` desde el navegador de esta sesión (mapa, puntos y popup, Nominatim, mapa de calor y filtros, demo push, service worker con `sw-push.js`) y con las pruebas locales del backend (`prueba_push`, `prueba_mapacalor`). Lo que necesita teléfono, cuenta real o el despliegue → **Pendiente**. |
| `## 5. Evidencias` (sugeridas) | Tabla de capturas que faltan tomar (como Yeudiel): mapa, mapa de calor, demo push, notificación recibida, reporte de servidor y su código fuente. **Sin imágenes** en este commit: las capturas se toman cuando el backend esté publicado. |
| `## 6. Vínculos` (partes de Luis) | Demo push y vista `?vista=mapacalor` (marcada como pendiente de despliegue). Solo URLs verificadas. |
| `## 8. Conclusión de Xicali Diaz Luis Alberto` | **Borrador** en primera persona que **tú debes leer y ajustar** antes de que Jaziel genere el PDF: es tu opinión, firmada con tu nombre. |
| `## Referencias` | APA 7: Push API, Notifications API, Vibration API, FCM (web), VAPID (RFC 8292), Leaflet.heat, OpenStreetMap tile usage policy. Sin repetir las de Jaziel. |

## 4. Archivos
| Archivo | Dueño | Cambio |
|---|---|---|
| `docs/producto2/luis.md` | Luis | Nuevo |
| `docs/specs/luis-03-seccion-producto2.md` | Luis | Esta spec |

No se tocan `generar_pdf.py`, `jaziel.md`, `yeudiel.md` ni `docs/PROGRESO_UNIDAD2.md`.

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica |
|---|---|---|
| CA-1 | `generar_pdf.py` lee `luis.md` y reparte sus apartados sin errores. | Ejecutar el generador a un PDF de borrador fuera del repo (si `reportlab` está disponible) o leer el archivo con su `leer_secciones` |
| CA-2 | Ningún resultado inventado: cada ✅ tiene fecha y fue ejecutado en esta tarea o en las tareas 2 y 3. | Revisión |
| CA-3 | Todas las URLs abren. | Comprobación HTTP |
| CA-4 | Sin secretos (solo la VAPID pública, ya publicada en `js/firebase-config.js`). | `grep` |

## 6. Resultado (24/11/2026)
| # | Verificación | Resultado |
|---|---|---|
| CA-1 | `python docs/producto2/generar_pdf.py <borrador fuera del repo>` con `reportlab` 4.2.5: genera el PDF del equipo (30 páginas, 11 figuras) sin errores; mis apartados caen en las secciones 2, 3, 4, 5, 6, 7 y 8, y mis referencias se juntan con las de Jaziel | ✅ |
| CA-2 | Casos L-01 a L-08 ejecutados el 24/11 en la app publicada (`?demo=1`) desde el navegador de la sesión; L-09 a L-11 son las pruebas locales de las tareas 2 y 3 (10/10, 6 casos, 9/9). L-12 a L-17 quedan como Pendiente | ✅ |
| CA-3 | Las 10 URLs de referencias y la de `demo-push.html` responden 200. La URL `?vista=mapacalor` queda marcada como disponible después del despliegue | ✅ |
| CA-4 | Solo aparece el inicio de la VAPID pública (`BEFD…`) y el `messagingSenderId`, que ya están publicados en `js/firebase-config.js` | ✅ |
| — | Capturas de evidencia | No incluidas: se toman cuando el backend esté publicado (lista en el apartado 5) |
