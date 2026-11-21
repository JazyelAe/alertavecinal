/**
 * ============================================================
 *  AlertaVecinal · Backend en Google Apps Script · NÚCLEO (Comun.gs)
 *  Dueño: Jaziel. Los demás integrantes NO editan este archivo.
 * ============================================================
 *  Este proyecto de Apps Script es el backend de la PWA (plan Spark de
 *  Firebase, sin Cloud Functions). Hace dos cosas:
 *   1. VISTAS GENERADAS EN EL SERVIDOR: GET ?vista=nombre → el HTML se arma
 *      aquí, en los servidores de Google, con datos ya leídos de Firestore.
 *   2. ACCIONES DE BACKEND: POST {accion: "nombre", ...} → lógica que necesita
 *      la cuenta de servicio (push, alerta sin señal, verificación...).
 *
 *  CONVENCIÓN (así nadie edita el archivo de otro):
 *   - Cada vista es una función  vista_<nombre>(e)   en el archivo de su dueño.
 *   - Cada acción es una función accion_<nombre>(datos) en el archivo de su dueño.
 *   - El router de abajo las encuentra solas por su nombre.
 *
 *  CONTRATOS ACORDADOS
 *   Jaziel  · Boletin.gs   vista_boletin(e)              → renderVista_('vista_boletin', datos, título)
 *           · SinSenal.gs  accion_alerta_sin_senal(d)    d = {accion, idToken, alertas:[{idCola, ...}]}
 *   Luis    · Push.gs      accion_push(d)                d = {idToken, tipo: 'aviso'|'alerta', id}
 *                          (misma entrada y salida que hoy tiene scripts/apps-script/Codigo.gs:
 *                           {ok, enviadas, fallidas, tokensBorrados} o {ok, repetido:true}).
 *                          OJO: un POST SIN "accion" llega aquí, porque así llama hoy js/push.js.
 *           · MapaCalor.gs vista_mapacalor(e)
 *   Yeudiel · Verificado.gs vista_verificado(e)  (e.parameter.uid)  y  accion_verificar(d) (opcional, solo admin)
 *   Todas las acciones devuelven un objeto; el router lo convierte en JSON.
 *   Todas las vistas devuelven renderVista_(...); las públicas NO muestran nombres,
 *   correos, teléfonos ni ubicación exacta (usar redondearCoord_).
 *
 *  CONFIGURACIÓN (la hace Jaziel con su cuenta; nunca en el repositorio):
 *   - Propiedades del script → SERVICE_ACCOUNT = contenido completo de la clave JSON.
 *   - Implementar → Aplicación web · Ejecutar como: Yo · Acceso: Cualquier usuario.
 * ============================================================
 */

const SERVICIO = 'AlertaVecinal Backend';
const NOMBRE_VALIDO = /^[a-z0-9_]{1,40}$/;
const SCOPES = 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging';

/* ======================= ROUTER ======================= */

function doGet(e) {
  const nombre = (e && e.parameter && e.parameter.vista) || '';
  if (!nombre) return responderJson_(estado_());
  if (!NOMBRE_VALIDO.test(nombre)) return paginaError_('El nombre de la vista no es válido.');
  const vista = funcionGlobal_('vista_' + nombre);
  if (!vista) return paginaError_(`La vista «${nombre}» no existe (todavía).`);
  try {
    return vista(e);
  } catch (error) {
    console.error('Vista ' + nombre, error);
    return paginaError_('No se pudo generar la vista: ' + mensaje_(error));
  }
}

function doPost(e) {
  try {
    // La app envía JSON como text/plain para evitar la verificación CORS previa, que Apps Script no admite.
    const datos = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const accion = datos.accion || 'push';   // compatibilidad: js/push.js no manda "accion"
    if (!NOMBRE_VALIDO.test(accion)) throw new Error('Acción no válida');
    const funcion = funcionGlobal_('accion_' + accion);
    if (!funcion) return responderJson_({ ok: false, error: `La acción «${accion}» no existe` });
    return responderJson_(funcion(datos));
  } catch (error) {
    return responderJson_({ ok: false, error: mensaje_(error) });
  }
}

