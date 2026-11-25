# Sección de Serrano Arana Jahir Jaziel · Matrícula 2311080845

Integrante 1 y coordinador del equipo AlertaVecinal · GitHub `JazyelAe` · rama `jaziel`.
Los números de los apartados corresponden a las secciones del documento del Producto 2 (spec 03). Esta sección trae, además de mi parte, los apartados comunes del documento: caso de estudio, vínculos y referencias.

---

## 1. Caso de estudio

### Problema
En muchas colonias de Puebla, los vecinos se avisan de robos, emergencias médicas o fugas de gas por grupos de WhatsApp. Esos grupos tienen cuatro problemas:

- **Los avisos se pierden** entre saludos, cadenas y conversaciones, y nadie sabe cuáles siguen vigentes.
- **No hay ubicación precisa:** "están robando en la esquina" no dice qué esquina.
- **No hay verificación:** cualquiera con el enlace del grupo puede entrar, y una alerta falsa genera pánico.
- **No funcionan sin señal:** justo en una emergencia es común quedarse sin datos, y el mensaje no sale.

### Usuarios
| Usuario | Qué hace en la app |
|---|---|
| Vecino | Se registra con su domicilio, espera la aprobación del comité, envía alertas con tipo, descripción, ubicación GPS y foto opcional, y recibe las alertas de los demás en tiempo real, en lista, mapa y notificación. |
| Administrador (comité vecinal) | Aprueba o suspende vecinos, verifica domicilios, envía avisos a toda la colonia y consulta las estadísticas del Panel Pro. |
| Visitante (sin cuenta) | Solo consulta el boletín público, que no muestra datos personales. |

### Objetivo
Construir **AlertaVecinal**, una aplicación web progresiva (PWA) en la que los vecinos verificados de una colonia envíen y reciban alertas de seguridad en tiempo real, con ubicación, que funcione en cualquier teléfono sin instalar nada desde una tienda, que se pueda instalar como app y que siga funcionando sin conexión.

### Alcance
- **Incluye:** registro y aprobación de vecinos; alertas en tiempo real con lista, mapa y mapa de calor; notificaciones push aun con la app cerrada; funcionamiento sin conexión, con alertas que se envían solas al volver la señal; uso de GPS, cámara, vibración y compartir; vistas generadas en el servidor; panel de administración y estadísticas.
- **No incluye:** llamadas a servicios de emergencia (911), pagos reales del plan Pro ni una app nativa para tiendas.

### Arquitectura
La PWA se publica en GitHub Pages. En el navegador, el service worker guarda la app en caché y la mantiene funcionando sin conexión. Firebase da las cuentas, la base de datos en tiempo real y el envío de notificaciones. Google Apps Script hace de servidor: genera las vistas del lado del servidor y ejecuta las acciones que necesitan la cuenta de servicio, en lugar de Cloud Functions, que requieren el plan de pago.

![Arquitectura de AlertaVecinal: la PWA y su service worker en el dispositivo, GitHub Pages, Firebase, Google Apps Script y los servicios de mapas.](evidencias/arquitectura.png)

---

## 2. Justificación de plataformas y herramientas

