# CLAUDE.md — AlertaVecinal · Aplicaciones Web Progresivas · Unidad II

Contexto común para los 3 integrantes. Cada quien abre Claude Code **en su propia computadora, con su propia cuenta de GitHub**, dentro del repo `alertavecinal`, y pega **su** prompt de `docs/claude-kit/prompts/`.
Idioma de todo (código, comentarios, commits, PR, documentos): **español**.

## Equipo
| # | Integrante | GitHub | Rama | Matrícula |
|---|---|---|---|---|
| 1 | Serrano Arana Jahir Jaziel | `JazyelAe` (dueño del repo) | `jaziel` | 2311080845 |
| 2 | Xicali Diaz Luis Alberto | `LuisAlbertoXicaliDiaz` | `luis` | 2311081407 |
| 3 | Gonzalez Barrios Yeudiel Nain | `yeudev-utp` | `yeudiel` | 2311081344 |

Materia: Aplicaciones Web Progresivas · Profesora: **Mather Xóchitl Mendoza Piscil** · Grupo **10° D** · Universidad Tecnológica de Puebla · División de Tecnologías de la Información · Ingeniería en Desarrollo y Gestión de Software.
Si falta una matrícula o un usuario de GitHub, **pregúntaselo al integrante** y actualiza esta tabla en su propio commit.

## El proyecto
**AlertaVecinal**: red de seguridad vecinal hecha como PWA. Los vecinos se registran, un admin los aprueba y cualquier vecino aprobado envía alertas (robo, emergencia médica, fuga de gas, otro) con su ubicación. Las alertas aparecen en tiempo real en lista, mapa y notificación push.
- Frontend: HTML, CSS y JS puro (sin build). Módulos en `js/` que se cargan solos: si uno falta, la app sigue funcionando.
- Backend: Firebase plan **Spark** (Authentication, Firestore, Cloud Messaging), **sin Cloud Functions**. **Google Apps Script** es el backend de servidor (push y vistas renderizadas en servidor).
- Mapas: Leaflet + OpenStreetMap; direcciones con Nominatim.
- Publicación: GitHub Pages (`https://jazyelae.github.io/alertavecinal/`). Verificarlo y agregar el dominio a Firebase Auth → Dominios autorizados.
- `?demo=1` abre la app con datos de ejemplo, sin Firebase. Úsalo para capturas y pruebas.

**Referencia completa y funcional**: el repo archivado `JazyelAe/alertavecinal-prueba` (público). Ahí están, ya hechos, los archivos que faltan en el repo nuevo: `js/mapa.js`, `js/push.js`, `sw-push.js`, `demo-push.html`, `scripts/`, `js/heatmap.js`, `estadisticas.html`, `js/estadisticas.js`, `README.md` y la guía `entregables/GUIA_REPOSITORIO.md` con el reparto original. Se pueden traer de ahí (`git show` o descarga *raw*), pero hay que revisarlos y adaptarlos, no copiarlos a ciegas.

## Reglas de equipo (importantes: la profesora evalúa los commits de cada uno)
1. **Cada quien solo crea o modifica los archivos que le tocan** (ver `docs/claude-kit/specs/00-plan-y-reparto.md`). Si una tarea requiere tocar el archivo de otro, **detente y avisa**: se le pide a esa persona.
2. Antes del primer commit, verifica la identidad: `git config user.name` y `git config user.email`. El correo debe ser uno de la cuenta de GitHub del integrante; si no coincide, GitHub no le acredita el commit. Muéstrasela al integrante y que confirme.
3. Trabajo en **su rama** (`jaziel`, `luis` o `yeudiel`) → `git pull origin main` → push de su rama → **Pull Request a `main`** con descripción. Nunca hagas `push --force` a `main`, ni reescribas historia ni hagas commits a nombre de otro.
4. Commits pequeños con mensajes claros en español (los mensajes del plan original se pueden reutilizar).
5. **Secretos**: `serviceAccountKey.json` y la cuenta de servicio NUNCA van al repo. Van solo en "Propiedades del script" de Apps Script. Revisa `git status` antes de cada commit. La `firebaseConfig` web y la clave pública VAPID sí pueden ir en `js/firebase-config.js`.
6. Si cambias archivos que cachea el service worker, sube `VERSION` en `sw.js`. Ese archivo es de Jaziel: pídeselo, o si lo haces tú, avísale.
7. Si un paso requiere una cuenta (Google, Firebase, GitHub, Apps Script), **detente y pide al integrante que lo haga él**. Nunca escribas contraseñas.
8. No inventes resultados de pruebas, capturas ni URLs. Todo enlace de un documento se verifica antes.

