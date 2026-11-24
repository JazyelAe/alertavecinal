# Progreso · Unidad II · AlertaVecinal

Leyenda: ⬜ pendiente · 🟨 en curso · 🛑 esperando revisión · ✅ terminado (fusionado en `main`)
Entrega del Producto 2: **domingo 29 de noviembre de 2026**.

## Estado del repositorio (auditoría del 23/11/2026)
- `main` tiene 9 PR fusionados: #1, #2 y #5 a #9 (Jaziel), #3 (Yeudiel) y #4 (Luis). No hay PR abiertos.
- Luis y Yeudiel no han subido nada desde el 21/11.
- La app abre sin errores en GitHub Pages con `?demo=1`: https://jazyelae.github.io/alertavecinal/
- Único 404: `js/estadisticas.js` (de Yeudiel, pendiente). El cargador lo ignora; por eso aún no sale **Panel Pro**.
- `entregables/Subproducto4_API_Cache.pdf` ya es la versión final (PR #9). Los PDF finales del Subproducto 5, el Subproducto 6 y la guía están en los zips más recientes de Luis y Yeudiel.
- El push publicado sigue en `scripts/apps-script/Codigo.gs` (`PUSH_ENDPOINT`). El backend nuevo está en `apps-script/` y se despliega aparte (`URL_BACKEND`) hasta que Luis suba `Push.gs`.
- No hay secretos en el historial (ninguna `BEGIN PRIVATE KEY`).
- `clasp` no está instalado en la PC de Jaziel (se necesita para el despliegue).

## ▶ Lo que falta, por persona (léelo primero)

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
Ya está en `main`: panel de administración y botón de instalar (PR #3). No los repitas.

| # | Commit | Fecha límite |
|---|---|---|
| 1 | `Aportación: Vecino Verificado Pro`: `estadisticas.html` + `js/estadisticas.js` con datos reales (parte de tu zip, `paso-10`) | Mar 24 nov |
| 2 | `Documentación Subproducto 5 y guía del repositorio`: los PDF finales y la guía de tu zip (`paso-14`), sin regenerarlos y **sin** el README | Mar 24 nov |
| 3 | `Vista de servidor: ficha de Vecino Verificado`: `Verificado.gs` + `vista_verificado.html` | Mar 24 nov |
| 4 | `docs: sección de Yeudiel para el Producto 2`: `docs/producto2/yeudiel.md` | Jue 26 nov |
| 5 | `Documentación del README`: `README.md` completo (spec 03) | Vie 27 nov |
| 6 | PDF individuales SP5, SP7, SP6 y SP4 | Solo cuando Jaziel lo indique |

### Jaziel
- Unir los Pull Request de Luis y Yeudiel (*Merge pull request* > *Create a merge commit*).
- Publicar `firestore.rules` y probar la cámara en el teléfono (pendiente del PR #8).
- Despliegue con clasp (`URL_BACKEND`) cuando estén `Push.gs`, `MapaCalor.gs` y `Verificado.gs`.
- Pruebas con la base real y documento del Producto 2.

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
| — | Despliegue (clasp, URL_BACKEND, Pages, dominios de Firebase) | ⬜ | Cuando Luis y Yeudiel fusionen sus partes |
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
| 3 | Aportación: Vecino Verificado Pro | ⬜ | `estadisticas.html` y `js/estadisticas.js` con datos reales |
| 4 | Documentación Subproducto 5 y guía del repositorio | ⬜ | PDF finales y guía ya incluidos en su zip (`paso-14`) |
| 5 | Vista de servidor: ficha de Vecino Verificado | ⬜ | `Verificado.gs`, `vista_verificado.html`; el núcleo ya está en `main` |
| 6 | docs: sección de Yeudiel para el Producto 2 | ⬜ | `docs/producto2/yeudiel.md` |
| 7 | Documentación del README | ⬜ | Al final, con la URL y las capturas |

## Datos del equipo
- Matrículas confirmadas por Jaziel el 21/11/2026: Luis 2311081407 · Yeudiel 2311081344 (ya en `CLAUDE.md`).
