/*
 * offline-sync.js - Aportación "Alerta sin señal".
 * Si el vecino no tiene internet, la alerta se guarda en IndexedDB y se
 * envía sola al volver la conexión:
 *   1) Background Sync: el service worker (sw-sync.js) la envía aunque
 *      la app esté cerrada (Chrome, Edge, Android).
 *   2) Respaldo: en navegadores sin Background Sync (Firefox, Safari)
 *      la página la envía al dispararse el evento "online".
 * Con URL_BACKEND configurada, ambos caminos pasan primero por el backend
 * (apps-script/SinSenal.gs); si no responde, escriben directo a Firestore.
 */
import { getDoc, doc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db, esDemo, onSesion, aviso } from './auth.js';

const NOMBRE_BD = 'alertavecinal-offline';
const ALMACEN = 'pendientes';
const ETIQUETA_SYNC = 'enviar-alertas';

/* ---------- IndexedDB (pequeño ayudante con promesas) ---------- */
function abrirBD() {
  return new Promise((resolve, reject) => {
    const solicitud = indexedDB.open(NOMBRE_BD, 1);
    // Se ejecuta la primera vez: crea el "almacén" con la clave "id".
    solicitud.onupgradeneeded = () => solicitud.result.createObjectStore(ALMACEN, { keyPath: 'id' });
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
  });
}

async function operar(modo, accion) {
  const bd = await abrirBD();
  return new Promise((resolve, reject) => {
    const tx = bd.transaction(ALMACEN, modo);
    const peticion = accion(tx.objectStore(ALMACEN));
    tx.oncomplete = () => resolve(peticion?.result);
    tx.onerror = () => reject(tx.error);
  });
}
const guardar = (registro) => operar('readwrite', (s) => s.put(registro));
const borrar = (id) => operar('readwrite', (s) => s.delete(id));
export const pendientes = () => operar('readonly', (s) => s.getAll());

/* ---------- Guardar una alerta sin señal ---------- */
export async function encolar(datos) {
  // Id propio: si el SW y la página intentan enviarla, no se duplica.
  const id = 'sin-senal-' + crypto.randomUUID().replaceAll('-', '').slice(0, 16);
  // Token de sesión vigente (Firebase lo tiene en memoria aunque no haya red).
  // El SW lo usa para escribir en Firestore por su API REST.
  const idToken = !esDemo && auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
  await guardar({ id, datos, idToken, guardada: Date.now() });

  // Pedimos al navegador un Background Sync, si lo soporta.
  const registro = await (window.AV.swListo || Promise.resolve(null));
  if (!esDemo && registro && 'sync' in registro) {
    await registro.sync.register(ETIQUETA_SYNC);
  }
  aviso('Sin señal: tu alerta se guardó en el teléfono y se enviará sola al volver la conexión.', 'info', 6000);
  await pintarPendientes();
}

/* ---------- Envío por el backend (apps-script/SinSenal.gs) ---------- */
// Si hay URL_BACKEND, las alertas pasan por el servidor: valida la sesión, evita
// duplicados y les pone la hora del servidor. Devuelve cuántas salieron de la cola,
// o null si el backend no está disponible (entonces se usa el envío directo).
export async function enviarPorBackend(lista, idToken) {
  if (!self.URL_BACKEND || esDemo || !lista.length || !idToken) return null;
  try {
    const respuesta = await fetch(self.URL_BACKEND, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // sin verificación CORS previa
      body: JSON.stringify({
        accion: 'alerta_sin_senal', idToken,
        alertas: lista.map((p) => ({ idCola: p.id, datos: p.datos, guardada: p.guardada }))
      })
    });
    const r = await respuesta.json();
    if (!r.ok) throw new Error(r.error || 'El backend rechazó la petición');
    for (const id of [...r.aceptadas, ...r.repetidas]) await borrar(id);
    for (const { id, error } of r.rechazadas) {
      if (id) await borrar(id);   // datos inválidos: nunca se aceptarían
      aviso(`Una alerta guardada sin señal no se pudo enviar: ${error}`, 'error', 6000);
    }
    // Si este backend todavía no hace el push, lo pide la app como siempre.
    if (!r.pushEnviado) r.aceptadas.forEach((id) => window.AV.push?.enviarPushReal?.('alerta', id));
    return r.aceptadas.length;
  } catch (error) {
    console.warn('[Sin señal] El backend no respondió; se envía directo a Firestore:', error.message);
    return null;
  }
}

/* ---------- Respaldo: enviar desde la página ---------- */
let enviando = false;
async function enviarDesdePagina() {
  if (enviando || !navigator.onLine || !window.AV.alertasApi) return;
  enviando = true;
  let enviadas = 0;
  try {
    // 1) Primero por el backend, con un token de sesión recién obtenido.
    const lista = await pendientes();
    const token = !esDemo && auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
    enviadas += (await enviarPorBackend(lista, token)) || 0;
    // 2) Lo que quede (sin backend o si falló), directo a Firestore como antes.
    for (const p of await pendientes()) {
      try {
        await window.AV.alertasApi.publicarAlerta({ ...p.datos, origen: 'sin-senal' }, p.id);
        await borrar(p.id);
        enviadas++;
      } catch (error) {
        // Si ya existe, el service worker la envió primero: solo la quitamos de la cola.
        if (error.code === 'permission-denied' && (await getDoc(doc(db, 'alertas', p.id))).exists()) {
          await borrar(p.id);
        } else {
          console.warn('[Sin señal] No se pudo enviar todavía:', error);
        }
      }
    }
  } finally {
    enviando = false;
  }
  if (enviadas) aviso(`Se enviaron ${enviadas} alerta(s) guardadas sin señal.`, 'ok');
  await pintarPendientes();
}

/* ---------- Indicador en la tarjeta "Enviar alerta" ---------- */
async function pintarPendientes() {
  const tarjeta = document.getElementById('tarjeta-enviar');
  if (!tarjeta) return;
  let caja = document.getElementById('caja-pendientes');
  if (!caja) {
    caja = document.createElement('div');
    caja.id = 'caja-pendientes';
    caja.className = 'pendientes';
    tarjeta.querySelector('h2').after(caja);
  }
  const lista = await pendientes().catch(() => []);
  caja.hidden = !lista.length;
  caja.textContent = `${lista.length} alerta(s) esperando señal para enviarse. ` +
    (navigator.onLine ? 'Enviando…' : 'Se enviarán solas al volver la conexión.');
}

/* ---------- Arranque ---------- */
window.AV = window.AV || {};
window.AV.offline = { encolar, pendientes };

window.addEventListener('offline', pintarPendientes);
window.addEventListener('online', () => {
  pintarPendientes();
  // Damos unos segundos al Background Sync; lo que quede, lo envía la página.
  setTimeout(enviarDesdePagina, 'SyncManager' in window && !esDemo ? 4000 : 500);
});

// Mensajes del service worker cuando termina el Background Sync.
navigator.serviceWorker?.addEventListener('message', (e) => {
  if (e.data?.tipo === 'av-sync') {
    if (e.data.enviadas) aviso(`Se enviaron ${e.data.enviadas} alerta(s) guardadas sin señal.`, 'ok');
    pintarPendientes();
  }
});

onSesion(({ perfil }) => {
  if (perfil?.estado === 'aprobado') {
    pintarPendientes();
    enviarDesdePagina();
  }
});