// GET sin parámetros: estado del servicio (sirve para comprobar que está publicado).
function estado_() {
  return {
    ok: true,
    servicio: SERVICIO,
    configurado: Boolean(cuentaDeServicio_(true)),
    vistas: funcionesCon_('vista_'),
    acciones: funcionesCon_('accion_'),
    horaServidor: fechaHoraServidor_()
  };
}

function funcionGlobal_(nombre) {
  const f = globalThis[nombre];
  return typeof f === 'function' ? f : null;
}

function funcionesCon_(prefijo) {
  return Object.getOwnPropertyNames(globalThis)
    .filter((k) => k.indexOf(prefijo) === 0 && typeof globalThis[k] === 'function')
    .map((k) => k.slice(prefijo.length))
    .sort();
}

/* ======================= RESPUESTAS Y VISTAS ======================= */

function responderJson_(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Genera una vista en el SERVIDOR: toma la plantilla (archivo .html con <?= ?>),
 * le pasa los datos y devuelve el HTML ya armado. El navegador recibe los datos
 * incrustados en el HTML (a diferencia de index.html, que los pide con JavaScript).
 */
function renderVista_(archivo, datos, titulo) {
  const plantilla = HtmlService.createTemplateFromFile(archivo);
  plantilla.datos = Object.assign({}, datos, { generadoEn: fechaHoraServidor_() });
  return plantilla.evaluate()
    .setTitle(titulo || 'AlertaVecinal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Para usar dentro de una plantilla: <?!= incluir_('otro_archivo') ?>
function incluir_(archivo) {
  return HtmlService.createHtmlOutputFromFile(archivo).getContent();
}

// Estilos con los colores de la app. En una plantilla: <?!= estilosComunes_() ?>
function estilosComunes_() {
  return `<style>
  :root{--azul:#1d3557;--azul-claro:#457b9d;--rojo:#e63946;--fondo:#f1f4f8;--tarjeta:#fff;--texto:#1f2933;
        --texto-suave:#5f6b7a;--borde:#d9e0e8;--verde:#2a9d8f;--robo:#d62828;--medica:#1d70b8;--gas:#f08c00;--otro:#6c757d}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,"Segoe UI",Roboto,sans-serif;background:var(--fondo);color:var(--texto)}
  header{background:var(--azul);color:#fff;padding:14px 18px;display:flex;align-items:center;gap:10px}
  header .logo{background:var(--rojo);border-radius:8px;padding:4px 8px;font-weight:800}
  main{max-width:960px;margin:0 auto;padding:18px}
  .tarjeta{background:var(--tarjeta);border:1px solid var(--borde);border-radius:12px;padding:16px;margin-bottom:14px}
  h1,h2{margin:0 0 10px}
  table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px;border-bottom:1px solid var(--borde)}
  th{color:var(--texto-suave);font-size:.85rem;text-transform:uppercase}
  .robo{color:var(--robo)}.medica{color:var(--medica)}.gas{color:var(--gas)}.otro{color:var(--otro)}
  footer.ssr{color:var(--texto-suave);font-size:.85rem;text-align:center;padding:16px}
  </style>`;
}

function paginaError_(texto) {
  const html = `<!doctype html><meta charset="utf-8">${estilosComunes_()}
    <header><span class="logo">AV</span><b>AlertaVecinal</b></header>
    <main><div class="tarjeta"><h2>No disponible</h2><p>${escaparHtml_(texto)}</p>
    <p><a href="https://jazyelae.github.io/alertavecinal/">Volver a la aplicación</a></p></div></main>`;
  return HtmlService.createHtmlOutput(html).setTitle('AlertaVecinal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ======================= SESIÓN ======================= */

// Lee el uid del token de sesión de Firebase. La FIRMA la valida Firestore en verificarSesion_().
function uidDelToken_(idToken) {
  const partes = String(idToken || '').split('.');
  if (partes.length !== 3) throw new Error('Token mal formado');
  const conRelleno = partes[1] + '==='.slice((partes[1].length + 3) % 4);
  let datos;
  try {
    datos = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(conRelleno)).getDataAsString());
  } catch (error) {
    throw new Error('Token mal formado');
  }
  if (!/^[A-Za-z0-9]{1,128}$/.test(datos.user_id || '')) throw new Error('Token sin usuario');
  return datos.user_id;
}

/**
 * Comprueba que quien llama tiene sesión real y está aprobado.
 * El perfil se lee CON EL PROPIO TOKEN: si el token es falso o caducó, Firestore lo rechaza.
 * opciones.rol = 'admin' exige además que sea administrador.
 */
function verificarSesion_(idToken, opciones) {
  const uid = uidDelToken_(idToken);
  const perfil = leerDoc_(`usuarios/${uid}`, idToken);
  if (!perfil) throw new Error('Sesión inválida o sin perfil');
  if (perfil.estado !== 'aprobado') throw new Error('Usuario no aprobado');
  if (opciones && opciones.rol && perfil.rol !== opciones.rol) throw new Error('No tienes permiso para esta acción');
  return { uid, perfil };
}

/* ======================= CUENTA DE SERVICIO ======================= */

function cuentaDeServicio_(silencioso) {
  const texto = PropertiesService.getScriptProperties().getProperty('SERVICE_ACCOUNT');
  if (!texto) {
    if (silencioso) return null;
    throw new Error('Falta la propiedad del script SERVICE_ACCOUNT');
  }
  return JSON.parse(texto);
}

function proyecto_() {
  return cuentaDeServicio_().project_id;
}

// Token OAuth de la cuenta de servicio (JWT firmado con RS256). Se guarda 50 minutos en caché.
function tokenDeAcceso_() {
  const cache = CacheService.getScriptCache();
  const guardado = cache.get('token-acceso');
  if (guardado) return guardado;
  const cuenta = cuentaDeServicio_();
  const ahora = Math.floor(Date.now() / 1000);
  const b64 = (obj) => Utilities.base64EncodeWebSafe(JSON.stringify(obj)).replace(/=+$/, '');
  const sinFirma = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({
    iss: cuenta.client_email, scope: SCOPES, aud: 'https://oauth2.googleapis.com/token', iat: ahora, exp: ahora + 3600
  });
  const firma = Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(sinFirma, cuenta.private_key)).replace(/=+$/, '');
  const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post', muteHttpExceptions: true,
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${sinFirma}.${firma}` }
  });
  if (r.getResponseCode() !== 200) throw new Error('No se pudo autenticar la cuenta de servicio');
  const token = JSON.parse(r.getContentText()).access_token;
  cache.put('token-acceso', token, 50 * 60);
  return token;
}

/* ======================= FIRESTORE (API REST) ======================= */

function urlFirestore_(ruta) {
  return `https://firestore.googleapis.com/v1/projects/${proyecto_()}/databases/(default)/documents${ruta ? '/' + ruta : ''}`;
}

function peticion_(url, opciones) {
  return UrlFetchApp.fetch(url, Object.assign({ muteHttpExceptions: true, contentType: 'application/json' }, opciones));
}

// Valor de Firestore → valor de JavaScript.
function aValor_(v) {
  if (!v || 'nullValue' in v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;               // texto ISO
  if ('geoPointValue' in v) return { latitude: v.geoPointValue.latitude || 0, longitude: v.geoPointValue.longitude || 0 };
  if ('referenceValue' in v) return v.referenceValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(aValor_);
  if ('mapValue' in v) return aObjeto_(v.mapValue.fields);
  return null;
}

function aObjeto_(campos) {
  const obj = {};
  Object.keys(campos || {}).forEach((k) => { obj[k] = aValor_(campos[k]); });
  return obj;
}

// Valor de JavaScript → valor de Firestore. Las fechas se mandan como objetos Date.
function aFirestore_(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (Object.prototype.toString.call(v) === '[object Date]') return { timestampValue: v.toISOString() };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(aFirestore_) } };
  if (typeof v.latitude === 'number' && typeof v.longitude === 'number' && Object.keys(v).length === 2) {
    return { geoPointValue: { latitude: v.latitude, longitude: v.longitude } };
  }
  return { mapValue: { fields: aCampos_(v) } };
}

function aCampos_(obj) {
  const campos = {};
  Object.keys(obj || {}).forEach((k) => { campos[k] = aFirestore_(obj[k]); });
  return campos;
}

function documento_(json) {
  return Object.assign({ id: json.name.split('/').pop() }, aObjeto_(json.fields));
}

/** Lee un documento. bearer: token de sesión del usuario (respeta las reglas) o, si se omite, la cuenta de servicio. */
function leerDoc_(ruta, bearer) {
  const r = peticion_(urlFirestore_(ruta), { headers: { Authorization: 'Bearer ' + (bearer || tokenDeAcceso_()) } });
  if (r.getResponseCode() !== 200) return null;
  return documento_(JSON.parse(r.getContentText()));
}

/**
 * Consulta una colección con la cuenta de servicio.
 * opciones: { desde: {campo, fecha: Date}, orden: {campo, desc}, limite }
 */
function consultar_(coleccion, opciones) {
  const o = opciones || {};
  const consulta = { from: [{ collectionId: coleccion }] };
  if (o.desde) {
    consulta.where = { fieldFilter: { field: { fieldPath: o.desde.campo }, op: 'GREATER_THAN_OR_EQUAL',
      value: { timestampValue: o.desde.fecha.toISOString() } } };
  }
  if (o.orden) consulta.orderBy = [{ field: { fieldPath: o.orden.campo }, direction: o.orden.desc ? 'DESCENDING' : 'ASCENDING' }];
  if (o.limite) consulta.limit = o.limite;
  const r = peticion_(urlFirestore_('') + ':runQuery', {
    method: 'post', headers: { Authorization: 'Bearer ' + tokenDeAcceso_() }, payload: JSON.stringify({ structuredQuery: consulta })
  });
  if (r.getResponseCode() !== 200) throw new Error('No se pudo consultar ' + coleccion);
  return JSON.parse(r.getContentText()).filter((x) => x.document).map((x) => documento_(x.document));
}

/** Crea (o reemplaza) un documento. Con {soloSiNoExiste:true} devuelve false si ya existía. */
function crearDoc_(ruta, datos, opciones) {
  const condicion = opciones && opciones.soloSiNoExiste ? '?currentDocument.exists=false' : '';
  const r = peticion_(urlFirestore_(ruta) + condicion, {
    method: 'patch', headers: { Authorization: 'Bearer ' + tokenDeAcceso_() }, payload: JSON.stringify({ fields: aCampos_(datos) })
  });
  if (r.getResponseCode() === 200) return true;
  if (condicion && (r.getResponseCode() === 409 || r.getResponseCode() === 400)) return false;   // ya existía
  throw new Error('No se pudo guardar ' + ruta);
}

/** Cambia solo los campos indicados de un documento que ya existe. */
function actualizarDoc_(ruta, cambios) {
  const mascara = Object.keys(cambios).map((k) => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&');
  const r = peticion_(`${urlFirestore_(ruta)}?${mascara}&currentDocument.exists=true`, {
    method: 'patch', headers: { Authorization: 'Bearer ' + tokenDeAcceso_() }, payload: JSON.stringify({ fields: aCampos_(cambios) })
  });
  if (r.getResponseCode() !== 200) throw new Error('No se pudo actualizar ' + ruta);
  return true;
}

function borrarDoc_(ruta) {
  const r = peticion_(urlFirestore_(ruta), { method: 'delete', headers: { Authorization: 'Bearer ' + tokenDeAcceso_() } });
  return r.getResponseCode() === 200;
}

/* ======================= UTILIDADES ======================= */

function fechaHoraServidor_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Mexico_City', "dd/MM/yyyy HH:mm:ss 'hora del centro'");
}

// Para vistas públicas: ubicación aproximada (2 decimales ≈ 1 km) en lugar de la exacta.
function redondearCoord_(numero, decimales) {
  const factor = Math.pow(10, decimales === undefined ? 2 : decimales);
  return Math.round(Number(numero) * factor) / factor;
}

function escaparHtml_(texto) {
  return String(texto == null ? '' : texto).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function mensaje_(error) {
  return String((error && error.message) || error);
}

/* Prueba manual desde el editor de Apps Script: Ejecutar → probarConfiguracion */
function probarConfiguracion() {
  const usuarios = consultar_('usuarios', { limite: 1 });
  Logger.log(`Proyecto ${proyecto_()}: Firestore responde (${usuarios.length} usuario leído). Vistas: ${funcionesCon_('vista_')}. ` +
             `Acciones: ${funcionesCon_('accion_')}.`);
}