| Herramienta | Para qué | Por qué se eligió | Alternativa descartada |
|---|---|---|---|
| HTML, CSS y JavaScript sin framework | Toda la interfaz de la PWA | No necesita compilación, carga rápido en teléfonos de gama baja y cada módulo se carga solo: si uno falta, la app sigue funcionando | React o Angular: agregan un paso de compilación y más peso para una app pequeña |
| GitHub + GitHub Pages | Repositorio del equipo y publicación | Pages es gratis, publica desde la rama `main` y da **HTTPS**, requisito para el service worker, la cámara y las notificaciones. Las ramas y Pull Request registran el trabajo de cada integrante | Firebase Hosting: también funciona, pero separa el código de la publicación |
| Firebase Authentication | Registro e inicio de sesión con correo y contraseña | Gratis, seguro y se integra con las reglas de Firestore | Un sistema de usuarios propio: habría que guardar contraseñas |
| Cloud Firestore | Usuarios, alertas, avisos y tokens | Tiempo real con `onSnapshot`, caché persistente sin conexión y reglas de seguridad en el servidor | Realtime Database: reglas y consultas más limitadas |
| Firebase Cloud Messaging (FCM) | Notificaciones push | Gratis y compatible con la Push API del navegador | Servicios de push de pago |
| Google Apps Script | Servidor: vistas generadas en el servidor y acciones con la cuenta de servicio | Gratis y sin tarjeta. Usa la cuenta de servicio para leer Firestore y enviar push | Cloud Functions: requieren el plan Blaze, con tarjeta de crédito |
| clasp | Subir y publicar el código de Apps Script desde la terminal | El backend vive en el repositorio (`apps-script/`) y se publica siempre con la misma URL | Copiar y pegar el código en el editor web: sin historial ni revisión |
| Cache Storage + service worker | App shell, mapas y página sin conexión | API estándar de las PWA: control total de qué se guarda y con qué estrategia | Solo la caché HTTP del navegador: no funciona sin conexión |
| IndexedDB | Cola de "Alerta sin señal" | Guarda objetos completos, incluida la foto, y lo puede leer el service worker | localStorage: el service worker no tiene acceso a él |
| Background Sync | Enviar las alertas guardadas al volver la señal | El navegador avisa al service worker aunque la app esté cerrada | Revisar la conexión cada cierto tiempo: gasta batería |
| Leaflet + OpenStreetMap | Mapa de alertas y mapa de calor | Libres y sin clave de API | Google Maps: requiere clave y facturación |
| Nominatim | Convertir coordenadas en dirección | Gratis y del mismo proyecto OpenStreetMap | Geocodificación de Google: de pago |
| Playwright | Pruebas automáticas y capturas de evidencia | Prueba la app publicada en un navegador real, incluso sin conexión | Probar todo a mano: lento y no repetible |
| Herramientas de desarrollo del navegador (F12) | Revisar el service worker, la caché, IndexedDB y la red | Vienen en Chrome y Edge, y permiten simular "Sin conexión" | — |

---

## 3. Parámetros de configuración (partes de Jaziel)

### `manifest.json`
| Campo | Valor | Para qué sirve |
|---|---|---|
| `name` | AlertaVecinal - Red de seguridad vecinal | Nombre completo en la instalación |
| `short_name` | AlertaVecinal | Nombre bajo el ícono |
| `id` y `scope` | `./` | Identidad de la app y páginas que controla: toda la carpeta de la app |
| `start_url` | `./?origen=pwa` | Página con la que abre la app instalada |
| `display` | `standalone` | Abre en su propia ventana, sin barra del navegador |
| `orientation` | `portrait` | Vertical, como se usa en el teléfono |
| `lang` | `es-MX` | Idioma |
| `theme_color` y `background_color` | `#1d3557` | Color de la barra del sistema y de la pantalla de carga |
| `icons` | 192 × 192 y 512 × 512 (`any`), 512 × 512 (`maskable`) | Íconos para el escritorio y para Android, que los recorta en círculo |

### Service worker (`sw.js`)
| Parámetro | Valor |
|---|---|
| Versión | `VERSION = 'v7'`. Al cambiarla, el evento `activate` borra las cachés viejas y la app se actualiza |
| Cachés | `alertavecinal-v7` (app shell) y `alertavecinal-mapas` (mosaicos, máximo 120) |
| App shell (se guarda en `install` con `cache.addAll`) | `./`, `index.html`, `offline.html`, `demo-cache.html`, `manifest.json`, `css/estilos.css`, `js/firebase-config.js`, `js/auth.js`, `js/alertas.js`, `js/app.js`, `js/cache-demo.js` y los íconos 192 y 512 |
| Módulos opcionales (se guardan con `cache.add` uno por uno) | Páginas y scripts de los demás integrantes: si alguno falta, la instalación sigue |
| Estrategia para páginas HTML | **Network First:** intenta la red; sin conexión usa la copia guardada y, si no hay, `offline.html` |
| Estrategia para CSS, JS, íconos y librerías de CDN con versión | **Cache First** |
| Estrategia para los mosaicos del mapa | **Stale-While-Revalidate**, en su propia caché |
| Sin caché | Firestore, Authentication, googleapis y Nominatim: Firebase maneja sus datos y las direcciones se consultan en vivo |
| Scripts importados | `sw-push.js` (notificaciones, de Luis) y `sw-sync.js` (Alerta sin señal), dentro de `try/catch` |

