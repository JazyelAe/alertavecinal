# Prompt de Luis (integrante 2 · mapa, push y mapa de calor)

**Actualizado el 23/11/2026.** Tus commits de mapa, push y mapa de calor **ya están en `main`** (PR #4). Este prompt solo trae lo que te falta.

## Antes de pegar el prompt

1. Ten Git, Node.js y Claude Code instalados.
2. Descarga el zip **más reciente** que te mandó Jaziel (`Integrante2_Luis_Xicali.zip`, con los PDF finales) en tu carpeta **Descargas** y descomprímelo en PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\AlertaVecinal" | Out-Null
Expand-Archive "$HOME\Downloads\Integrante2_Luis_Xicali.zip" -DestinationPath "$HOME\AlertaVecinal\zip" -Force
```

3. Actualiza tu rama. Si ya tienes la carpeta `$HOME\AlertaVecinal\alertavecinal`:

```powershell
Set-Location "$HOME\AlertaVecinal\alertavecinal"
git switch luis
git pull origin main --no-edit
```

   Si no la tienes, clónala primero:

```powershell
Set-Location "$HOME\AlertaVecinal"
git clone https://github.com/JazyelAe/alertavecinal.git
Set-Location "$HOME\AlertaVecinal\alertavecinal"
git switch luis
git pull origin main --no-edit
```

4. En esa misma carpeta abre Claude Code (`claude`) y pega lo que está entre las líneas.

---

Soy **Xicali Diaz Luis Alberto** (GitHub `LuisAlbertoXicaliDiaz`, rama `luis`, matrícula 2311081407), integrante 2 del equipo AlertaVecinal. Lee `CLAUDE.md`, `docs/PROGRESO_UNIDAD2.md` y `docs/claude-kit/specs/` (00, 01, 02 y 03).

**Solo creas o modificas mis archivos:** `js/mapa.js`, `js/push.js`, `sw-push.js`, `demo-push.html`, `js/heatmap.js`, `apps-script/Push.gs`, `apps-script/MapaCalor.gs`, `apps-script/vista_mapacalor.html`, `entregables/Subproducto6_Notificaciones.pdf`, `docs/producto2/luis.md`, mis specs en `docs/specs/` y mis PDF individuales. **No edites** `docs/PROGRESO_UNIDAD2.md`, `CLAUDE.md` ni archivos de otros: si algo lo requiere, detente y dime a quién pedírselo.

Mis commits de mapa, push con FCM y mapa de calor **ya están en `main`** (PR #4): no los rehagas.

**Paso 0 · Preparación** (repórtame y espera):
1. Muéstrame `git config user.name` y `git config user.email`. Deben ser mi nombre y un correo de mi cuenta `LuisAlbertoXicaliDiaz`.
2. Confirma que estoy en la rama `luis`, que ya tiene lo último de `main` y que `git status` está limpio.
3. Confirma que existe `$HOME\AlertaVecinal\zip\paso-13_documentacion-subproducto-6\entregables\Subproducto6_Notificaciones.pdf`.

🛑 Espera mi "continúa".

**Tareas, en este orden.** Cada una con 🛑 Checkpoint A (spec en `docs/specs/`) y 🛑 Checkpoint B (Pull Request de `luis` a `main`):

1. **Commit `Documentación Subproducto 6`:** copia ese PDF del zip a `entregables/Subproducto6_Notificaciones.pdf`. Ya es la versión final: **no lo regeneres**. Revisa que la portada tenga profesora, matrículas y la URL, sin corchetes.
2. **Commit `Push desde el backend de Apps Script`:** crea `apps-script/Push.gs` con `accion_push(datos)`, migrando la lógica de `scripts/apps-script/Codigo.gs` al contrato que está al inicio de `apps-script/Comun.gs`, y agrega `vibrate` a las notificaciones de `sw-push.js` (spec 02). **No borres `scripts/apps-script/Codigo.gs`:** la app publicada lo sigue usando hasta que Jaziel despliegue el backend nuevo.
3. **Commit `Vista de servidor: reporte de mapa de calor`:** `apps-script/MapaCalor.gs` + `apps-script/vista_mapacalor.html` (spec 01, RF-L2), y el enlace a la vista desde `js/heatmap.js`.
4. **Commit `docs: sección de Luis para el Producto 2`:** `docs/producto2/luis.md` (spec 03): mi aportación, la justificación de Leaflet, Nominatim y FCM, la configuración de FCM y VAPID, mis pruebas y mi conclusión.
5. **Mis PDF individuales** (SP6, SP5 y SP7, spec 04): **solo cuando Jaziel lo indique**.

Para probar la app usa `npx --yes http-server -p 3000 -c-1` y abre `http://localhost:3000/?demo=1` en una ventana de incógnito nueva.

En la descripción de cada Pull Request escribe qué hiciste, cómo lo probaste y si Jaziel debe hacer `clasp push` y una nueva implementación. No unas tú el Pull Request: avísale a Jaziel.

**Fechas:** tareas 1 a 3 en Pull Request a más tardar el **martes 24 de noviembre**; tarea 4 el **jueves 26**. La entrega es el domingo 29.

---
