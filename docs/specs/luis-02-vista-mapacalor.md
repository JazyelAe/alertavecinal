# Spec · Vista de servidor: reporte de mapa de calor (Luis · tarea 3)

**Basada en:** `docs/claude-kit/specs/01-vistas-servidor-apps-script.md` (RF-L2) y el contrato de `apps-script/Comun.gs`
**Dueño:** Luis · **Rama:** `luis`
**Estado:** aprobada el 24/11/2026 · implementada · pendiente de desplegar en Google (Jaziel)

## 1. Objetivo
Mi aportación (mapa de calor, `js/heatmap.js`) hoy se calcula **en el navegador** con las alertas que el vecino ya tiene. Esta tarea agrega su versión **generada en el servidor**: Apps Script lee las alertas de Firestore, las **agrega por zona y por tipo** y arma el HTML con los resultados ya calculados. Es la evidencia de «vistas generadas del lado del servidor» de mi parte y el backend de mi aportación (SP7).

## 2. Auditoría
- **Núcleo (`Comun.gs`, Jaziel):** `GET ?vista=mapacalor` → `vista_mapacalor(e)`; `consultar_('alertas', {desde, orden, limite})`; `renderVista_(archivo, datos, título)` agrega `datos.generadoEn`; `estilosComunes_()`; `redondearCoord_()`; `escaparHtml_()`.
- **Ejemplo del equipo:** `Boletin.gs` + `vista_boletin.html` (público, sin datos personales, pie «Generado en el servidor»). Ojo con el error de los PR #16/#17: **no** escribir etiquetas `<? ?>` dentro de comentarios HTML.
- **Alertas en Firestore:** `tipo`, `descripcion`, `direccion` («Av. Juárez 152, Centro, Puebla»), `lat`, `lng`, `uid`, `nombre`/`autor`, `creado`, `origen`.
- **`js/heatmap.js`:** tarjeta con filtros (tipo, fechas), capa Leaflet.heat y resumen de calles. No tiene enlace al servidor.
- **Menú:** `agregarMenu()` de `js/auth.js`; el Boletín (Jaziel) abre en pestaña nueva y avisa si no hay conexión. Mismo patrón aquí.

## 3. Requisitos
### `apps-script/MapaCalor.gs` + `apps-script/vista_mapacalor.html`
| # | Requisito |
|---|---|
| RF-1 | `vista_mapacalor(e)` consulta en el servidor las alertas de los **últimos 30 días** (parámetro opcional `dias` ∈ {7, 30, 90}; máximo 1000 alertas). Parámetro opcional `tipo` ∈ {robo, medica, gas, otro}; cualquier otro valor = todos. |
| RF-2 | **Agregación en servidor por celda** de ≈ 500 m (rejilla de 0.005°): para cada celda, total, conteo por tipo y centro de la celda. Ordenadas de mayor a menor. |
| RF-3 | **Por zona** (colonia: la dirección sin calle ni número, p. ej. «Centro, Puebla»): conteo y la **zona más reportada**. |
| RF-4 | **Franja horaria más frecuente** en bloques de 4 h (00–04, 04–08, …, 20–24), hora del centro de México (UTC−6, sin horario de verano desde 2022), con su conteo por franja. |
| RF-5 | La plantilla muestra: cifras (total, zona más reportada, franja más frecuente), **tabla de celdas** (posición aproximada, total, por tipo), tabla por franja horaria y un **mapa Leaflet** con círculos cuyos datos ya vienen calculados en el HTML (el navegador no consulta Firestore). Sin JavaScript, las tablas siguen visibles. |
| RF-6 | **Privacidad (vista pública):** sin nombres, descripciones, calles, números ni coordenadas exactas; solo el centro de la celda (3 decimales) y la colonia. Los datos que van dentro del `<script>` se serializan escapando `<` para que una dirección no pueda cerrar la etiqueta. |
| RF-7 | Pie «Generado en el servidor (Google Apps Script) el …» y enlace de regreso a la app. |