### `js/firebase-config.js`
Estos valores identifican la app web en Firebase. **No son secretos:** cualquier app web de Firebase los expone. La seguridad está en las reglas de Firestore y en la cuenta de servicio, que nunca se sube al repositorio.

| Clave | Qué es |
|---|---|
| `apiKey` | Clave pública de la app web |
| `authDomain` | Dominio de inicio de sesión: `alertavecinal-10d.firebaseapp.com` |
| `projectId` | Proyecto `alertavecinal-10d` |
| `storageBucket`, `messagingSenderId` y `appId` | Identificadores de la app web y del remitente de FCM |
| `FIREBASE_VAPID_KEY` | Clave **pública** VAPID para suscribirse a push (la privada la guarda Firebase) |
| `PUSH_ENDPOINT` | URL del intermediario de push en Apps Script (`/exec`) |
| `URL_BACKEND` | URL del backend en Apps Script: vistas de servidor y acciones |

### Reglas de Firestore (`firestore.rules`)
| Colección | Leer | Crear | Cambiar o borrar |
|---|---|---|---|
| `usuarios` | El propio usuario; el admin, todos | Solo su propio perfil, como vecino **pendiente** y sin campos de verificación | El usuario cambia su perfil sin tocar `rol`, `estado`, `verificado`, `verificadoEn` ni `verificadoPor`; el admin cambia cualquiera. Solo el admin borra |
| `alertas` | Vecinos aprobados | Vecinos aprobados, a su nombre, con tipo válido (robo, médica, gas, otro), descripción de 1 a 500 caracteres y foto opcional en JPEG de hasta 300 000 caracteres | Solo el admin |
| `avisos` | Vecinos aprobados | Solo el admin, con título de 1 a 80 caracteres y mensaje de hasta 300 | Solo el admin |
| `tokens` | El dueño del token o el admin | Cada usuario registra el token de su navegador | El dueño o el admin |
| `envios` | Nadie desde la app | — | Solo el servidor, con la cuenta de servicio |

Así, **un vecino no puede volverse administrador ni aprobarse solo**, aunque modifique el código de la página: Firestore rechaza el cambio en el servidor.

### Authentication
| Parámetro | Valor |
|---|---|
| Método | Correo electrónico y contraseña |
| Dominios autorizados | `localhost`, `alertavecinal-10d.firebaseapp.com` y `jazyelae.github.io` |
| Aprobación | Al registrarse, el perfil queda `pendiente` hasta que un administrador lo aprueba |

### Google Apps Script (backend)
| Parámetro | Valor |
|---|---|
| Proyecto | *AlertaVecinal Backend* (`apps-script/` en el repositorio, se sube con clasp) |
| `appsscript.json` | Zona horaria `America/Mexico_City`, motor `V8`, permiso `script.external_request` |
| Implementación | Aplicación web · Ejecutar como: el dueño · Acceso: cualquier usuario |
| Propiedades del script | `SERVICE_ACCOUNT`: clave de la cuenta de servicio de Firebase (su valor **no** se publica) |
| Router (`Comun.gs`) | `GET ?vista=nombre` llama a `vista_nombre(e)` y devuelve HTML; `POST {accion}` llama a `accion_nombre(datos)` y devuelve JSON |
| Vistas publicadas | `boletin` (Jaziel), `verificado` (Yeudiel) y `mapacalor` (Luis, pendiente) |
| Acciones publicadas | `alerta_sin_senal` (Jaziel), `verificar` (Yeudiel) y `push` (Luis, pendiente) |
| Seguridad | Cada acción verifica el token de sesión de Firebase y que el vecino esté aprobado |

