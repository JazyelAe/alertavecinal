# Spec · Elementos del dispositivo y datos offline (Jaziel · commits 5 y 6)

**Basada en:** `docs/claude-kit/specs/02-dispositivo-y-datos.md`
**Dueño:** Jaziel (la vibración de las notificaciones push, en `sw-push.js`, es de Luis) · **Rama:** `jaziel`
**Estado:** aprobada el 21/11/2026 · implementada · faltan las reglas publicadas y la prueba en el teléfono

## 1. Objetivo
Cubrir dos requisitos del Producto 2:
- **«Uso de elementos físicos del dispositivo»:** hoy solo se usa el GPS. Se agregan **cámara**, **vibración** y **compartir nativo**.
- **«Datos offline»:** se activa la **persistencia offline de Firestore**, para que las alertas ya vistas se sigan viendo en modo avión.

## 2. Auditoría
- `js/alertas.js` (mío): el formulario envía `tipo`, `descripcion`, `lat`, `lng`, `direccion`, `uid` y `nombre`, y exige ubicación. La lista dibuja cada alerta con un botón «Ver en el mapa». Ninguna foto, vibración ni opción de compartir.
- `js/auth.js` (mío): `db = getFirestore(app)`, **sin caché persistente**. Es el único lugar donde se inicializa Firestore (los demás módulos importan `db`).
- `firestore.rules` (mío): el alta de alertas valida tipo y descripción, pero **no limita el tamaño del documento ni el de una foto**.
- **Firebase Storage necesita el plan Blaze en proyectos nuevos.** Por eso la foto se guarda comprimida dentro del documento de la alerta.
- **Alerta sin señal:** los datos de la cola pasan por `SinSenal.gs` y `sw-sync.js`; la foto tiene que viajar también por ahí.

## 3. Requisitos
### Commit 5 · `Dispositivo: cámara, vibración y compartir en alertas`
| # | Requisito |
|---|---|
| RF-1 | **Cámara:** en el formulario, «Agregar foto (opcional)» con `<input type="file" accept="image/*" capture="environment">`. En el teléfono abre la cámara trasera; en la computadora, el selector de archivos. |
| RF-2 | La foto se **comprime en el teléfono** con `<canvas>`: lado mayor ≤ 800 px, JPEG con calidad 0.6 (si pasa de 150 KB baja la calidad hasta 0.4). Se muestra una vista previa con botón «Quitar». |
| RF-3 | La foto se guarda como `foto` (data-URL `data:image/jpeg;base64,…`) en la alerta y se ve en la lista como miniatura. Al tocarla, se abre en grande. |
| RF-4 | **Vibración:** `navigator.vibrate([200, 100, 200])` cuando llega una alerta **nueva de otro vecino** con la app abierta (no al cargar la lista ni con las alertas propias). |
| RF-5 | **Compartir:** botón «Compartir» en cada alerta con `navigator.share` (tipo, descripción y enlace `?alerta=ID`). Si el navegador no lo soporta, **copia al portapapeles** y avisa. |
| RF-6 | **Detección de soporte:** sin vibración (iOS) no pasa nada; sin cámara funciona el selector de archivos; sin `share`, el portapapeles. |
| RF-7 | **Reglas:** `foto` es opcional, texto que empieza con `data:image/jpeg;base64,` y de **≤ 300 000 caracteres** (~220 KB). |
| RF-8 | **Alerta sin señal también lleva la foto:** `SinSenal.gs` la valida igual que las reglas y `sw-sync.js` ya la envía como texto. |
| RF-9 | `sw.js` → `VERSION = 'v6'`. |

### Commit 6 · `Datos offline: persistencia de Firestore`
| # | Requisito |
|---|---|
| RF-10 | `js/auth.js` usa `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`, con el mismo SDK 10.12.2. Si el navegador no puede (por ejemplo, ventana privada), vuelve a `getFirestore` sin romper la app. |
| RF-11 | Con la persistencia, en modo avión la lista muestra las alertas ya vistas y el indicador «Sin conexión» de siempre. |

