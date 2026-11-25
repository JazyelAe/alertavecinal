# Yeudiel · 04 · PDF individuales SP4, SP5, SP6 y SP7

**Dueño:** Gonzalez Barrios Yeudiel Nain (`yeudiel`) · Base: spec 04 de `docs/claude-kit/specs/` y la plantilla `docs/claude-kit/tools/utp_doc.py`.
**Nota:** los subproductos están vencidos en Classroom; se preparan por adelantado por si la profesora acepta la entrega tardía.

## Formato común
- `build_pdf(..., alumno="Gonzalez Barrios Yeudiel Nain", matricula="2311081344")`: portada UTP individual.
- Título `SUBPRODUCTO No. X: <TEMA>` · subtítulo `Actividad Desarrollo · Unidad II – Desarrollo de aplicaciones web progresivas`.
- Script: `docs/individual/yeudiel/generar_pdfs.py` (genera los 4). Capturas en `docs/individual/yeudiel/capturas/`.
- Salida: `entregables/SP4_API_Cache_Gonzalez.pdf`, `SP5_Aportacion_Gonzalez.pdf`, `SP6_Notificaciones_Gonzalez.pdf`, `SP7_Aportacion_Backend_Gonzalez.pdf`.
- Referencias en APA 7 (MDN, web.dev, Firebase, Google Apps Script). Cada PDF se revisa página por página convertido a PNG.

## Contenido
| PDF | Contenido (incisos de la profesora) | Capturas |
|---|---|---|
| **SP5 Aportación** | a) portada · b) Vecino Verificado Pro · c) categoría emprendimiento + innovación, justificada · d) problema · e) propuesta: flujo, pantallas y datos · f) valor agregado · g) diferenciador frente a grupos de WhatsApp vecinales y apps similares · h) imágenes reales y diagrama de flujo · conclusión | Panel Pro real, ficha del servidor, verificación en Administración |
| **SP7 Aportación – Backend** | resumen; arquitectura de Apps Script; tabla de la vista `vista_verificado` y la acción `accion_verificar` (método, entrada, salida, validaciones); código explicado de `Verificado.gs` y `vista_verificado.html`; **lista de cotejo de 20 características de la PWA** con cómo se verificó y su evidencia; conclusión | Ficha, código fuente, JSON de estado del backend, pruebas 12/12, DevTools (manifest, service worker, caché) |
| **SP6 Notificaciones** | propósito, características, ventajas y aplicaciones; componentes (Notifications API, Push API, service worker, FCM, VAPID, token, permiso, payload, primer y segundo plano); diagrama del flujo de AlertaVecinal; ejemplo con `demo-push.html` y un **ejemplo mínimo propio** con `registration.showNotification` | `demo-push.html` y notificación local |
| **SP4 API Caché** | qué es la caché y cómo funciona; estrategias y cuál usa AlertaVecinal; los 12 métodos de la API Cache con código del repo; `demo-cache.html` y Cache Storage; URL | `demo-cache.html`, DevTools → Cache Storage |

## Capturas
Se toman de la app publicada (`?demo=1` cuando no se necesita cuenta) con el navegador automatizado, más las evidencias reales que ya están en `docs/producto2/evidencias/yeudiel-*`. Las que requieren la cuenta real del integrante ya existen; no se inventa ninguna.

## Archivos que se tocan
| Archivo | Dueño |
|---|---|
| `docs/individual/yeudiel/**` | Yeudiel |
| `entregables/SP*_Gonzalez.pdf` | Yeudiel |
| `docs/specs/yeudiel-04-pdf-individuales.md` | Yeudiel |

## Ejemplo mínimo propio
`docs/individual/yeudiel/ejemplo/`: página con su propio manifest y service worker (`sw-ejemplo.js`, alcance solo esa carpeta). Usa los 12 métodos de la API Cache y `registration.showNotification()`. Se cita en SP4 y SP6.

## Pruebas (25/11/2026)
| Prueba | Resultado |
|---|---|
| `capturas.py` (Playwright + Edge) sobre la app publicada y el ejemplo en localhost | ✅ 24 capturas; datos medidos en `capturas/verificacion.json` (SW `alertavecinal-v7` activo, 25 entradas, backend con vista `verificado` y acción `verificar`) |
| Ejemplo propio: guardar, listar, buscar, `caches.has`, borrar, notificación | ✅ todos los botones responden; `getNotifications()` → 1 visible |
| `node apps-script/pruebas/prueba_verificado.mjs` | ✅ 12/12 |
| `generar_pdfs.py` → SP4 (14 págs.), SP5 (7), SP6 (7), SP7 (13) | ✅ revisados página por página como PNG |
| Enlaces de referencias y de la app | ✅ 200 (la URL del ejemplo propio queda activa al unirse el PR a `main`) |