### GitHub Pages
| Parámetro | Valor |
|---|---|
| Origen | Rama `main`, carpeta `/ (root)` |
| URL | https://jazyelae.github.io/alertavecinal/ |
| HTTPS | Automático |
| Protección de `main` | Solo recibe cambios por Pull Request, unidos con *merge commit* para conservar el autor de cada commit |

---

## 4. Reporte de pruebas (casos de Jaziel)

Las pruebas J-01 a J-16 se ejecutaron el **23/11/2026** con Playwright sobre la **app publicada**, en modo demostración (`?demo=1`), con el script `docs/producto2/pruebas/pruebas_jaziel.js`; los resultados quedan en `docs/producto2/pruebas/resultados_jaziel.json`. Las pruebas J-17 a J-22 se hicieron a mano el **24/11/2026** con la base de datos real, un iPhone con la app instalada y la computadora como segundo dispositivo; sus capturas están en el apartado 5.

| ID | Requisito | Pasos | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| J-01 | Acceso | Abrir la URL publicada sin sesión | Pantalla de registro e inicio de sesión | Se muestra la pantalla de acceso | ✅ |
| J-02 | Vista del cliente | Abrir `?demo=1` | Panel con los módulos y sin errores | 5 módulos (enviar, lista, notificaciones, mapa y mapa de calor), sin errores de JavaScript | ✅ |
| J-03 | HTTPS y manifest | Leer `manifest.json` de la app publicada | HTTPS, `display: standalone` e ícono `maskable` | Correcto: `start_url` `./?origen=pwa`, íconos 192, 512 y 512 maskable | ✅ |
| J-04 | Service worker | Esperar a que el service worker quede activo y leer `caches.keys()` | Activo, con la caché del app shell | `activated`; cachés `alertavecinal-v7` (33 archivos) y `alertavecinal-mapas` | ✅ |
| J-05 | API Cache | En `demo-cache.html`, pulsar cada método | Cada botón responde sin error | `caches.keys()`, `cache.keys()`, `cache.match()`, `cache.add()`, `cache.put()` y `caches.has()` correctos | ✅ |
| J-06 | Sin conexión: app shell | Modo avión y recargar | La app abre desde la caché | El panel abre sin conexión | ✅ |
| J-07 | Sin conexión: página no guardada | Modo avión y abrir una página que no está en caché | Se muestra `offline.html` | Aparece "Estás sin conexión" | ✅ |
| J-08 | GPS | Pulsar "Obtener mi ubicación" | Se llenan las coordenadas | 19.04140, -98.20630 | ✅ |
| J-09 | Alerta sin señal | Modo avión y enviar una alerta | Queda guardada con el aviso "esperando señal" | Aviso "1 alerta(s) esperando señal" | ✅ |
| J-10 | Sincronización | Volver a tener conexión | La alerta se envía sola | Aparece en la lista (46 → 47 alertas) | ✅ |
| J-11 | Cámara (archivo) | "Agregar foto" con una imagen | Se comprime y se ve la vista previa | Vista previa con "Foto lista: 11 KB" | ✅ |
| J-12 | Compartir | Pulsar "Compartir" en una alerta (escritorio sin `navigator.share`) | Se copia el texto con el enlace a la alerta | Texto copiado con tipo, descripción, ubicación y enlace | ✅ |
| J-13 | Diseño adaptable | Abrir la app con un ancho de 375 px | Sin desplazamiento horizontal | Ancho del documento: 375 px | ✅ |
| J-14 | Backend | Consultar la URL `/exec` | Responde configurado | `configurado: true`, vistas `boletin` y `verificado` | ✅ |
| J-15 | Vista del servidor | Abrir `/exec?vista=boletin` | HTML generado en el servidor con su pie | Pie "Generado en el servidor el …" | ✅ |
| J-16 | Privacidad del boletín | Revisar el texto del boletín | Sin correos, nombres ni números de casa | Correcto | ✅ |
| J-17 | Push del backend (app abierta y cerrada) | Desde Administración, enviar un aviso a todos; en el teléfono, primero con la app abierta y luego cerrada | Llega el aviso dentro de la app y en la pantalla de inicio | Llegó en los dos casos (iPhone con la app instalada, permiso concedido) | ✅ |
| J-18 | Cámara real | En el teléfono, "Agregar foto" con la cámara y enviar la alerta | La alerta llega a los demás con la foto | Foto comprimida a 96 KB; la alerta llegó a la computadora con su foto y aviso | ✅ |
| J-19 | Vibración | Con la app abierta en el teléfono, otro vecino envía una alerta | El teléfono vibra | Vibró al llegar la alerta | ✅ |
| J-20 | Compartir nativo | En el teléfono, pulsar "Compartir" en una alerta | Abre el menú de compartir del sistema | Abrió el menú de compartir de iOS con el título de la alerta y el enlace | ✅ |
| J-21 | Persistencia de Firestore | Con la cuenta real, con las alertas cargadas, activar modo avión | Se siguen viendo las alertas ya cargadas | Con "Sin conexión" la lista siguió mostrando las 12 alertas | ✅ |
| J-22 | Alerta sin señal con cuenta real | En modo avión, enviar una alerta y luego quitar el modo avión | La alerta se guarda en el teléfono y se envía sola al volver la señal | Aviso "tu alerta se guardó en el teléfono"; al reconectar llegó "Robo prueba" (13 alertas) | ✅ |