## 4. Archivos (todos de Jaziel)
`index.html` (campo de foto), `css/estilos.css` (vista previa y miniaturas), `js/alertas.js`, `js/auth.js`, `firestore.rules`, `apps-script/SinSenal.gs`, `sw.js`, pruebas y `docs/`.
No se toca `sw-push.js`: **Luis** agrega ahí `vibrate` a las notificaciones push (ya está en su lista).

## 5. Lo que requiere tu cuenta
- **Publicar `firestore.rules`** en la consola de Firebase (igual que en la Unidad I): sin esto, Firestore rechazaría las fotos de más de cierto tamaño sin un límite claro.
- **Probar en tu teléfono Android:** tomar una foto con la cámara real, sentir la vibración y ver el menú nativo de compartir. Yo lo pruebo con Playwright, pero el hardware real solo se ve en el teléfono. Te pediré las capturas con su nombre y carpeta.

## 6. Criterios de aceptación
| # | Criterio | Cómo se verifica |
|---|---|---|
| CA-1 | Elegir una imagen grande (por ejemplo 3000×2000) → vista previa y data-URL JPEG ≤ 800 px y < 150 KB. | Playwright con `?demo=1` |
| CA-2 | La alerta con foto se ve en la lista con miniatura y se abre en grande. | Playwright |
| CA-3 | Una alerta nueva de otro vecino llama `navigator.vibrate([200,100,200])`; al cargar la lista o con una alerta propia, no. | Playwright (registra las llamadas) |
| CA-4 | «Compartir» usa `navigator.share` cuando existe y el portapapeles cuando no. | Playwright (ambos casos) |
| CA-5 | `SinSenal.gs` acepta una foto válida y rechaza una que no sea JPEG o sea demasiado grande. | Prueba local |
| CA-6 | La persistencia se activa (Firestore crea su base en IndexedDB) y la app no se rompe. | Playwright sin demo |
| CA-7 | Foto real, vibración, compartir y modo avión en tu teléfono. | Tú, con tu teléfono |

## 7. Pruebas
| # | Resultado |
|---|---|
| CA-1 | ✅ Playwright con `?demo=1`: una imagen de 3000×2000 (4.2 MB) queda en un JPEG de **800×533 y 47 KB** en data-URL, con vista previa y «Foto lista: 47 KB». |
| CA-2 | ✅ La alerta enviada muestra la miniatura; al tocarla se abre en grande (`<dialog>`). Después de enviar, el formulario queda sin foto. |
| CA-3 | ✅ Con un espía de `navigator.vibrate`: no vibra al cargar la lista ni con una alerta **propia**. Con una alerta nueva de otro vecino (`recibirDemo`, solo en modo demo) se llama `vibrate([200,100,200])`. |
| CA-4 | ✅ «Compartir» llama a `navigator.share` con título, texto y enlace `?alerta=ID`. En un navegador sin `share`, copia la alerta al portapapeles (comprobado leyendo el portapapeles) y avisa. |
| CA-5 | ✅ `prueba_sin_senal.mjs` **9/9**: acepta una foto JPEG válida y rechaza PNG, más de 300 000 caracteres y `<script>`. |
| CA-6 | ✅ Con la persistencia, `db` usa la caché `persistent` y Firestore crea `firestore/[DEFAULT]/alertavecinal-10d/main` en IndexedDB. La app abre con y sin `?demo=1` sin errores nuevos de JavaScript. |
| CA-7 | ⏳ Pendiente de Jaziel: publicar `firestore.rules` y probar en el teléfono la cámara real, la vibración, el menú de compartir y el modo avión con sesión iniciada. |

Resumen de Playwright: **13/13** comprobaciones (cámara, miniatura, vibración y compartir).
