# 04 · Entregas individuales SP4–SP7 (cada integrante las suyas)

Están vencidas en Classroom. **Hacerlas después del Producto 2** y solo si la profesora acepta entregas tardías. Cada PDF lleva portada individual: `build_pdf(..., alumno=..., matricula=...)`.
Título de portada: `SUBPRODUCTO No. X: <TEMA>`. Subtítulo: `Actividad Desarrollo · Unidad II – Desarrollo de aplicaciones web progresivas`.
Archivo: `entregables/SPx_<Tema>_<Apellido>.pdf`. Los PDF se generan con un script por integrante en `docs/individual/<nombre>/`.

| Integrante | Aportación (SP5) | Backend (SP7) |
|---|---|---|
| Jaziel | **Alerta sin señal**: alertas que se guardan sin conexión y se envían solas al volver la señal | `accion_alerta_sin_senal` + `vista_boletin` (Apps Script) |
| Luis | **Mapa de calor de incidentes** | `accion_push` + `vista_mapacalor` |
| Yeudiel | **Vecino Verificado Pro** | `vista_verificado` (+ `accion_verificar`) |

## SP4 "API caché"
1. Qué es la caché en una PWA y cómo funciona (service worker como proxy, ciclo install/activate/fetch, versiones).
2. Estrategias: *cache first*, *network first*, *stale-while-revalidate*, solo caché y solo red. Cuál usa AlertaVecinal para cada recurso.
3. **Métodos principales de la API Cache**, uno por uno con código real del repo: `caches.open`, `caches.keys`, `caches.match`, `caches.delete`, `caches.has`, `cache.add`, `cache.addAll`, `cache.put`, `cache.match`, `cache.matchAll`, `cache.keys`, `cache.delete`.
4. Implementación: `sw.js` y `demo-cache.html` con capturas de cada botón y de DevTools → Cache Storage.
5. URL de la app y de `demo-cache.html`. Conclusión y referencias.
> Jaziel ya tiene `entregables/Subproducto4_API_Cache.pdf`, generado con otro formato. Regenerarlo con la portada UTP, reutilizando el contenido.

## SP5 "Aportación" (exactamente los incisos de la profesora)
a) Hoja de presentación (la portada) · b) Nombre de la aportación · c) Categoría (creatividad, innovación, emprendimiento o combinación, justificada) · d) Problema o necesidad · e) Descripción de la propuesta (flujo, pantallas, datos) · f) Valor agregado (usuarios y proyecto) · g) Elemento diferenciador (comparar con WhatsApp vecinal y apps similares) · h) Imágenes (capturas reales de la función + diagrama de flujo). Conclusión y referencias.

## SP6 "Notificaciones"
1. Propósito, características, ventajas y aplicaciones prácticas de push en una PWA.
2. Componentes y tecnologías: Notifications API, Push API, service worker, servidor de push (FCM), claves VAPID, token, permiso, payload, `onMessage` vs. segundo plano. Diagrama del flujo completo de AlertaVecinal (alerta → Apps Script → FCM → service worker → notificación).
3. Ejemplo sencillo: `demo-push.html` (pedir permiso, ver token, recibir mensaje de prueba desde la consola de Firebase), con capturas paso a paso. Un ejemplo mínimo propio de cada integrante suma puntos: notificación local con `registration.showNotification` desde un botón.
4. Conclusión y referencias.

## SP7 "Aportación – Backend"
1. Resumen de la aportación (referencia al SP5).
2. Arquitectura del backend: Apps Script como servidor, Firestore REST, verificación de sesión, endpoints o vistas propias con tabla `Método · Ruta/acción · Entrada · Salida · Validaciones`.
3. Código explicado (fragmentos de **sus** `.gs` y `.html`) y capturas del funcionamiento: la vista de servidor, la respuesta JSON y el registro de ejecución de Apps Script.
4. **Lista de cotejo de ≥ 12 características de la PWA**: tabla `# · Característica · Cumple (Sí/No) · Cómo se verificó · Evidencia (Figura N)`. Sugeridas: HTTPS; manifest válido; iconos 192/512 + maskable; `display: standalone`; instalable; service worker registrado; *app shell* precacheado; funciona offline; página offline personalizada; estrategia de caché por tipo de recurso; actualización de versión del SW; Background Sync; notificaciones push; responsive; datos locales (IndexedDB); datos remotos en tiempo real; persistencia offline de Firestore; vistas de servidor; acceso a hardware (GPS, cámara, vibración); compartir nativo; seguridad (reglas Firestore y validación en servidor); rendimiento y accesibilidad (puede usarse Lighthouse en esas categorías, que siguen existiendo).
5. Conclusión y referencias.

## Criterios de aceptación (por PDF)
- [ ] Cumple todos los incisos de la instrucción textual.
- [ ] Capturas reales del integrante (no de otro).
- [ ] URL verificadas.
- [ ] Revisado página por página.
- [ ] Commit del integrante en su rama → PR.