---

## 5. Evidencias de las características de la PWA (partes de Jaziel)

![Sin sesión, la app muestra el registro y el inicio de sesión (vista generada en el cliente).](evidencias/jaziel-01-acceso.png)

![Panel principal en modo demostración, en escritorio: enviar alerta, alertas en tiempo real, notificaciones, mapa y mapa de calor.](evidencias/jaziel-02-panel-escritorio.png)

![La misma app en un celular de 375 px de ancho: diseño adaptable sin desplazamiento horizontal.](evidencias/jaziel-08-celular.png)

![Demo de la API Cache: cache.keys() lista los archivos guardados en la caché del app shell.](evidencias/jaziel-03-demo-cache.png)

![En modo avión la app abre desde la caché y muestra el indicador "Sin conexión".](evidencias/jaziel-04-sin-conexion-app.png)

![Sin conexión, una página que no está en caché muestra offline.html.](evidencias/jaziel-05-offline-html.png)

![Alerta sin señal: la alerta queda guardada en IndexedDB y se enviará sola al volver la conexión.](evidencias/jaziel-06-alerta-sin-senal.png)

![Cámara: la foto se comprime en el navegador y se muestra la vista previa antes de enviar la alerta.](evidencias/jaziel-07-foto-alerta.png)

![Boletín público generado en el servidor de Google Apps Script con las alertas de Firestore.](evidencias/jaziel-09-boletin.png)

![Código fuente del boletín: los datos ya vienen dentro del HTML que genera el servidor.](evidencias/jaziel-10-boletin-codigo-fuente.png)

### Pruebas con la base de datos real y un teléfono

![Notificación push enviada por el backend: con la app abierta (izquierda) y con la app cerrada, en la pantalla de inicio del iPhone (derecha).](evidencias/jaziel-11-push-real.png)

![Cámara: la foto tomada en el teléfono se comprime a 96 KB (izquierda) y la alerta llega a la computadora con su foto y su aviso (derecha).](evidencias/jaziel-12-camara-real.png)

![Compartir: el botón abre el menú nativo del teléfono con el título y el enlace de la alerta (los contactos se ocultaron).](evidencias/jaziel-13-compartir-real.png)

![Sin conexión con la cuenta real: la lista sigue visible (izquierda), la alerta se guarda en el teléfono (centro) y se envía sola al volver la señal (derecha).](evidencias/jaziel-14-sin-senal-real.png)

