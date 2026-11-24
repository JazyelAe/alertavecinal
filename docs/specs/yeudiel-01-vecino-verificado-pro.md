# Yeudiel · 01 · Aportación: Vecino Verificado Pro (panel con datos reales)

**Dueño:** Gonzalez Barrios Yeudiel Nain (`yeudiel`) · **Fecha límite del PR:** martes 24 de noviembre de 2026
**Commit:** `Aportación: Vecino Verificado Pro`

## Objetivo
Publicar en la app el panel **Panel Pro** de la aportación *Vecino Verificado Pro* (Subproducto 5) y que sus indicadores salgan de los **datos reales de Firestore**, no de una maqueta. Hoy `js/estadisticas.js` no existe en `main`: es el único 404 de la app y por eso no aparece **Panel Pro** en el menú.

## Punto de partida
- Archivos del zip `paso-10_vecino-verificado-pro`: `estadisticas.html` y `js/estadisticas.js`. Calculan indicadores de colonia (total, tipo más frecuente, horario, calles, caseta) con el evento `av:alertas` de `js/alertas.js`, que ya escucha la colección `alertas` de Firestore en tiempo real (`onSnapshot`, últimas 200).
- No calculan nada **por vecino** (alertas por vecino, alertas útiles, antigüedad ni insignia), que es la parte "Vecino Verificado" de la propuesta.

## Datos disponibles (sin cambiar reglas ni archivos de otros)
| Dato | Fuente | Quién lo puede leer (`firestore.rules`) |
|---|---|---|
| Alertas: `tipo`, `descripcion`, `lat`, `lng`, `direccion`, `uid`, `nombre`, `creado`, `foto` (opcional) | `alertas` vía `av:alertas` / `window.AV.alertas` | Vecinos aprobados |
| Mi perfil: `creado`, `estado`, `rol` | `onSesion` (`js/auth.js`) | Cada quien el suyo |
| Perfiles de todos (`creado`, `estado`) | colección `usuarios` | **Solo el admin** |

No existe un campo "útil" en las alertas y solo el admin puede editarlas, así que **"alerta útil" se define con criterios objetivos sobre los datos que ya existen** (ver RF-3). No se modifica `firestore.rules` (es de Jaziel).

## Requisitos
- **RF-1** `estadisticas.html` y `js/estadisticas.js` en la raíz, partiendo del zip. El panel solo se muestra a vecinos **aprobados**; a los demás se les invita a iniciar sesión o a ver el modo `?demo=1`.
- **RF-2** `js/estadisticas.js` agrega **Panel Pro** al menú (con `agregarMenu`) para vecinos aprobados, conservando `?demo=1` en el enlace cuando aplique.
- **RF-3 Alerta útil**: una alerta cuenta como útil si trae **ubicación GPS** (`lat` y `lng` numéricos) **y** una descripción de al menos 15 caracteres, **o** si trae **foto** de evidencia. Son alertas que permiten actuar sin pedir más datos.
- **RF-4 Alertas por vecino**: tabla "Vecinos más activos" con, por vecino: nombre, alertas totales, alertas útiles, % útil, antigüedad e insignia. Ordenada por alertas útiles.
- **RF-5 Antigüedad**: días desde el alta del perfil (`usuarios.creado`). El admin la ve para todos (lee `usuarios` en tiempo real). Un vecino la ve exacta solo para sí mismo; para los demás se muestra "desde su primera alerta". Así se respetan las reglas de Firestore.
- **RF-6 Insignia** (calculada en el cliente):
  | Insignia | Condición |
  |---|---|
  | Guardián | ≥ 8 alertas útiles y ≥ 90 días de antigüedad |
  | Vecino confiable | ≥ 3 alertas útiles y ≥ 30 días |
  | Colaborador | ≥ 1 alerta útil |
  | Nuevo | Sin alertas útiles |
