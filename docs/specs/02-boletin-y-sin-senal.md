# Spec · Boletín público (vista de servidor) y backend de «Alerta sin señal» (Jaziel · commits 3 y 4)

**Basada en:** `docs/claude-kit/specs/01-vistas-servidor-apps-script.md` (RF-J1 y RF-J2)
**Dueño:** Jaziel · **Rama:** `jaziel`
**Estado:** aprobada el 21/11/2026 · implementada · pendiente de desplegar en Google

## 1. Objetivo
- **Commit 3 · `Vista de servidor: boletín público de alertas`:** una página que **genera el servidor** (Apps Script) con las alertas recientes, sin datos personales, para que cualquier vecino (incluso sin cuenta) vea qué pasa en la zona. Es la evidencia de «vistas generadas del lado del servidor» del Producto 2.
- **Commit 4 · `Backend de la aportación Alerta sin señal`:** las alertas que se guardaron sin conexión pasan por el servidor, que las valida, evita duplicados y les pone la hora del servidor. Es el backend de mi aportación (SP7).

## 2. Auditoría
- **Alerta sin señal hoy** (`js/offline-sync.js` + `sw-sync.js`):
  - guarda la alerta en IndexedDB con un id propio (`sin-senal-xxxx`) y el token de sesión;
  - al volver la red, el service worker la manda **directo a Firestore** por REST (o la página, si no hay Background Sync);
  - la fecha `creado` la pone el **teléfono**, no el servidor.
- **Alertas en Firestore:** `tipo`, `descripcion`, `direccion`, `lat`, `lng`, `uid`, `autor`, `creado` y `origen`. La dirección viene de Nominatim, por ejemplo «Av. Juárez 152, Centro, Puebla».
- **Las reglas solo dejan leer alertas a vecinos aprobados.** El boletín público las lee en el servidor con la cuenta de servicio y **quita los datos personales**.

## 3. Requisitos
### Commit 3 · Boletín (`apps-script/Boletin.gs` + `apps-script/vista_boletin.html`)
| # | Requisito |
|---|---|
| RF-1 | `vista_boletin(e)` consulta en el servidor las alertas de los **últimos 7 días** (máximo 300, de la más reciente a la más antigua). |
| RF-2 | Muestra: **conteo por tipo** en 24 h y 7 días, y la lista de las últimas 24 h con tipo, **zona aproximada** y **hora relativa**. |
| RF-3 | **Privacidad:** sin nombre del vecino, sin descripción (puede traer datos personales), sin calle ni número. La zona es la dirección **sin su primer tramo** («Centro, Puebla») y las coordenadas van redondeadas a 2 decimales (≈ 1 km). |
| RF-4 | Pie **«Generado en el servidor el dd/mm/aaaa hh:mm:ss»**: los datos ya vienen dentro del HTML (prueba de renderizado en servidor). |
| RF-5 | En la PWA, un enlace **«Boletín»** en el menú abre la vista en una pestaña nueva. Solo aparece si hay `URL_BACKEND`. Sin conexión, avisa que el boletín necesita Internet. |

### Commit 4 · Backend de Alerta sin señal (`apps-script/SinSenal.gs` + `js/offline-sync.js` + `sw-sync.js` + `js/firebase-config.js`)
| # | Requisito |
|---|---|
| RF-6 | `accion_alerta_sin_senal({idToken, alertas:[{idCola, datos, guardada}]})` verifica la sesión: **vecino aprobado**. |
| RF-7 | Valida cada alerta igual que las reglas: `tipo` ∈ {robo, medica, gas, otro}, `descripcion` de 1 a 500 caracteres y coordenadas válidas si vienen. |
| RF-8 | **Deduplica por `idCola`:** el id del documento es el de la cola y se crea solo si no existe. Si la página y el service worker la mandan dos veces, se guarda una sola. |
| RF-9 | El **servidor** pone `creado` (hora del servidor), `uid` (el de la sesión, no el que mande el teléfono), `enviadaSinSenal: true`, `origen: 'sin-senal'` y `guardadaEn` (cuándo se guardó en el teléfono). |
| RF-10 | Si existe `accion_push` (de Luis), avisa a los vecinos de cada alerta nueva. |
| RF-11 | Responde `{ok, aceptadas:[ids], repetidas:[ids], rechazadas:[{id, error}]}`. |
| RF-12 | `js/offline-sync.js` y `sw-sync.js` usan el backend cuando `URL_BACKEND` está configurada. **Si está vacía o el backend falla, siguen escribiendo directo a Firestore** (respaldo, como hoy). |
| RF-13 | `js/firebase-config.js` agrega `self.URL_BACKEND = ''`. Se llena en el paso de despliegue. |

