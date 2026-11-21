# Progreso · Unidad II · AlertaVecinal

Leyenda: ⬜ pendiente · 🟨 en curso · 🛑 esperando revisión · ✅ terminado (fusionado en `main`)
Entrega del Producto 2: **domingo 29 de noviembre de 2026**.

## Estado del repositorio (auditoría del 21/11/2026)
- `main` tiene 4 PR fusionados: #1 y #2 (Jaziel), #3 (Yeudiel) y #4 (Luis).
- La app abre en local y en GitHub Pages con `?demo=1`: https://jazyelae.github.io/alertavecinal/
- Único 404: `js/estadisticas.js` (de Yeudiel, pendiente). El cargador lo ignora.
- El push publicado sigue en `scripts/apps-script/Codigo.gs` (`PUSH_ENDPOINT`). El backend nuevo está en `apps-script/` y se despliega aparte (`URL_BACKEND`) hasta que Luis suba `Push.gs`.
- No hay secretos en el historial (ninguna `BEGIN PRIVATE KEY`).
- `clasp` no está instalado en la PC de Jaziel (se necesita para el despliegue).

## Jaziel (`jaziel`)
| # | Commit | Estado | Notas |
|---|---|---|---|
| — | Aplicación web base · Conversión a PWA · Alerta sin señal · Documentación SP4 | ✅ | Unidad anterior, ya en `main` |
| 1 | `docs: kit de especificaciones Unidad II` | ✅ | PR #5 fusionado el 21/11 |
| 2 | Backend: núcleo de Apps Script (router, Firestore y sesión) | 🛑 | PR abierto. Prueba local 13/13. Ya pueden programar `Push.gs`, `MapaCalor.gs` y `Verificado.gs` contra los contratos de `Comun.gs` |
| 3 | Vista de servidor: boletín público de alertas | ⬜ | `Boletin.gs`, `vista_boletin.html` |
| 4 | Backend de la aportación Alerta sin señal | ⬜ | `SinSenal.gs` + `js/offline-sync.js` |
| 5 | Dispositivo: cámara, vibración y compartir en alertas | ⬜ | `js/alertas.js`, `firestore.rules`, `sw.js` |
| 6 | Datos offline: persistencia de Firestore | ⬜ | |
| — | Despliegue (clasp, URL_BACKEND, Pages, dominios de Firebase) | ⬜ | Cuando Luis y Yeudiel fusionen sus partes |
| 7 | Documentación Producto 2 | ⬜ | `entregables/Producto2_AlertaVecinal_Equipo.pdf` |
| — | PDF individuales SP4–SP7 | ⬜ | Solo cuando Jaziel lo indique |

## Luis (`luis`)
| # | Commit | Estado | Notas |
|---|---|---|---|
| 1 | Mapa de alertas con Leaflet y Nominatim | ✅ | PR #4 |
| 2 | Notificaciones push con FCM | ✅ | PR #4. Falta migrar `Codigo.gs` → `apps-script/Push.gs` (`accion_push`) |
| 3 | Aportación: Mapa de calor de incidentes | ✅ | PR #4 |
| 4 | Vista de servidor: reporte de mapa de calor | ⬜ | `MapaCalor.gs`, `vista_mapacalor.html`; depende del núcleo de Jaziel |
| 5 | Documentación Subproducto 6 | ⬜ | |

## Yeudiel (`yeudiel`)
| # | Commit | Estado | Notas |
|---|---|---|---|
| 1 | Panel de administración de usuarios | ✅ | PR #3 |
| 2 | Botón de instalación de la PWA | ✅ | PR #3 |
| 3 | Aportación: Vecino Verificado Pro | ⬜ | Incluye `estadisticas.html` y `js/estadisticas.js` |
| 4 | Vista de servidor: ficha de Vecino Verificado | ⬜ | `Verificado.gs`, `vista_verificado.html`; depende del núcleo |
| 5 | Documentación Subproducto 5 y README | ⬜ | |

## Datos del equipo pendientes de confirmar
- Matrícula de Luis (su correo institucional sugiere 2311081407).
- Matrícula de Yeudiel (su correo institucional sugiere 2311081344).