## Flujo por tarea (desarrollo guiado por especificaciones)
1. Leer la spec correspondiente en `docs/claude-kit/specs/`.
2. Auditar el estado actual del repo y de `alertavecinal-prueba` para esa parte.
3. Escribir o actualizar `docs/specs/<tarea>.md`: objetivo, requisitos (RF-n), criterios de aceptación, archivos que se tocarán y su dueño.
4. 🛑 **CHECKPOINT A**: mostrar resumen y plan. Esperar aprobación.
5. Implementar → probar (`npx serve -l 3000`, Playwright o manual) → registrar resultados en la spec.
6. Commit(s) en su rama → PR a `main`.
7. 🛑 **CHECKPOINT B**: dar el enlace al PR, qué probar y las capturas. **No seguir hasta que diga "continúa".**

## Documentos PDF
- Usa `docs/claude-kit/tools/utp_doc.py` (portada UTP guinda, logo, tablas, figuras, enlaces). Requiere `pip install reportlab pillow`. Para capturas: `pip install playwright` y `playwright install chromium`.
- **Individual** (SP4–SP7 de cada quien): `build_pdf(..., alumno="Nombre", matricula="...")`.
- **De equipo** (Producto 2): `build_pdf(..., integrantes=[(nombre, matrícula), ...])`.
- Formato: guinda `#7B173B`, Helvetica, carta, H1 guinda, cuerpo justificado, tablas con encabezado guinda, figuras con pie "Figura N.", referencias en APA 7, enlaces clicables.
- Revisa el PDF convertido a PNG antes de darlo por terminado.
- Guardar en `entregables/`: `Producto2_AlertaVecinal_Equipo.pdf`, y los individuales como `SPx_<Tema>_<Apellido>.pdf`.

## Instrucciones textuales de la profesora (son los criterios de evaluación)
**Producto No. 2 – Unidad II (100 pts, entrega 29 de noviembre)**
> Genera un documento a partir de un caso de estudio el cual incluya: Justificación de las plataformas y herramientas utilizadas; Parámetros de configuración de las plataformas y herramientas utilizadas; Reporte de pruebas; Evidencias de las características de la PWA; Vínculo (URL) de la aplicación publicada.
> Entrega en un repositorio de código fuente una aplicación web progresiva, con base en un caso de estudio, que incluya: Vistas generadas del lado del cliente y del servidor; Datos locales, remotos y offline; Notificaciones; Uso de elementos físicos del dispositivo.

**Subproductos individuales** (fuera de plazo en Classroom; solo si la profesora los acepta):
- **SP4 "API caché"**: define y explica cómo funciona la caché en una PWA; métodos principales de la API Cache; implementa una PWA que use métodos de la API Cache. Documento + URL de la app.
- **SP5 "Aportación"** (individual): propuesta de mejora a la app. PDF con: a) hoja de presentación, b) nombre de la aportación, c) categoría (creatividad, innovación, emprendimiento o combinación), d) problema o necesidad, e) descripción de la propuesta, f) valor agregado, g) elemento diferenciador, h) imágenes.
- **SP6 "Notificaciones"**: investigar y explicar las notificaciones push en una PWA (propósito, características, ventajas, aplicaciones prácticas); componentes y tecnologías necesarios; ejemplo sencillo que envíe y muestre notificaciones.
- **SP7 "Aportación – Backend"** (individual): desarrolla una aplicación backend PWA sobre la propuesta del SP5. Documenta con una **lista de cotejo de al menos 12 características de la PWA**. PDF.
