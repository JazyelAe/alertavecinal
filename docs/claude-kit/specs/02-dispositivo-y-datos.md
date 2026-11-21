# 02 · Elementos físicos del dispositivo y datos offline (Jaziel, con un detalle de Luis)

## Elementos físicos del dispositivo
Hoy solo se usa **geolocalización** (`navigator.geolocation` en `js/alertas.js`). El Producto 2 pide "uso de elementos físicos del dispositivo", así que conviene mostrar varios:

| RF | Elemento | Dónde | Detalle |
|---|---|---|---|
| RF-D1 | **GPS** (ya existe) | `js/alertas.js` (Jaziel) | Documentarlo: precisión, permiso, respaldo si se niega (elegir punto en el mapa) |
| RF-D2 | **Cámara** | `js/alertas.js` (Jaziel) | Foto opcional de evidencia en la alerta: `<input type="file" accept="image/*" capture="environment">`; vista previa; comprimir con `<canvas>` a ≤ 800 px y JPEG ≈ 0.6 (objetivo < 150 KB); guardar como data-URL en el documento de la alerta. Firebase Storage pide plan Blaze en proyectos nuevos, por eso no se usa. Actualizar `firestore.rules` para limitar el tamaño del campo |
| RF-D3 | **Vibración** | `js/alertas.js` (Jaziel) y `sw-push.js` (Luis) | `navigator.vibrate([200,100,200])` al recibir una alerta con la app abierta; `vibrate` en las opciones de `showNotification` (Luis) |
| RF-D4 | **Compartir nativo** | `js/alertas.js` (Jaziel) | Botón "Compartir alerta" con `navigator.share` (respaldo: copiar al portapapeles) |
| RF-D5 (opcional) | **Pantalla siempre encendida** | `js/alertas.js` | `navigator.wakeLock` mientras se ve el mapa de una emergencia activa |

Todo con **detección de soporte** (`'vibrate' in navigator`, etc.) y mensajes claros si no está disponible (por ejemplo, iOS no vibra).

## Datos locales, remotos y offline: completar y documentar
| Tipo | Implementación | Acción |
|---|---|---|
| Local | IndexedDB (`offline-sync.js`, `sw-sync.js`): cola de alertas sin señal; localStorage: token y preferencias | Documentar el esquema |
| Remoto | Firestore (alertas, usuarios, tokens, avisos), Nominatim, Apps Script | Documentar colecciones y reglas |
| Offline | Cache Storage (`alertavecinal-vX` para el *app shell*, `alertavecinal-mapas` para los mosaicos), `offline.html`, Background Sync | **RF-O1**: activar la persistencia offline de Firestore (`enableIndexedDbPersistence` o `persistentLocalCache` según la versión del SDK) en `js/auth.js` o donde se inicializa Firebase (Jaziel), para que la lista de alertas se vea sin conexión |

## Criterios de aceptación
- [ ] En un teléfono Android: tomar foto → enviar alerta → la foto se ve en la lista y en el detalle.
- [ ] La vibración se siente al recibir una alerta (app abierta y notificación).
- [ ] El botón de compartir abre el menú nativo.
- [ ] Modo avión: la lista de alertas ya vistas sigue visible; enviar una alerta la deja en cola y se envía al volver la señal.
- [ ] Subir `VERSION` en `sw.js` y verificar que la caché se actualiza.
