# Spec · Push desde el backend de Apps Script (Luis · tarea 2)

**Basada en:** `docs/claude-kit/specs/00-plan-y-reparto.md`, contrato de `apps-script/Comun.gs` y `docs/claude-kit/specs/02-dispositivo-y-datos.md` (RF-D3)
**Dueño:** Luis · **Rama:** `luis`
**Estado:** aprobada el 24/11/2026 · implementada · pendiente de desplegar en Google (Jaziel)

## 1. Objetivo
Hoy el push real lo manda un proyecto de Apps Script aparte (`scripts/apps-script/Codigo.gs`, URL en `PUSH_ENDPOINT`). El equipo ya tiene un backend único (`apps-script/Comun.gs`, de Jaziel) con router, sesión y Firestore. Esta tarea mueve el push a ese backend como la acción `accion_push(datos)`, para que:
- el push use el mismo núcleo (sesión, cuenta de servicio, Firestore) que las demás acciones;
- «Alerta sin señal» (`SinSenal.gs`) pueda avisar a los vecinos, porque ya llama a `accion_push` si existe;
- la notificación vibre de forma explícita (elemento físico del dispositivo, RF-D3).

## 2. Auditoría
- **`scripts/apps-script/Codigo.gs`** (publicado, sigue en uso): recibe `{idToken, tipo: 'aviso'|'alerta', id}`; valida sesión (aprobado, admin para avisos), que el documento exista, sea del usuario y tenga ≤ 15 min; deduplica con `envios/<tipo>-<id>`; envía mensajes **solo de datos** por FCM v1 a todos los tokens menos los del autor; borra los tokens inválidos. Responde `{ok, enviadas, fallidas, tokensBorrados}` o `{ok, repetido:true, enviadas:0}`. Repite ayudantes que ya están en `Comun.gs` (token OAuth, lectura de Firestore, `uidDelToken_`).
- **`apps-script/Comun.gs`**: el router manda un POST **sin `accion`** a `accion_push` (compatibilidad con `js/push.js`). Ofrece `verificarSesion_`, `leerDoc_`, `crearDoc_({soloSiNoExiste})`, `borrarDoc_`, `tokenDeAcceso_`, `proyecto_`, `peticion_`.
- **`SinSenal.gs`** llama `accion_push({idToken, tipo:'alerta', id})` por cada alerta aceptada, justo después de crearla con hora del servidor.
- **`sw-push.js`**: ya pone `vibrate: [200, 100, 200]` al mostrar el push de datos. No distingue el tipo de alerta.
- **`js/push.js`**: manda el POST a `self.PUSH_ENDPOINT` (el proyecto viejo). `self.URL_BACKEND` (backend nuevo) ya está publicado, pero **todavía no tiene `Push.gs`**.
- **Simulador** `apps-script/pruebas/simulador.mjs` permite probar `.gs` en Node con Firestore en memoria (las llamadas a FCM hay que simularlas en la prueba).

## 3. Requisitos
| # | Requisito |
|---|---|
| RF-1 | `apps-script/Push.gs` define `accion_push(datos)` con la **misma entrada y salida** que `Codigo.gs`: `{idToken, tipo, id}` → `{ok, enviadas, fallidas, tokensBorrados}`, `{ok, enviadas:0, nota}` o `{ok, repetido:true, enviadas:0}`. Errores con `throw` (el router responde `{ok:false, error}`). |
| RF-2 | Usa los ayudantes de `Comun.gs` (`verificarSesion_`, `leerDoc_`, `crearDoc_`, `borrarDoc_`, `tokenDeAcceso_`, `proyecto_`); no los duplica. Solo agrega ayudantes propios con sufijo `Push_` para no chocar con otros archivos. |
| RF-3 | Seguridad igual que hoy: sesión real y aprobada; aviso solo de admin; documento existente, del mismo usuario y de ≤ 15 min; id con formato válido. |
| RF-4 | Deduplicación con `envios/<tipo>-<id>` (mismo documento que usa `Codigo.gs`, así el viejo y el nuevo no mandan dos veces el mismo push). |
| RF-5 | Mensaje solo de datos con `titulo`, `cuerpo`, `url`, `tag`, `alertaId` y **`tipo`** (nuevo, para la vibración); `webpush.headers` `Urgency: high`, `TTL: 3600`. Excluye los tokens del autor y borra los inválidos. |
| RF-6 | `sw-push.js`: vibración por tipo con detección de soporte. Emergencia médica y fuga de gas: patrón largo `[300,100,300,100,300]`; demás: `[200,100,200]`. Se documenta que iOS ignora `vibrate`. |
| RF-7 | `js/push.js`: si existe `URL_BACKEND`, manda `{accion:'push', …}` ahí; si el backend responde que la acción no existe o no contesta, **usa `PUSH_ENDPOINT` como respaldo**. Así funciona antes y después de que Jaziel despliegue `Push.gs`, sin duplicar pushes (RF-4). |
| RF-8 | **No se borra** `scripts/apps-script/Codigo.gs`. |

