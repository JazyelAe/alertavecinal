# Yeudiel · 03 · Documentación del README

**Dueño:** Gonzalez Barrios Yeudiel Nain (`yeudiel`) · **Fecha límite del PR:** viernes 27 de noviembre de 2026
**Commit:** `Documentación del README` · Base: spec 03 de `docs/claude-kit/specs/` (sección "Repositorio") y el `README.md` del zip (paso 14).

## Objetivo
Crear el `README.md` de la raíz: la portada del repositorio que revisa la profesora. Debe explicar qué es AlertaVecinal, dónde está publicada, cómo ejecutarla y, sobre todo, **dónde se cumple cada requisito del Producto 2** dentro del código, con los créditos de los tres integrantes.

## Punto de partida
- En `main` no hay `README.md`.
- El README del zip (5/11) es una guía de instalación de la Unidad I: no menciona Apps Script, las vistas de servidor, el Panel Pro ni la verificación, y describe el push con `scripts/enviar-push.js` como camino principal. Se reutilizan sus pasos de Firebase y GitHub Pages, actualizados.

## Requisitos
- **RF-1 Encabezado:** nombre, descripción en 2–3 líneas, materia, grupo y profesora, y los enlaces verificados: app publicada (GitHub Pages), modo demostración (`?demo=1`), backend de Apps Script (`/exec`) y sus vistas de servidor.
- **RF-2 Capturas:** imágenes de `docs/producto2/evidencias/` (panel, celular, boletín y su código fuente, offline). Solo se enlazan archivos que existen en `main`.
- **RF-3 Funcionalidades:** lista breve por tipo de usuario (vecino, administrador, comité) y por aportación (Alerta sin señal, Mapa de calor, Vecino Verificado Pro).
- **RF-4 Tabla de cumplimiento del Producto 2:** cada requisito de la profesora → archivos y funciones que lo implementan → cómo comprobarlo. Requisitos: vistas del cliente; vistas del servidor; datos locales; datos remotos; datos offline; notificaciones; elementos físicos del dispositivo; y las partes del documento (justificación, configuración, pruebas, evidencias, URL).
- **RF-5 Arquitectura:** diagrama `docs/producto2/evidencias/arquitectura.png` y una explicación corta (PWA ⇄ Firebase ⇄ Apps Script ⇄ OpenStreetMap/Nominatim).
- **RF-6 Estructura del proyecto:** árbol comentado de carpetas y archivos principales, indicando el dueño de cada parte.
- **RF-7 Cómo ejecutar:** (a) en local con `?demo=1` sin Firebase; (b) con Firebase propio (pasos resumidos del zip); (c) pruebas del backend con `node apps-script/pruebas/*.mjs`; (d) despliegue del backend con clasp, **sin valores secretos** (solo el nombre de la propiedad `SERVICE_ACCOUNT`).
- **RF-8 Entregables:** enlaces a los PDF de `entregables/`, solo a los que existen en `main` al momento del commit.
- **RF-9 Créditos:** tabla con los 3 integrantes, usuario de GitHub, rama y sus aportaciones, y el enlace a *Insights → Contributors*.
- **RF-10 Seguridad:** recordatorio de que la cuenta de servicio y `serviceAccountKey.json` nunca van al repo.
- **RF-11 Verificación:** antes del commit se comprueba que todos los enlaces internos apuntan a archivos existentes y que las URL externas responden. No se inventan resultados ni URL.

## Fuera de alcance
- No se editan `CLAUDE.md`, `docs/PROGRESO_UNIDAD2.md` ni archivos de otros integrantes.
- Si falta alguna captura o PDF (por ejemplo, el documento del Producto 2), el README lo deja como "pendiente" y se actualiza en un commit posterior.

## Archivos que se tocan
| Archivo | Dueño | Cambio |
|---|---|---|
| `README.md` | Yeudiel | Nuevo |
| `docs/specs/yeudiel-03-readme.md` | Yeudiel | Esta spec |

## Criterios de aceptación
- [ ] La tabla de cumplimiento cubre los 7 requisitos del repositorio y las 5 partes del documento.
- [ ] Todos los enlaces internos existen en el repo y las URL externas responden.
- [ ] Créditos con los 3 integrantes.
- [ ] Sin secretos ni valores de configuración privados.

## Pruebas (24/11/2026)
| # | Prueba | Resultado |
|---|---|---|
| 1 | Los 18 enlaces internos del README apuntan a archivos o carpetas que existen en el repo | ✅ 18/18 |
| 2 | URL externas: app publicada, `?demo=1`, `estadisticas.html?demo=1`, boletín en el backend, repositorio, Contributors, perfiles de GitHub de los 3 integrantes y consola de Firebase | ✅ Todas responden 200 |
| 3 | Estado del backend publicado (`GET /exec`): `configurado: true`, vistas `boletin` y `verificado`, acciones `alerta_sin_senal` y `verificar` | ✅ La vista `mapacalor` y la acción `push` están en el repo pero aún no publicadas; el README lo indica |
| 4 | Ficha publicada con un `uid` inexistente → página genérica con el pie "Generado en el servidor" | ✅ |
| 5 | Los 6 comandos de pruebas del backend citados en el README se ejecutan | ✅ comun 13/13, boletin 9/9, sin_senal 9/9, push 10/10, verificado 12/12 · ⚠️ mapacalor 8/9 |
| 6 | Sin secretos: solo se nombra la propiedad `SERVICE_ACCOUNT`, sin valores | ✅ |

**Observación para el dueño de `MapaCalor.gs`:** en `prueba_mapacalor.mjs` falla el caso "Una dirección con `</script>` no puede inyectar código" (8/9). No es un archivo de Yeudiel, así que no se modificó; se avisa al equipo.
