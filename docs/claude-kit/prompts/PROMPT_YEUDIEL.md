# Prompt de Yeudiel (integrante 3 · administración, instalación y Vecino Verificado Pro)

**Requisitos:** Git, Node.js y Claude Code; ser colaborador del repo `JazyelAe/alertavecinal` (ya lo eres, por el PR #3); y que Jaziel ya haya fusionado en `main` el kit (`CLAUDE.md` + `docs/claude-kit/`) y el núcleo de Apps Script.
En tu clon del repo, abre Claude Code y pega lo que está entre las líneas:

---

Soy **Gonzalez Barrios Yeudiel Nain** (GitHub `yeudev-utp`), integrante 3 del equipo AlertaVecinal. Lee `CLAUDE.md` completo y todo `docs/claude-kit/specs/`. **Solo creas o modificas mis archivos** según `00-plan-y-reparto.md`: `admin.html`, `js/admin.js`, `js/instalar.js`, `estadisticas.html`, `js/estadisticas.js`, `apps-script/Verificado.gs`, `apps-script/vista_verificado.html`, `README.md`, mis secciones de `docs/producto2/` y mis PDF individuales. Si algo requiere tocar un archivo de otro, detente y dime a quién pedírselo.

**Paso 0 · Preparación** (repórtame y espera):
1. Muéstrame `git config user.name` y `user.email` para confirmar que son de mi cuenta `yeudev-utp`. Pregúntame mi matrícula y anótala en la tabla de `CLAUDE.md` en mi primer commit.
2. Cámbiate a mi rama `yeudiel` y actualízala con `main`.
3. Revisa en el repo archivado `JazyelAe/alertavecinal-prueba` mis archivos de referencia (`estadisticas.html`, `js/estadisticas.js`, `README.md`, `entregables/Subproducto5_Aportacion.pdf`) y dime qué hay que adaptar. Ojo: en la prueba, "Vecino Verificado Pro" era una **maqueta**; ahora debe funcionar con datos reales de Firestore.

🛑 Espera mi "continúa".

**Luego, uno por uno, con 🛑 Checkpoint A (spec) y 🛑 Checkpoint B (PR) en cada uno:**
1. Commit `Aportación: Vecino Verificado Pro` (`estadisticas.html`, `js/estadisticas.js`) con datos reales: alertas por vecino, alertas útiles, antigüedad e insignia.
2. Commit `Vista de servidor: ficha de Vecino Verificado`: `apps-script/Verificado.gs` + `vista_verificado.html` (spec 01, RF-Y1, y RF-Y2 opcional), y el enlace desde mi módulo.
3. Commit `Documentación del README`: `README.md` completo según la spec 03, con la tabla de cumplimiento del Producto 2 y los créditos de los 3 integrantes. Se hace al final, cuando ya existan la URL publicada y las capturas.
4. Mi sección para el Producto 2 en `docs/producto2/yeudiel.md`: mi aportación, el panel de administración y la instalación, mis pruebas y mi conclusión firmada.
5. Mis PDF individuales (SP5 primero, luego SP7, SP6 y SP4) con `docs/claude-kit/tools/utp_doc.py` y `alumno="Gonzalez Barrios Yeudiel Nain", matricula="<la mía>"`, siguiendo la spec 04. Solo cuando yo te lo diga.

En cada PR, indica si Jaziel debe hacer `clasp push` y una nueva implementación. Lleva mi estado en `docs/PROGRESO_UNIDAD2.md`, en la sección de Yeudiel.

---