## 4. Archivos
| Archivo | Dueño | Cambio |
|---|---|---|
| `apps-script/Push.gs` | Luis | Nuevo |
| `sw-push.js` | Luis | Vibración por tipo |
| `js/push.js` | Luis | `URL_BACKEND` con respaldo a `PUSH_ENDPOINT` |
| `apps-script/pruebas/prueba_push.mjs` | Luis | Nuevo (prueba local, como `prueba_verificado.mjs` de Yeudiel) |
| `docs/specs/luis-01-push-apps-script.md` | Luis | Esta spec |

`sw.js` guarda en caché `sw-push.js` y `js/push.js`: hay que **subir `VERSION`**. `sw.js` es de Jaziel → se le pide en el PR, no se edita aquí.

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica |
|---|---|---|
| CA-1 | `GET` del backend lista la acción `push`. | Prueba local |
| CA-2 | POST sin `accion` y con `accion:'push'` llegan a `accion_push`. | Prueba local |
| CA-3 | Rechaza: sin token, token falso, no aprobado, aviso de no admin, documento ajeno, viejo o inexistente, id inválido. | Prueba local |
| CA-4 | Envía a todos los tokens menos al autor, con `tipo` en los datos, y borra los inválidos. | Prueba local con FCM simulado |
| CA-5 | La segunda llamada con el mismo id responde `repetido:true` y no envía. | Prueba local |
| CA-6 | `accion_alerta_sin_senal` + `Push.gs` juntos: la alerta aceptada dispara el push. | Prueba local |
| CA-7 | La app en `?demo=1` sigue igual; «Lanzar notificación local» funciona. | Navegador local |
| CA-8 | Push real en Google con Firestore y FCM. | Despliegue de Jaziel (`clasp push` + nueva implementación) |

## 6. Pruebas (24/11/2026)
| # | Prueba | Resultado |
|---|---|---|
| CA-1 a CA-6 | `node apps-script/pruebas/prueba_push.mjs` (simulador del equipo + FCM simulado): lista la acción, rechaza 11 casos inválidos, envía a todos menos al autor, mensaje solo de datos con `tipo`, borra el token que FCM no reconoce, `repetido` en la 2.ª llamada, aviso del admin, y alerta sin señal → push | ✅ 10/10 |
| — | Las pruebas existentes del equipo siguen pasando (`prueba_comun`, `prueba_boletin`, `prueba_sin_senal`, `prueba_verificado`) | ✅ 13/13, 9/9, 9/9, 12/12 |
| RF-6 | `sw-push.js` ejecutado en un entorno simulado de service worker: `medica` y `gas` → `[300,100,300,100,300]`; `robo`, `otro`, `aviso` y sin tipo → `[200,100,200]` | ✅ |
| CA-7 | `http://localhost:3000/demo-push.html?demo=1` con el service worker limpio: `sw.js` se instala con `sw-push.js`, sin errores en consola; en demo `enviarPushReal` no llama a ningún servidor (devuelve `null`) | ✅ |
| CA-8 | Push real en Google | ⏳ Pendiente del despliegue de Jaziel |

**Despliegue (Jaziel):** `clasp push` y `clasp deploy -i <id de Backend v3>` para que `URL_BACKEND` tenga la acción `push`. Subir `VERSION` en `sw.js`, porque cambian `sw-push.js` y `js/push.js`. Hasta entonces, `js/push.js` usa `PUSH_ENDPOINT` como respaldo y el push sigue funcionando como hoy.
