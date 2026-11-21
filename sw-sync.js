/*
 * sw-sync.js - Parte del service worker para la aportación "Alerta sin señal".
 * sw.js lo carga con importScripts('sw-sync.js').
 *
 * Cuando vuelve la conexión, el navegador dispara el evento "sync" con la
 * etiqueta "enviar-alertas" (aunque la app esté cerrada). Aquí leemos las
 * alertas guardadas en IndexedDB y las mandamos al backend (URL_BACKEND,
 * apps-script/SinSenal.gs) o, si no hay backend, a Firestore por su API REST
 * con el token de sesión del vecino.
 */
importScripts('js/firebase-config.js');

const SYNC_NOMBRE_BD = 'alertavecinal-offline';
const SYNC_ALMACEN = 'pendientes';

function syncAbrirBD() {
  return new Promise((resolve, reject) => {
    const solicitud = indexedDB.open(SYNC_NOMBRE_BD, 1);
    solicitud.onupgradeneeded = () => solicitud.result.createObjectStore(SYNC_ALMACEN, { keyPath: 'id' });
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
  });
}

async function syncOperar(modo, accion) {
  const bd = await syncAbrirBD();
  return new Promise((resolve, reject) => {
    const tx = bd.transaction(SYNC_ALMACEN, modo);
    const peticion = accion(tx.objectStore(SYNC_ALMACEN));
    tx.oncomplete = () => resolve(peticion?.result);
    tx.onerror = () => reject(tx.error);
  });
}

// Convierte un objeto JS al formato de campos de la API REST de Firestore.
function aCamposFirestore(datos, fecha) {
  const campos = {};
  for (const [clave, valor] of Object.entries(datos)) {
    if (typeof valor === 'number') campos[clave] = { doubleValue: valor };
    else if (valor != null) campos[clave] = { stringValue: String(valor) };
  }
  campos.creado = { timestampValue: new Date(fecha).toISOString() };
  campos.origen = { stringValue: 'sin-senal' };
  return campos;
}

// Con URL_BACKEND: manda todas las alertas al backend (apps-script/SinSenal.gs), que valida
// la sesión, evita duplicados y pone la hora del servidor. Devuelve cuántas se aceptaron,
// o null si no hay backend o no respondió bien (entonces se usa el envío directo de abajo).
async function enviarPorBackendDesdeSW(pendientes) {
  const conToken = pendientes.filter((p) => p.idToken);
  if (!self.URL_BACKEND || !conToken.length) return null;
  const idToken = conToken.reduce((a, b) => (b.guardada > a.guardada ? b : a)).idToken;   // el más reciente
  // Si no hay red, fetch lanza un error y el navegador reintentará el sync más tarde.
  const respuesta = await fetch(self.URL_BACKEND, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      accion: 'alerta_sin_senal', idToken,
      alertas: conToken.map((p) => ({ idCola: p.id, datos: p.datos, guardada: p.guardada }))
    })
  });
  const r = await respuesta.json();
  if (!r.ok) return null;   // por ejemplo, token vencido: lo intentará la página con uno nuevo
  for (const id of [...r.aceptadas, ...r.repetidas, ...r.rechazadas.map((x) => x.id).filter(Boolean)]) {
    await syncOperar('readwrite', (s) => s.delete(id));
  }
  // Si este backend todavía no hace el push, lo pedimos al intermediario de siempre.
  if (!r.pushEnviado && self.PUSH_ENDPOINT) {
    for (const id of r.aceptadas) {
      await fetch(self.PUSH_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ idToken, tipo: 'alerta', id })
      }).catch(() => null);
    }
  }
  return r.aceptadas.length;
}

async function enviarPendientesDesdeSW() {
  let enviadas = 0;
  let sinRed = false;
  try {
    enviadas += (await enviarPorBackendDesdeSW(await syncOperar('readonly', (s) => s.getAll()))) || 0;
  } catch (error) {
    sinRed = true;
  }
  // Lo que quede en la cola (sin backend o si no respondió bien), directo a Firestore como antes.
  const pendientes = sinRed ? [] : await syncOperar('readonly', (s) => s.getAll());
  const proyecto = self.FIREBASE_CONFIG.projectId;

  for (const p of pendientes) {
    if (!p.idToken) continue; // sin token: la enviará la página al abrirse
    const url = `https://firestore.googleapis.com/v1/projects/${proyecto}/databases/(default)/documents/alertas?documentId=${p.id}`;
    try {
      const respuesta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.idToken}` },
        body: JSON.stringify({ fields: aCamposFirestore(p.datos, p.guardada) })
      });
      // 200 = creada; 409 = ya existía (la envió la página). En ambos casos sale de la cola.
      if (respuesta.ok || respuesta.status === 409) {
        await syncOperar('readwrite', (s) => s.delete(p.id));
        enviadas++;
        // Push real a los demás vecinos, si hay intermediario configurado.
        if (respuesta.ok && self.PUSH_ENDPOINT) {
          await fetch(self.PUSH_ENDPOINT, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ idToken: p.idToken, tipo: 'alerta', id: p.id })
          }).catch(() => null);
        }
      }
      // 401/403 = token vencido o sin permiso: la página la reintentará con un token nuevo.
    } catch (error) {
      sinRed = true;
    }
  }

  // Avisamos a las pestañas abiertas para que actualicen el contador.
  const ventanas = await self.clients.matchAll({ type: 'window' });
  ventanas.forEach((v) => v.postMessage({ tipo: 'av-sync', enviadas }));

  // Si seguimos sin red, lanzamos error para que el navegador reintente más tarde.
  if (sinRed) throw new Error('Sin red todavía');
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'enviar-alertas') {
    event.waitUntil(enviarPendientesDesdeSW());
  }
});