### Funciones de Luis y Yeudiel
Capturas tomadas por el coordinador sobre la app publicada (`docs/producto2/pruebas/evidencias_equipo.js`), siguiendo las evidencias que propusieron Luis y Yeudiel en sus secciones.

![Mapa de alertas (Luis): un punto de color por alerta y la ventana con la dirección obtenida de Nominatim.](evidencias/equipo-01-mapa-alertas.png)

![Mapa de calor de incidentes (Luis): las zonas rojas concentran más alertas; se filtra por tipo y fechas.](evidencias/equipo-02-mapa-calor.png)

![Demo de notificaciones push (Luis): estado del permiso, service worker activo, token FCM y notificación local de prueba.](evidencias/equipo-03-demo-push.png)

![Reporte de mapa de calor generado en el servidor de Apps Script (Luis), con las alertas agrupadas en zonas de unos 500 m.](evidencias/equipo-06-reporte-calor-servidor.png)

![Panel de administración (Yeudiel): avisos a todos los vecinos y usuarios con aprobar, verificar domicilio, suspender y eliminar.](evidencias/equipo-04-administracion.png)

![Panel Pro de Vecino Verificado Pro (Yeudiel): indicadores de la colonia, ficha del vecino, vecinos más activos y gráficas.](evidencias/equipo-05-panel-pro.png)

---

## 6. Vínculos

| Recurso | URL |
|---|---|
| Aplicación publicada | https://jazyelae.github.io/alertavecinal/ |
| Aplicación en modo demostración | https://jazyelae.github.io/alertavecinal/?demo=1 |
| Repositorio | https://github.com/JazyelAe/alertavecinal |
| Backend (estado) | https://script.google.com/macros/s/AKfycbyA-8YNUHxTZ0XILx0vCNW0PV-lX_SlT-zDDEMG_7wUcgRelPpH_9_MfC0GzfSZihiJkg/exec |
| Vista de servidor: boletín | https://script.google.com/macros/s/AKfycbyA-8YNUHxTZ0XILx0vCNW0PV-lX_SlT-zDDEMG_7wUcgRelPpH_9_MfC0GzfSZihiJkg/exec?vista=boletin |
| Vista de servidor: reporte de mapa de calor | https://script.google.com/macros/s/AKfycbyA-8YNUHxTZ0XILx0vCNW0PV-lX_SlT-zDDEMG_7wUcgRelPpH_9_MfC0GzfSZihiJkg/exec?vista=mapacalor |


---

## 7. Aportación: Alerta sin señal

**Alerta sin señal** resuelve el momento más crítico: una emergencia en la que el vecino se queda sin datos. Si no hay conexión, la alerta no se pierde: se guarda en el teléfono, con su foto, y se envía sola cuando vuelve la señal, aunque la app esté cerrada.

- **En el cliente:** `js/offline-sync.js` guarda la alerta en IndexedDB y muestra el aviso "esperando señal". `sw-sync.js` registra un evento de Background Sync para que el service worker la envíe al volver la conexión. Si el navegador no tiene Background Sync, la página la envía al detectar el evento `online`.
- **En el servidor:** la acción `accion_alerta_sin_senal` de Apps Script verifica la sesión, valida cada alerta igual que las reglas, evita duplicados con el identificador de la cola y pone la hora del servidor, no la del teléfono.
- **Vista del servidor:** el **boletín público** muestra el resumen de alertas de la colonia sin datos personales, para quien todavía no tiene cuenta.

Además, como coordinador, hice la base de la app y la conversión a PWA (manifest, service worker y caché), la cámara, la vibración, el botón de compartir, la persistencia sin conexión de Firestore, las reglas de seguridad y el despliegue del backend.

