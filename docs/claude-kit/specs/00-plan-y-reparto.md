# 00 · Plan, reparto de archivos y calendario

## Diagnóstico (20 nov 2026)
Repo `alertavecinal` (main): Jaziel ya subió la base, la conversión a PWA, "Alerta sin señal" y la doc del SP4. Yeudiel ya subió el panel de administración y el botón de instalar.
**Faltan**: todos los commits de Luis y los commits 3–4 de Yeudiel. Además, para cumplir el Producto 2 hay que cerrar estos huecos:

| Requisito del Producto 2 | Estado | Cómo se cierra |
|---|---|---|
| Vistas del lado del cliente | ✅ | Ya existe (render con JS) |
| **Vistas del lado del servidor** | ❌ | **Apps Script + HtmlService**: cada integrante agrega una página generada en servidor ligada a su aportación (spec 01) |
| Datos locales | ✅ | IndexedDB (Alerta sin señal), localStorage |
| Datos remotos | ✅ | Firestore en tiempo real, Nominatim, Apps Script |
| Datos offline | ✅/⚠️ | Cache Storage + offline.html + Background Sync. Falta activar la persistencia offline de Firestore (spec 02) |
| Notificaciones | ⏳ | Push FCM + Apps Script (commits de Luis) |
| Elementos físicos del dispositivo | ⚠️ | Hoy solo hay geolocalización. Agregar cámara, vibración y compartir (spec 02) |
| Documento del Producto 2 | ❌ | Spec 03 |

## Reparto de archivos (cada archivo tiene UN dueño)
| Integrante | Archivos que crea o modifica | Commits sugeridos |
|---|---|---|
| **Jaziel** | `CLAUDE.md`, `docs/claude-kit/**`, `index.html`, `css/estilos.css`, `js/auth.js`, `js/alertas.js`, `js/app.js`, `js/firebase-config.js`, `js/offline-sync.js`, `sw.js`, `sw-sync.js`, `manifest.json`, `firestore.rules`, `firebase.json`, `apps-script/appsscript.json`, `apps-script/Comun.gs`, `apps-script/SinSenal.gs`, `apps-script/vista_boletin.html`, `apps-script/Boletin.gs`, `docs/specs/*` propias, `entregables/Producto2_*`, `entregables/SP*_Serrano.pdf` | 1 `docs: kit de especificaciones Unidad II` · 2 `Backend: núcleo de Apps Script (router, Firestore y sesión)` · 3 `Vista de servidor: boletín público de alertas` · 4 `Backend de la aportación Alerta sin señal` · 5 `Dispositivo: cámara, vibración y compartir en alertas` · 6 `Datos offline: persistencia de Firestore` · 7 `Documentación Producto 2` |
| **Luis** | `js/mapa.js`, `js/push.js`, `sw-push.js`, `demo-push.html`, `js/heatmap.js`, `apps-script/Push.gs`, `apps-script/MapaCalor.gs`, `apps-script/vista_mapacalor.html`, `entregables/SP6_*`, sus PDF individuales | 1 `Mapa de alertas con Leaflet y Nominatim` · 2 `Notificaciones push con FCM y Apps Script` · 3 `Aportación: Mapa de calor de incidentes` · 4 `Vista de servidor: reporte de mapa de calor` · 5 `Documentación Subproducto 6` |
| **Yeudiel** | `admin.html`, `js/admin.js`, `js/instalar.js`, `estadisticas.html`, `js/estadisticas.js`, `apps-script/Verificado.gs`, `apps-script/vista_verificado.html`, `README.md`, `entregables/SP5_*`, sus PDF individuales | 3 `Aportación: Vecino Verificado Pro` · 4 `Vista de servidor: ficha de Vecino Verificado` · 5 `Documentación Subproducto 5 y README` |

**Archivos compartidos sin conflicto:**
- `index.html` ya carga los módulos con un cargador que ignora los que aún no existen. Cada módulo agrega su propio enlace al menú.
- `sw.js` ya hace `importScripts('sw-push.js')` y `importScripts('sw-sync.js')` dentro de `try/catch`.
- En Apps Script, `Comun.gs` (Jaziel) tiene el router. Los demás solo agregan funciones con nombre fijo en **sus** archivos (ver spec 01), así nadie edita el archivo de otro.

## Orden de turnos
| Turno | Quién | Qué | Depende de |
|---|---|---|---|
| 1 | Jaziel | Commits 1–2: kit + núcleo de Apps Script (router) | — |
| 2 (en paralelo) | Luis | Commits 1–3: mapa, push, mapa de calor | Turno 1 para `Push.gs` |
| 2 (en paralelo) | Yeudiel | Commit 3: Vecino Verificado Pro | — |
| 2 (en paralelo) | Jaziel | Commits 3–6: boletín, backend Sin señal, dispositivo, persistencia | Turno 1 |
| 3 | Luis y Yeudiel | Su vista de servidor (commit 4) | Turno 1 |
| 4 | Jaziel | Despliegue: Apps Script + Pages; pruebas integrales | Todo lo anterior en `main` |
| 5 | Los 3 | Capturas, PDFs individuales, README (Yeudiel), Producto 2 (Jaziel) | Turno 4 |

## Calendario propuesto (entrega domingo 29 de noviembre)
| Fecha | Meta |
|---|---|
| Sáb 21 – Dom 22 nov | Turno 1 + arranque del turno 2 |
| Lun 23 – Mar 24 nov | Turnos 2 y 3 terminados y fusionados en `main` |
| Mié 25 nov | Turno 4: despliegue y pruebas integrales |
| Jue 26 – Vie 27 nov | Producto 2 (documento), README y capturas |
| Sáb 28 nov | Revisión final en equipo y corrección |
| Dom 29 nov | Entrega en Classroom (cada quien sube el PDF y el enlace del repo) |
