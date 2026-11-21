# Kit Unidad II · AlertaVecinal (Producto 2 + subproductos individuales)

## Qué trae
| Archivo | Para qué |
|---|---|
| `CLAUDE.md` | Contexto común: equipo, proyecto, reglas de commits por integrante, flujo con checkpoints, formato de PDF e instrucciones textuales de la profesora |
| `specs/00-plan-y-reparto.md` | Diagnóstico, **dueño de cada archivo**, orden de turnos y calendario al 29 de noviembre |
| `specs/01-vistas-servidor-apps-script.md` | Lo que faltaba: **vistas generadas en servidor** con Apps Script (y backend individual del SP7) |
| `specs/02-dispositivo-y-datos.md` | Cámara, vibración, compartir y GPS, más datos offline completos |
| `specs/03-producto2-documento.md` | Estructura del documento del Producto 2 y del README |
| `specs/04-entregas-individuales.md` | SP4, SP5, SP6 y SP7 de cada integrante |
| `prompts/PROMPT_JAZIEL.md`, `PROMPT_LUIS.md`, `PROMPT_YEUDIEL.md` | Lo que cada quien pega en su Claude Code |
| `tools/utp_doc.py` + `logo_utp.png` | Generador de PDF con portada UTP (individual o de equipo) |

## Cómo instalarlo (lo hace Jaziel una vez)
1. En tu clon de `alertavecinal`, en la rama `jaziel`:
   - `CLAUDE.md` → raíz del repo
   - `README.md`, `specs/`, `prompts/`, `tools/` → `docs/claude-kit/`
2. Abre Claude Code en la raíz y pega `prompts/PROMPT_JAZIEL.md`. Tu primer commit es el kit; fusiónalo a `main` cuanto antes.
3. Pásales a Luis y Yeudiel su prompt (ya va dentro del repo, en `docs/claude-kit/prompts/`).

## Lo que deben confirmar
- Usuario de GitHub y matrícula de Luis, y matrícula de Yeudiel (Claude Code se los pregunta).
- Que Luis acepte la invitación de colaborador del repo.
- Jaziel: acceso a la cuenta de Google o Firebase del proyecto (para Apps Script y la cuenta de servicio).
