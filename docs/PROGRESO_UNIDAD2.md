# Progreso · Unidad II · AlertaVecinal

Leyenda: ⬜ pendiente · 🟨 en curso · 🛑 esperando revisión · ✅ terminado (fusionado en `main`)
Entrega del Producto 2: **domingo 29 de noviembre de 2026**.

## Estado del repositorio (auditoría del 23/11/2026, noche)
- `main` tiene 17 PR fusionados: #1, #2, #5 a #10 y #13 a #17 (Jaziel), #3, #11 y #12 (Yeudiel) y #4 (Luis). No hay PR abiertos.
- Yeudiel subió el 23/11 Vecino Verificado Pro, la ficha de servidor y su sección del Producto 2 (PR #11 y #12).
- Luis no ha subido nada desde el 21/11.
- La app abre sin errores en GitHub Pages, con **Panel Pro** y **Boletín** en el menú: https://jazyelae.github.io/alertavecinal/. Ningún recurso da 404.
- `entregables/Subproducto4_API_Cache.pdf` ya es la versión final (PR #9). Los PDF finales del Subproducto 5, el Subproducto 6 y la guía están en los zips más recientes de Luis y Yeudiel.
- **Backend publicado** (proyecto *AlertaVecinal Backend*, implementación *Backend v3*): https://script.google.com/macros/s/AKfycbyA-8YNUHxTZ0XILx0vCNW0PV-lX_SlT-zDDEMG_7wUcgRelPpH_9_MfC0GzfSZihiJkg/exec. Responde `configurado: true`; funcionan en línea la vista `boletin`, la vista `verificado` y las acciones `alerta_sin_senal` y `verificar`. `URL_BACKEND` ya está en la app y `sw.js` subió a v7 (PR #15).
- **Error corregido (PR #16 y #17):** las dos plantillas tenían etiquetas `<?= ?>` dentro de un comentario y fallaban en Google con *Unexpected token ';'*. Se corrigió la línea 5 de `vista_boletin.html` y la de `vista_verificado.html` (de Yeudiel). **Luis y Yeudiel deben hacer `git pull origin main` antes de seguir.**
- El push publicado sigue en `scripts/apps-script/Codigo.gs` (`PUSH_ENDPOINT`) hasta que Luis suba `Push.gs`.
- `firestore.rules` publicadas el 23/11, con foto de la cámara y verificación protegida (PR #14).
- No hay secretos en el historial (ninguna `BEGIN PRIVATE KEY`).

## ▶ Lo que falta, por persona (léelo primero)

> ⚠ **Luis y Yeudiel: antes de cualquier cosa, `git switch <tu rama>` y `git pull origin main --no-edit`.** Tu Claude lo hace en el paso 0 de tu prompt.

**Cómo trabajar:** sigue tu prompt de `docs/claude-kit/prompts/`; ahí están los comandos para actualizar tu rama y el texto que pegas en Claude Code. Cada tarea es un commit en tu rama y un Pull Request a `main`. **Este archivo lo actualiza solo Jaziel**, para evitar conflictos.

### Luis · prompt `docs/claude-kit/prompts/PROMPT_LUIS.md`
Ya está en `main`: mapa, push con FCM y mapa de calor (PR #4). No los repitas.

| # | Commit | Fecha límite |
|---|---|---|
| 1 | `Documentación Subproducto 6`: el PDF final de tu zip (`paso-13`), sin regenerarlo | Mar 24 nov |
| 2 | `Push desde el backend de Apps Script`: `apps-script/Push.gs` (`accion_push`) y `vibrate` en `sw-push.js`. **No borres** `scripts/apps-script/Codigo.gs` | Mar 24 nov |
| 3 | `Vista de servidor: reporte de mapa de calor`: `MapaCalor.gs` + `vista_mapacalor.html` y el enlace desde `js/heatmap.js` | Mar 24 nov |
| 4 | `docs: sección de Luis para el Producto 2`: `docs/producto2/luis.md` | Jue 26 nov |
| 5 | PDF individuales SP6, SP5 y SP7 | Solo cuando Jaziel lo indique |

### Yeudiel · prompt `docs/claude-kit/prompts/PROMPT_YEUDIEL.md`
Ya está en `main`: panel de administración y botón de instalar (PR #3), Vecino Verificado Pro (PR #11), ficha de servidor y tu sección del Producto 2 (PR #12). No los repitas.

| # | Commit | Estado | Fecha límite |
|---|---|---|---|
| 1 | `Aportación: Vecino Verificado Pro` | ✅ PR #11 | — |
| 2 | `Documentación Subproducto 5 y guía del repositorio`: los PDF finales y la guía de tu zip (`paso-14`), sin regenerarlos y **sin** el README | ⬜ **Falta** | Mar 24 nov |
| 3 | `Vista de servidor: ficha de Vecino Verificado` | ✅ PR #12 | — |
| 4 | `docs: sección de Yeudiel para el Producto 2` | ✅ PR #12 | — |
| 5 | `Documentación del README`: `README.md` completo (spec 03) | ⬜ | Vie 27 nov |
| 6 | PDF individuales SP5, SP7, SP6 y SP4 | ⬜ | Solo cuando Jaziel lo indique |

### Jaziel
- Unir los Pull Request de Luis y Yeudiel (*Merge pull request* > *Create a merge commit*).
- ✅ Publicar `firestore.rules` (23/11). ⬜ Probar la cámara en el teléfono.
- ✅ Primer despliegue del backend y `URL_BACKEND` (23/11). ⬜ Cuando Luis suba `Push.gs` y `MapaCalor.gs`: `clasp push` y `clasp deploy -i` con la misma implementación.
- ⬜ Escribir `docs/producto2/jaziel.md` y el script del PDF del Producto 2.
- ⬜ Pruebas con la base real y documento final del Producto 2.

En cada PR, Luis y Yeudiel avisan si Jaziel debe hacer `clasp push` y una nueva implementación.

## Jaziel (`jaziel`)
| # | Commit | Estado | Notas |
|---|---|---|---|
| — | Aplicación web base · Conversión a PWA · Alerta sin señal · Documentación SP4 | ✅ | Unidad anterior, ya en `main` |
| 1 | `docs: kit de especificaciones Unidad II` | ✅ | PR #5 fusionado el 21/11 |
| 2 | Backend: núcleo de Apps Script (router, Firestore y sesión) | ✅ | PR #6. Prueba local 13/13 |
| 3 | Vista de servidor: boletín público de alertas | ✅ | PR #7. Prueba local 9/9 |
| 4 | Backend de la aportación Alerta sin señal | ✅ | PR #7. Prueba local 9/9 (incluye la foto) |
| 5 | Dispositivo: cámara, vibración y compartir en alertas | ✅ | PR #8 (Pages en v6). Falta: Jaziel publica `firestore.rules` y prueba en su teléfono |
| 6 | Datos offline: persistencia de Firestore | ✅ | PR #8. Caché `persistent` verificada |
| — | Despliegue (clasp, URL_BACKEND, Pages, dominios de Firebase) | 🟨 | Backend v3 publicado y `URL_BACKEND` en la app (PR #15 a #17). Falta publicar `Push.gs` y `MapaCalor.gs` cuando Luis los suba |
| 7 | Documentación Producto 2 | ⬜ | `entregables/Producto2_AlertaVecinal_Equipo.pdf` |
| — | PDF individuales SP4–SP7 | ⬜ | Solo cuando Jaziel lo indique |

## Luis (`luis`)
| # | Commit | Estado | Notas |
|---|---|---|---|
| 1 | Mapa de alertas con Leaflet y Nominatim | ✅ | PR #4 |
| 2 | Notificaciones push con FCM | ✅ | PR #4. Falta migrar `Codigo.gs` → `apps-script/Push.gs` (`accion_push`) |
| 3 | Aportación: Mapa de calor de incidentes | ✅ | PR #4 |
| 4 | Documentación Subproducto 6 | ⬜ | PDF final ya incluido en su zip (`paso-13`) |
| 5 | Push desde el backend de Apps Script | ⬜ | `apps-script/Push.gs` (`accion_push`) y `vibrate` en `sw-push.js` |
| 6 | Vista de servidor: reporte de mapa de calor | ⬜ | `MapaCalor.gs`, `vista_mapacalor.html`; el núcleo de Jaziel ya está en `main` |
| 7 | docs: sección de Luis para el Producto 2 | ⬜ | `docs/producto2/luis.md` |

## Yeudiel (`yeudiel`)
| # | Commit | Estado | Notas |
|---|---|---|---|
| 1 | Panel de administración de usuarios | ✅ | PR #3 |
| 2 | Botón de instalación de la PWA | ✅ | PR #3 |
| 3 | Aportación: Vecino Verificado Pro | ✅ | PR #11 (23/11). Panel Pro visible en Pages |
| 4 | Documentación Subproducto 5 y guía del repositorio | ⬜ | PDF finales y guía ya incluidos en su zip (`paso-14`) |
| 5 | Vista de servidor: ficha de Vecino Verificado | ✅ | PR #12 (23/11). Funciona en línea cuando Jaziel despliegue el backend |
| 6 | docs: sección de Yeudiel para el Producto 2 | ✅ | PR #12 (23/11) |
| 7 | Documentación del README | ⬜ | Al final, con la URL y las capturas |

## Datos del equipo
- Matrículas confirmadas por Jaziel el 21/11/2026: Luis 2311081407 · Yeudiel 2311081344 (ya en `CLAUDE.md`).
