# Prompt de Jaziel (integrante 1 · dueño del repo · coordina)

**Antes de pegarlo:** descomprime el kit y copia `CLAUDE.md` a la raíz de tu clon de `alertavecinal` y el resto (`specs/`, `prompts/`, `tools/`, `README.md`) a `docs/claude-kit/`. Abre Claude Code en la raíz del repo. Pega lo que está entre las líneas:

---

Soy **Jahir Jaziel Serrano Arana** (GitHub `JazyelAe`, matrícula 2311080845), integrante 1 y dueño del repo. Lee `CLAUDE.md` completo y todo `docs/claude-kit/specs/`. Vamos a completar la Unidad II con desarrollo guiado por especificaciones. **Solo tocas los archivos que me asigna `00-plan-y-reparto.md`.**

**Paso 0 · Preparación** (repórtame y espera):
1. `git config user.name` / `user.email`: muéstramelos para confirmar que coinciden con mi cuenta de GitHub. Verifica `gh auth status`.
2. `git fetch --all`, cámbiate a mi rama `jaziel` y actualízala con `main`.
3. Haz una auditoría del repo actual contra `alertavecinal-prueba` (archivado, público): qué archivos faltan, de quién son según el reparto, y si la app abre con `npx serve -l 3000` y `?demo=1`. Revisa también si GitHub Pages está publicado y en qué URL.
4. Verifica herramientas: `node`, `npm`, `python`, `pip` y `clasp` (no lo instales sin preguntarme).

🛑 Espera mi "continúa".

**Luego, uno por uno, con 🛑 Checkpoint A (spec) y 🛑 Checkpoint B (PR) en cada uno:**
1. Commit `docs: kit de especificaciones Unidad II` (`CLAUDE.md` + `docs/claude-kit/`) → PR → avísame para fusionarlo **primero**, porque mis compañeros lo necesitan.
2. Spec 01 · núcleo de Apps Script: `apps-script/appsscript.json` + `Comun.gs` (router, Firestore REST, sesión), migrando las utilidades de `scripts/apps-script/Codigo.gs` del repo de prueba. **No** pongas la lógica del push: eso es de Luis (`Push.gs`). Déjale documentado el contrato `accion_push(datos)`. PR y fusionar pronto.
3. Spec 01 · `Boletin.gs` + `vista_boletin.html` (vista de servidor) y `SinSenal.gs` (backend de mi aportación), conectando `js/offline-sync.js` con `URL_BACKEND` y manteniendo el respaldo directo a Firestore.
4. Spec 02 · cámara, vibración y compartir en `js/alertas.js`, reglas de Firestore para la foto y persistencia offline de Firestore. Sube `VERSION` en `sw.js`.
5. Despliegue: te guío con `clasp` (yo hago el login y pego la cuenta de servicio en Propiedades del script). Configura `URL_BACKEND` y verifica Pages y los dominios autorizados de Firebase. Esto se hace cuando Luis y Yeudiel ya fusionaron sus partes; antes de eso, dime qué falta de ellos.
6. Spec 03 · pruebas integrales (Playwright + lista de pruebas manuales que yo haga con el teléfono), capturas de evidencias y `docs/producto2/generar_pdf.py` → `entregables/Producto2_AlertaVecinal_Equipo.pdf`. Pídeles sus secciones a Luis y Yeudiel (en sus `.md`) y sus matrículas.
7. Spec 04 · mis PDF individuales SP4, SP5, SP6 y SP7 (solo cuando yo te lo diga).

Lleva un `docs/PROGRESO_UNIDAD2.md` con el estado de cada paso de los 3 integrantes, para retomar en otra sesión. Cuando necesites capturas que no puedas tomar tú (teléfono, DevTools, instalación, notificación), dime el nombre del archivo, la carpeta y qué debe verse.

---

**Para retomar:** "Lee `CLAUDE.md`, `docs/PROGRESO_UNIDAD2.md` y la spec del paso en curso. Dime dónde nos quedamos y sigue respetando los checkpoints."