`sw.js` sube a `VERSION = 'v5'`, porque cambian archivos que guarda en caché.

## 4. Archivos (todos de Jaziel)
`apps-script/Boletin.gs`, `apps-script/vista_boletin.html`, `apps-script/SinSenal.gs`, `js/offline-sync.js`, `sw-sync.js`, `js/firebase-config.js`, `js/alertas.js` (enlace del menú), `sw.js`, `apps-script/pruebas/` y `docs/`.

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica |
|---|---|---|
| CA-1 | El boletín se genera con datos incrustados, conteos correctos y sin nombres, descripciones ni calles. | Prueba local con Firestore simulado y una plantilla evaluada como en Apps Script; captura del HTML generado |
| CA-2 | Pie «Generado en el servidor». | Prueba local |
| CA-3 | `accion_alerta_sin_senal` rechaza sesiones inválidas y alertas inválidas, deduplica por `idCola` y sella la hora y el uid del servidor. | Prueba local con Firestore simulado |
| CA-4 | Con `URL_BACKEND` vacía, la app se comporta igual que hoy. | Playwright con `?demo=1` |
| CA-5 | Enlace «Boletín» solo con `URL_BACKEND`. | Playwright |
| CA-6 | Funciona en Google, contra Firestore real. | Paso de despliegue, con tu cuenta |

## 6. Pruebas
Las pruebas locales usan `apps-script/pruebas/simulador.mjs`, que imita los servicios de Apps Script, un Firestore en memoria (que aplica la regla «cada quien lee su perfil») y las plantillas `<? ?>`.

| # | Resultado |
|---|---|
| CA-1 | ✅ `prueba_boletin.mjs` **9/9**: cuenta 6 alertas en 7 días y 4 en 24 h (la de hace 200 h no entra), por tipo `[2,1,2,1]` y `[1,1,2,0]`, y ordena de la más reciente a la más antigua. **No aparecen** el nombre, la descripción, la calle ni las coordenadas exactas; sí aparecen «Centro, Puebla» y «Zona 19.06, -98.31». Una dirección con `<script>` sale escapada. |
| CA-2 | ✅ Los datos vienen dentro del HTML (`<div class="cifra">4</div>`), sin etiquetas de plantilla sin evaluar, y con el pie «Generado en el servidor (Google Apps Script) el …». |
| CA-3 | ✅ `prueba_sin_senal.mjs` **8/8**. Se rechazan: sin sesión, token mal formado, **firma falsa** (Firestore no acepta el token) y vecino pendiente. Una alerta válida queda con el **uid, el nombre y la hora del servidor**, y `guardadaEn` es 10 min antes. Un duplicado → `repetidas`, sin cambiar el documento. Se rechazan con su motivo: tipo inválido, descripción vacía o de 501 caracteres, latitud 200 e `idCola` con `../`. Con `accion_push` presente, avisa a los vecinos. |
| CA-4 | ✅ Playwright con `?demo=1`, `URL_BACKEND` vacía y ubicación simulada. Sin red, la alerta se guarda en IndexedDB (`sin-senal-0eb6…`) con el aviso «1 alerta(s) esperando señal». Al volver la red se envía y aparece en la lista. Sin errores de JavaScript; caché `alertavecinal-v5`. |
| CA-5 | ✅ Sin `URL_BACKEND` el menú queda igual. Con `URL_BACKEND` aparece «Boletín» (`…/exec?vista=boletin`, pestaña nueva) y, sin red, avisa en lugar de abrirlo. |
| CA-6 | ⏳ Pendiente: el envío real con sesión de Firebase y el boletín contra Firestore se prueban en el despliegue. |