### `js/heatmap.js`
| # | Requisito |
|---|---|
| RF-8 | Si existe `URL_BACKEND`: enlace **«Reporte de calor»** en el menú y enlace **«Ver reporte generado en el servidor»** en la tarjeta, que respeta el tipo elegido en el filtro. Abren en pestaña nueva. Sin conexión, avisa que el reporte necesita Internet. Sin `URL_BACKEND` (o en `?demo=1` sin backend), no aparecen y la tarjeta funciona igual que hoy. |

## 4. Archivos
| Archivo | Dueño | Cambio |
|---|---|---|
| `apps-script/MapaCalor.gs` | Luis | Nuevo |
| `apps-script/vista_mapacalor.html` | Luis | Nuevo |
| `js/heatmap.js` | Luis | Enlaces al reporte |
| `apps-script/pruebas/prueba_mapacalor.mjs` | Luis | Nuevo (prueba local) |
| `docs/specs/luis-02-vista-mapacalor.md` | Luis | Esta spec |

`sw.js` guarda en caché `js/heatmap.js` → pedir a Jaziel subir `VERSION` (se junta con la de la tarea 2).

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica |
|---|---|---|
| CA-1 | `GET` del backend lista la vista `mapacalor`. | Prueba local |
| CA-2 | Agrega bien: celdas, zonas, zona más reportada, franjas; respeta `dias` y `tipo`; ignora alertas sin coordenadas en el mapa pero las cuenta por zona y hora. | Prueba local con Firestore simulado |
| CA-3 | El HTML generado trae los datos incrustados y el pie de servidor. | Prueba local + captura del HTML |
| CA-4 | Privacidad: ningún nombre, descripción, calle o coordenada exacta en el HTML; una dirección con `</script>` no rompe la página. | Prueba local |
| CA-5 | Enlaces en la PWA solo con `URL_BACKEND`; la tarjeta sigue funcionando en `?demo=1`. | Navegador local |
| CA-6 | Funciona en Google con Firestore real. | Despliegue de Jaziel |

## 6. Pruebas (24/11/2026)
| # | Prueba | Resultado |
|---|---|---|
| CA-1 a CA-4 | `node apps-script/pruebas/prueba_mapacalor.mjs` (simulador del equipo, 10 alertas de ejemplo): lista la vista; 30 días → 8 alertas en 3 celdas, Centro primero con 4 (2 robo, 1 gas, 1 médica); zona más reportada «Centro, Puebla» (5, incluye una alerta sin coordenadas); franja 20:00–24:00 (5); `dias=90` suma la alerta vieja, `tipo=gas` filtra, valores raros caen en 30 días / todos; datos incrustados y pie de servidor; sin nombres, descripciones, calles, números ni coordenadas exactas; una dirección con `</script>` no inyecta código; sin alertas → página sin mapa | ✅ 9/9 |
| — | Pruebas del equipo siguen pasando (`prueba_comun`, `prueba_boletin`, `prueba_sin_senal`, `prueba_verificado`, `prueba_push`) | ✅ 13/13, 9/9, 9/9, 12/12, 10/10 |
| CA-3 | El HTML generado por la prueba, abierto en el navegador: cifras, mapa Leaflet con 3 círculos, tablas por zona, franja y colonia; la dirección maliciosa se ve como texto y no ejecuta nada | ✅ |
| CA-5 | `http://localhost:3000/?demo=1` con el service worker limpio: aparece «Reporte de calor» en el menú (pestaña nueva) y «Ver reporte generado en el servidor» en la tarjeta; al elegir «Fuga de gas» el enlace cambia a `&tipo=gas`; la tarjeta y sus filtros funcionan como antes; sin errores en consola | ✅ |
| — | Aviso sin conexión al pulsar el enlace | No probado en el navegador (mismo código que el Boletín de Jaziel) |
| CA-6 | Vista en Google con Firestore real | ⏳ Pendiente del despliegue de Jaziel |

**Despliegue (Jaziel):** `clasp push` y `clasp deploy -i <id de Backend v3>` para que `URL_BACKEND?vista=mapacalor` exista (hasta entonces el router muestra «La vista «mapacalor» no existe (todavía)»). Subir `VERSION` en `sw.js`, porque cambia `js/heatmap.js` (junto con los cambios de la tarea 2).
