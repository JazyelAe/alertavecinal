# 03 · Documento del Producto 2 (lo coordina Jaziel; cada integrante aporta su sección)

**Archivo:** `entregables/Producto2_AlertaVecinal_Equipo.pdf` · Portada de **equipo** con los 3 integrantes y sus matrículas.
Título: `PRODUCTO No. 2: ALERTAVECINAL, RED DE SEGURIDAD VECINAL (PWA)`. Subtítulo: `Unidad II – Desarrollo de aplicaciones web progresivas · Caso de estudio`.
Encabezado interior: `APLICACIONES WEB PROGRESIVAS · PRODUCTO 2`.
Se genera con un script `docs/producto2/generar_pdf.py` (de Jaziel) que lee los textos de `docs/producto2/*.md` y las capturas de `docs/producto2/evidencias/`. Luis y Yeudiel escriben sus secciones en sus propios `.md` (en sus commits) y Jaziel genera el PDF.

## Contenido (las secciones 2–6 son literalmente lo que pide la profesora)
1. **Caso de estudio**: problema (inseguridad en la colonia, grupos de WhatsApp desordenados, sin ubicación, sin verificación), usuarios (vecino, administrador), objetivos y alcance. Diagrama de arquitectura (PWA ⇄ Firestore/Auth/FCM ⇄ Apps Script ⇄ Nominatim/OSM).
2. **Justificación de plataformas y herramientas**: tabla Herramienta · Para qué · Por qué se eligió · Alternativa descartada. Incluir: HTML/CSS/JS sin framework, GitHub + GitHub Pages, Firebase Auth, Firestore, FCM, Apps Script (por qué no Cloud Functions: plan Spark sin tarjeta), Leaflet + OSM, Nominatim, IndexedDB, Cache Storage, Background Sync, clasp, Playwright, DevTools.
3. **Parámetros de configuración**: tablas o bloques comentados de:
   - `manifest.json` (cada campo y su valor)
   - `sw.js` (versión, nombres de caché, estrategia por tipo de recurso, rutas precacheadas)
   - `firebase-config.js` (qué es cada clave, sin exponer secretos)
   - `firestore.rules` (reglas explicadas)
   - Authentication (método, dominios autorizados)
   - FCM (VAPID, API v1)
   - Apps Script (`appsscript.json`, propiedades del script **sin valores**, tipo de implementación, acceso)
   - GitHub Pages (rama y carpeta)
4. **Reporte de pruebas**: tabla `ID · Requisito · Pasos · Resultado esperado · Resultado obtenido · ✅/❌ · Evidencia (Figura N)`. Mínimo 20 casos, que cubran: registro y aprobación, login, enviar alerta, tiempo real, mapa, mapa de calor, push (app abierta, en segundo plano y cerrada), instalación, offline (shell, lista, offline.html), alerta sin señal y sincronización, API caché (demo-cache), cámara, vibración, compartir, GPS, las 3 vistas de servidor, permisos de reglas (vecino no puede volverse admin), responsive. Automatiza con Playwright lo que se pueda (`?demo=1`, `context.set_offline(True)`) y deja el resto como prueba manual con captura. **No marcar ✅ algo que no se probó.**
5. **Evidencias de las características de la PWA**: una figura con descripción por característica: instalable (diálogo y ventana standalone), manifest, service worker activo, Cache Storage, offline, Background Sync, push recibido, HTTPS, responsive (móvil/escritorio), vistas cliente vs. servidor (código fuente con datos incrustados), datos locales (IndexedDB en DevTools), datos remotos (Firestore), elementos del dispositivo (GPS, cámara, vibración, compartir).
6. **Vínculos**: URL de la app publicada, URL del repositorio, URL del backend (`/exec` y las 3 vistas) y captura de **Insights → Contributors** con los 3 integrantes.
7. **Aportaciones del equipo**: 1 párrafo por integrante: su aportación, sus commits y su vista de servidor.
8. **Conclusiones** (una por integrante, firmadas) y **Referencias APA 7** (MDN, web.dev, Firebase docs, Google Apps Script docs, Leaflet).

## Repositorio (segunda parte del Producto 2)
- `README.md` (lo hace Yeudiel): descripción, capturas, URL, cómo ejecutar, arquitectura, tabla de "cumplimiento del Producto 2" que relacione cada requisito con archivos o funciones, y créditos con los 3 integrantes.
- Verificar que `main` tiene todo fusionado y que la app publicada corresponde al último commit.

## Criterios de aceptación
- [ ] Las 6 partes que pide la profesora están presentes y con el título igual al de la instrucción.
- [ ] Cada requisito del repo (cliente/servidor, datos locales/remotos/offline, notificaciones, dispositivo) tiene al menos una evidencia y una prueba.
- [ ] Todas las URLs abren.
- [ ] PDF revisado página por página.
- [ ] Subido a `entregables/` y fusionado en `main` antes del sábado 28.
