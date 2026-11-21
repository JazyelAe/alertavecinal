# Prompt de Luis (integrante 2 · mapa, push y mapa de calor)

**Requisitos:** tener Git, Node.js y Claude Code; haber aceptado la invitación como colaborador del repo `JazyelAe/alertavecinal`; y que Jaziel ya haya fusionado en `main` el kit (`CLAUDE.md` + `docs/claude-kit/`) y el núcleo de Apps Script (`apps-script/Comun.gs`).
Clona el repo (`git clone https://github.com/JazyelAe/alertavecinal.git`), entra a la carpeta, abre Claude Code y pega lo que está entre las líneas:

---

Soy **Xicali Diaz Luis Alberto**, integrante 2 del equipo AlertaVecinal. Lee `CLAUDE.md` completo y todo `docs/claude-kit/specs/`. **Solo creas o modificas mis archivos** según `00-plan-y-reparto.md`: `js/mapa.js`, `js/push.js`, `sw-push.js`, `demo-push.html`, `js/heatmap.js`, `apps-script/Push.gs`, `apps-script/MapaCalor.gs`, `apps-script/vista_mapacalor.html`, mis secciones de `docs/producto2/` y mis PDF individuales. Si algo requiere tocar un archivo de otro, detente y dime a quién pedírselo.

**Paso 0 · Preparación** (repórtame y espera):
1. Muéstrame `git config user.name` y `git config user.email`. Deben ser mi nombre y un correo de **mi** cuenta de GitHub; si no, ayúdame a configurarlos (solo en este repo si la compu es compartida). Pregúntame mi usuario de GitHub y mi matrícula, y anótalos en la tabla de `CLAUDE.md` en mi primer commit.
2. Cámbiate a mi rama `luis` (o créala desde `main`) y actualízala con `main`.
3. Revisa en el repo archivado `JazyelAe/alertavecinal-prueba` mis archivos de referencia (`js/mapa.js`, `js/push.js`, `sw-push.js`, `demo-push.html`, `js/heatmap.js`, `scripts/apps-script/Codigo.gs`) y dime qué hay que adaptar al repo nuevo.

🛑 Espera mi "continúa".

**Luego, uno por uno, con 🛑 Checkpoint A (spec) y 🛑 Checkpoint B (PR) en cada uno:**
1. Commit `Mapa de alertas con Leaflet y Nominatim` (`js/mapa.js`).
2. Commit `Notificaciones push con FCM y Apps Script`: `js/push.js`, `sw-push.js` (agrega `vibrate` a las notificaciones, según la spec 02), `demo-push.html` y `apps-script/Push.gs` con `accion_push(datos)`, migrando la lógica de `Codigo.gs` con el contrato que dejó Jaziel en `Comun.gs`.
3. Commit `Aportación: Mapa de calor de incidentes` (`js/heatmap.js`).
4. Commit `Vista de servidor: reporte de mapa de calor`: `apps-script/MapaCalor.gs` + `vista_mapacalor.html` (spec 01, RF-L2), y el enlace a la vista desde `js/heatmap.js`.
5. Mi sección para el Producto 2 en `docs/producto2/luis.md`: mi aportación, la justificación de Leaflet, Nominatim y FCM, la configuración de FCM y VAPID, mis pruebas y mi conclusión firmada.
6. Mis PDF individuales (SP6 primero, luego SP5 y SP7) con `docs/claude-kit/tools/utp_doc.py` y `alumno="Xicali Diaz Luis Alberto", matricula="<la mía>"`, siguiendo la spec 04. Solo cuando yo te lo diga.

Después de cada PR, avísale a Jaziel en el mensaje del PR qué se necesita desplegar (por ejemplo, "hay que hacer clasp push por Push.gs"). Lleva mi estado en `docs/PROGRESO_UNIDAD2.md`, en la sección de Luis.

---