- **RF-7 Mi ficha**: tarjeta con las alertas del vecino que tiene la sesión abierta: totales, útiles, antigüedad e insignia, y qué le falta para la siguiente insignia.
- **RF-8** Se conservan los indicadores de colonia del zip, ya con datos reales: total del periodo y cambio contra el anterior, tipo más frecuente, vecinos que reportaron, horario de mayor riesgo y calles con más incidentes.
- **RF-9** Los textos "maqueta" quedan solo donde la función sigue siendo simulada: cobro, reporte PDF (usa imprimir) y aviso a caseta. Los indicadores dicen que son datos reales de Firestore (o de ejemplo en `?demo=1`).
- **RF-10** Sin errores en consola propios del módulo; nada de datos sensibles (correo, teléfono, ubicación exacta) en la tabla de vecinos.

## Fuera de alcance (otras tareas)
- Ficha pública en servidor (`apps-script/Verificado.gs`, tarea 3) y su enlace desde este módulo.
- Cambios a `firestore.rules`, `sw.js` (`VERSION`) o `index.html` (son de Jaziel). Si hace falta cachear `estadisticas.html` en el service worker, se le pide a Jaziel.

## Archivos que se tocan
| Archivo | Dueño | Cambio |
|---|---|---|
| `estadisticas.html` | Yeudiel | Nuevo (a partir del zip) |
| `js/estadisticas.js` | Yeudiel | Nuevo (a partir del zip) |
| `docs/specs/yeudiel-01-vecino-verificado-pro.md` | Yeudiel | Esta spec |

## Criterios de aceptación
- [ ] Con `?demo=1` aparece **Panel Pro** en el menú y el panel abre con indicadores, gráficas, tabla de vecinos y "Mi ficha".
- [ ] La tabla de vecinos muestra alertas totales, útiles, antigüedad e insignia, sin correos ni ubicaciones exactas.
- [ ] Sin sesión (o con cuenta pendiente) el panel no se muestra.
- [ ] La consola ya no muestra el 404 de `js/estadisticas.js`.
- [ ] `git status` antes del commit solo muestra `estadisticas.html`, `js/estadisticas.js` y esta spec.

## Pruebas (23/11/2026)
Servidor local `npx http-server -p 3000 -c-1`, navegador Chromium.

| # | Prueba | Resultado |
|---|---|---|
| 1 | `node --check js/estadisticas.js` | ✅ Sintaxis correcta |
| 2 | `http://localhost:3000/?demo=1`: el menú muestra **Panel Pro** con enlace `estadisticas.html?demo=1` | ✅ |
| 3 | Panel Pro en demo: indicadores (40 alertas en 30 días, tipo más frecuente Robo 48 %, 5 vecinos, 27 avisos a caseta), gráfica por tipo, horario de mayor riesgo y calles | ✅ |
| 4 | Tabla **Vecinos más activos**: nombre, alertas, útiles (%), antigüedad e insignia; sin correos ni ubicaciones | ✅ (Juan Pérez 12/12, Vecino confiable; María López 7/7, Colaborador) |
| 5 | **Mi ficha** de la usuaria demo: 7 alertas, 7 útiles, 15 días desde su primera alerta, insignia Colaborador y "le faltan 15 días para Vecino confiable" | ✅ |
| 6 | `estadisticas.html` sin `?demo=1` y sin sesión: se ve la tarjeta para iniciar sesión y el panel queda oculto | ✅ |
| 7 | Consola: ya no aparece el 404 de `js/estadisticas.js` ni errores del módulo | ✅ Solo el aviso del service worker propio del navegador de prueba; en Firefox se registra bien |

**Observaciones**
- En modo demo los perfiles de ejemplo no tienen fecha de alta, por eso la antigüedad se cuenta desde la primera alerta (marcada con *). Con datos reales el admin ve la fecha de alta de todos y cada vecino ve la suya.
- Las alertas de ejemplo traen ubicación y descripción, así que todas cuentan como útiles. Con datos reales el porcentaje varía según cada alerta.
- `alertas.js` escucha las últimas 200 alertas: los conteos por vecino se calculan sobre esas.
- No requiere `clasp push` (es solo frontend). Si Jaziel quiere que `estadisticas.html` funcione sin conexión, debe agregarlo a la caché de `sw.js` y subir `VERSION`.