### Mis commits principales
| Commit | Fecha | Qué agrega |
|---|---|---|
| `Aplicación web base` | 18/11/2026 | `index.html`, estilos, inicio de sesión y alertas en tiempo real con Firestore |
| `Conversión a PWA: manifest y caché` | 18/11/2026 | `manifest.json`, íconos, `sw.js` con las tres estrategias de caché, `offline.html` y la demo de la API Cache |
| `Aportación: Alerta sin señal` | 18/11/2026 | `js/offline-sync.js` y `sw-sync.js`: cola en IndexedDB y Background Sync |
| `Documentación Subproducto 4` | 18/11/2026 | PDF de la API Caché |
| `Backend: núcleo de Apps Script (router, Firestore y sesión)` | 21/11/2026 | `apps-script/Comun.gs`: router de vistas y acciones, acceso a Firestore y verificación de sesión |
| `Vista de servidor: boletín público de alertas` | 21/11/2026 | `Boletin.gs` y `vista_boletin.html` |
| `Backend de la aportación Alerta sin señal` | 21/11/2026 | `SinSenal.gs` y el envío por el backend |
| `Dispositivo: cámara, vibración y compartir en alertas` | 21/11/2026 | Foto comprimida, vibración con alertas nuevas y botón "Compartir" |
| `Datos offline: persistencia de Firestore` | 21/11/2026 | Caché persistente de Firestore en el navegador |
| `Reglas: solo el admin o el backend cambian la verificación del domicilio` | 23/11/2026 | Protección de los campos de verificación |
| `Despliegue: URL del backend de Apps Script y caché v7` | 23/11/2026 | Backend publicado y conectado a la app |

---

## 8. Conclusión de Serrano Arana Jahir Jaziel

Este proyecto me enseñó que una PWA se construye pensando en el peor momento del usuario. En una emergencia no hay tiempo de buscar una app en una tienda ni garantía de tener señal, y por eso las decisiones más importantes fueron las menos visibles: la caché del app shell para que la app abra al instante, la página sin conexión, y mi aportación, Alerta sin señal, que guarda la alerta en el teléfono y la envía sola cuando vuelve la conexión.

También aprendí a separar lo que hace el cliente de lo que debe hacer el servidor. La interfaz puede ocultar botones, pero la seguridad real está en las reglas de Firestore y en el backend de Apps Script, que verifica la sesión y pone la hora del servidor. Usar Apps Script en lugar de Cloud Functions nos permitió tener servidor sin pagar, y nos obligó a probar el código en Google y no solo en local: así encontramos un error en las plantillas que las pruebas locales no detectaban.

Como coordinador, organizar el trabajo con ramas, Pull Request y un archivo de progreso hizo posible que los tres avanzáramos en paralelo sin pisarnos, y que en el historial de GitHub quede claro qué hizo cada quien.

— Serrano Arana Jahir Jaziel

---

## Referencias

- Firebase. (s. f.). *Cloud Firestore: Access data offline*. Google. https://firebase.google.com/docs/firestore/manage-data/enable-offline
- Firebase. (s. f.). *Firebase Cloud Messaging*. Google. https://firebase.google.com/docs/cloud-messaging
- Firebase. (s. f.). *Get started with Cloud Firestore Security Rules*. Google. https://firebase.google.com/docs/firestore/security/get-started
- GitHub. (s. f.). *Creating a GitHub Pages site*. GitHub Docs. https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- Google. (s. f.). *HTML Service: Templated HTML*. Google Apps Script. https://developers.google.com/apps-script/guides/html/templates
- Google. (s. f.). *Web Apps*. Google Apps Script. https://developers.google.com/apps-script/guides/web
- Leaflet. (s. f.). *Leaflet: an open-source JavaScript library for interactive maps*. https://leafletjs.com/
- MDN Web Docs. (s. f.). *Background Synchronization API*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
- MDN Web Docs. (s. f.). *Cache*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/API/Cache
- MDN Web Docs. (s. f.). *IndexedDB API*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- MDN Web Docs. (s. f.). *Progressive web apps*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- MDN Web Docs. (s. f.). *Web Share API*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
- OpenStreetMap Foundation. (s. f.). *Nominatim usage policy*. https://operations.osmfoundation.org/policies/nominatim/
- web.dev. (s. f.). *Learn PWA*. Google. https://web.dev/learn/pwa
