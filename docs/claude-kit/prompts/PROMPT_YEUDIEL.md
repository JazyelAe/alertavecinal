# Prompt de Yeudiel (integrante 3 · administración, instalación y Vecino Verificado Pro)

**Actualizado el 23/11/2026.** Tus commits del panel de administración y del botón de instalar **ya están en `main`** (PR #3). Este prompt solo trae lo que te falta.

## Antes de pegar el prompt

1. Ten Git, Node.js y Claude Code instalados.
2. Descarga el zip **más reciente** que te mandó Jaziel (`Integrante3_Yeudiel_Gonzalez.zip`, con los PDF finales) en tu carpeta **Descargas** y descomprímelo en PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\AlertaVecinal" | Out-Null
Expand-Archive "$HOME\Downloads\Integrante3_Yeudiel_Gonzalez.zip" -DestinationPath "$HOME\AlertaVecinal\zip" -Force
```

3. Actualiza tu rama. Si ya tienes la carpeta `$HOME\AlertaVecinal\alertavecinal`:

```powershell
Set-Location "$HOME\AlertaVecinal\alertavecinal"
git switch yeudiel
git pull origin main --no-edit
```

   Si no la tienes, clónala primero:

```powershell
Set-Location "$HOME\AlertaVecinal"
git clone https://github.com/JazyelAe/alertavecinal.git
Set-Location "$HOME\AlertaVecinal\alertavecinal"
git switch yeudiel
git pull origin main --no-edit
```

4. En esa misma carpeta abre Claude Code (`claude`) y pega lo que está entre las líneas.

---

Soy **Gonzalez Barrios Yeudiel Nain** (GitHub `yeudev-utp`, rama `yeudiel`, matrícula 2311081344), integrante 3 del equipo AlertaVecinal. Lee `CLAUDE.md`, `docs/PROGRESO_UNIDAD2.md` y `docs/claude-kit/specs/` (00, 01 y 03).

**Solo creas o modificas mis archivos:** `admin.html`, `js/admin.js`, `js/instalar.js`, `estadisticas.html`, `js/estadisticas.js`, `apps-script/Verificado.gs`, `apps-script/vista_verificado.html`, `README.md`, `entregables/Subproducto5_Aportacion.pdf`, `entregables/GUIA_REPOSITORIO.md`, `entregables/GUIA_REPOSITORIO.pdf`, `docs/producto2/yeudiel.md`, mis specs en `docs/specs/` y mis PDF individuales. **No edites** `docs/PROGRESO_UNIDAD2.md`, `CLAUDE.md` ni archivos de otros: si algo lo requiere, detente y dime a quién pedírselo.

Mis commits del panel de administración y del botón de instalar **ya están en `main`** (PR #3): no los rehagas.

**Paso 0 · Preparación** (repórtame y espera):
1. Muéstrame `git config user.name` y `git config user.email`. Deben ser mi nombre y un correo de mi cuenta `yeudev-utp`.
2. Confirma que estoy en la rama `yeudiel`, que ya tiene lo último de `main` y que `git status` está limpio.
3. Confirma que en `$HOME\AlertaVecinal\zip` existen `paso-10_vecino-verificado-pro` y `paso-14_documentacion-subproducto-5-readme`.

🛑 Espera mi "continúa".

**Tareas, en este orden.** Cada una con 🛑 Checkpoint A (spec en `docs/specs/`) y 🛑 Checkpoint B (Pull Request de `yeudiel` a `main`):

1. **Commit `Aportación: Vecino Verificado Pro`:** `estadisticas.html` + `js/estadisticas.js`. Parte de los archivos de `$HOME\AlertaVecinal\zip\paso-10_vecino-verificado-pro` y haz que use **datos reales** de Firestore (alertas por vecino, alertas útiles, antigüedad e insignia), no de maqueta. Hoy es lo único que le falta a la app: en el menú aún no aparece **Panel Pro**.
2. **Commit `Documentación Subproducto 5 y guía del repositorio`:** copia del zip, desde `paso-14_documentacion-subproducto-5-readme\entregables`, los archivos `Subproducto5_Aportacion.pdf`, `GUIA_REPOSITORIO.md` y `GUIA_REPOSITORIO.pdf` a `entregables/`. Ya son finales: **no los regeneres**. El `README.md` de ese paso **todavía no** (va en la tarea 5).
3. **Commit `Vista de servidor: ficha de Vecino Verificado`:** `apps-script/Verificado.gs` + `apps-script/vista_verificado.html` (spec 01, RF-Y1, y RF-Y2 opcional), y el enlace desde mi módulo.
4. **Commit `docs: sección de Yeudiel para el Producto 2`:** `docs/producto2/yeudiel.md` (spec 03): mi aportación, el panel de administración y la instalación, mis pruebas y mi conclusión.
5. **Commit `Documentación del README`:** `README.md` completo según la spec 03, con la tabla de cumplimiento del Producto 2 y los créditos de los 3 integrantes. Puedes partir del `README.md` del zip (paso 14). Se hace al final, cuando Jaziel confirme la URL publicada y las capturas.
6. **Mis PDF individuales** (SP5, SP7, SP6 y SP4, spec 04): **solo cuando Jaziel lo indique**.

Para probar la app usa `npx --yes http-server -p 3000 -c-1` y abre `http://localhost:3000/?demo=1` en una ventana de incógnito nueva.

En la descripción de cada Pull Request escribe qué hiciste, cómo lo probaste y si Jaziel debe hacer `clasp push` y una nueva implementación. No unas tú el Pull Request: avísale a Jaziel.

**Fechas:** tareas 1 a 3 en Pull Request a más tardar el **martes 24 de noviembre**; tarea 4 el **jueves 26**; tarea 5 el **viernes 27**. La entrega es el domingo 29.

---
