// Prueba local del push desde el backend (Push.gs) con un Firestore en memoria y FCM simulado.
// Ejecutar desde la raíz del repo:  node apps-script/pruebas/prueba_push.mjs
import assert from 'node:assert/strict';
import { crearEntorno, firestoreFalso, tokenDe, CUENTA_FALSA } from './simulador.mjs';

const fs = firestoreFalso();
const FCM = 'https://fcm.googleapis.com/v1/projects/demo/messages:send';
const enviados = [];   // mensajes que "recibió" FCM
// FCM simulado: el token "token-viejo" ya no existe; los demás se aceptan.
const red = {
  ...fs,
  fetch(url, opciones = {}) {
    if (url !== FCM) return fs.fetch(url, opciones);
    const mensaje = JSON.parse(opciones.payload).message;
    enviados.push({ mensaje, auth: opciones.headers.Authorization });
    const malo = mensaje.token === 'token-viejo';
    return { getResponseCode: () => (malo ? 404 : 200),
      getContentText: () => (malo ? '{"error":{"status":"NOT_FOUND","details":[{"errorCode":"UNREGISTERED"}]}}' : '{}') };
  }
};

const s = (v) => ({ stringValue: v });
const hace = (min) => ({ timestampValue: new Date(Date.now() - min * 60 * 1000).toISOString() });
fs.poner('usuarios/ana', { nombre: s('Ana Torres'), estado: s('aprobado'), rol: s('vecino') });
fs.poner('usuarios/admin1', { nombre: s('Admin'), estado: s('aprobado'), rol: s('admin') });
fs.poner('usuarios/pend', { nombre: s('Pendiente'), estado: s('pendiente'), rol: s('vecino') });
fs.poner('alertas/a1', { tipo: s('medica'), descripcion: s('Vecino desmayado'), direccion: s('Av. Reforma 20, Centro, Puebla'), uid: s('ana'), creado: hace(2) });
fs.poner('alertas/a2', { tipo: s('robo'), descripcion: s('Robo de bici'), uid: s('ana'), creado: hace(2) });
fs.poner('alertas/vieja', { tipo: s('robo'), descripcion: s('Ayer'), uid: s('ana'), creado: hace(60) });
fs.poner('alertas/ajena', { tipo: s('gas'), descripcion: s('Olor a gas'), uid: s('admin1'), creado: hace(1) });
fs.poner('avisos/v1', { titulo: s('Junta vecinal'), mensaje: s('Sábado 10 am'), uid: s('admin1'), creado: hace(1) });
fs.poner('tokens/tok-ana', { token: s('tok-ana'), uid: s('ana') });
fs.poner('tokens/tok-beto', { token: s('tok-beto'), uid: s('beto') });
fs.poner('tokens/tok-admin', { token: s('tok-admin'), uid: s('admin1') });
fs.poner('tokens/token-viejo', { token: s('token-viejo'), uid: s('carlos') });

const tokenAna = tokenDe('ana', fs);
const tokenAdmin = tokenDe('admin1', fs);
const tokenPend = tokenDe('pend', fs);

const av = crearEntorno(['Comun.gs', 'Push.gs', 'SinSenal.gs'], { propiedades: { SERVICE_ACCOUNT: CUENTA_FALSA }, firestore: red });
const post = (cuerpo) => JSON.parse(av.doPost({ postData: { contents: JSON.stringify(cuerpo) } }).contenido);
const destinos = () => enviados.map((e) => e.mensaje.token).sort();

const resultados = [];
function prueba(nombre, fn) {
  enviados.length = 0;
  try { fn(); resultados.push(true); console.log('✅', nombre); }
  catch (e) { resultados.push(false); console.log('❌', nombre, '\n   ', e.message); }
}

prueba('El backend lista la acción «push»', () => {
  assert.ok(JSON.parse(av.doGet({ parameter: {} }).contenido).acciones.includes('push'));
});

prueba('Rechaza peticiones incompletas, ids inválidos y sesiones falsas o no aprobadas', () => {
  assert.match(post({ accion: 'push', tipo: 'alerta', id: 'a1' }).error, /incompleta/);
  assert.match(post({ accion: 'push', idToken: tokenAna, tipo: 'otra', id: 'a1' }).error, /incompleta/);
  assert.match(post({ accion: 'push', idToken: tokenAna, tipo: 'alerta', id: '../usuarios/ana' }).error, /Id inválido/);
  assert.match(post({ accion: 'push', idToken: 'a.b.c', tipo: 'alerta', id: 'a1' }).error, /mal formado|Sesión/);
  const falso = tokenAna.replace('firma-ana', 'firma-inventada');
  assert.match(post({ accion: 'push', idToken: falso, tipo: 'alerta', id: 'a1' }).error, /Sesión inválida/);
  assert.match(post({ accion: 'push', idToken: tokenPend, tipo: 'alerta', id: 'a1' }).error, /no aprobado/);
  assert.equal(enviados.length, 0);
});

prueba('Rechaza documentos inexistentes, ajenos o de más de 15 minutos, y avisos de quien no es admin', () => {
  assert.match(post({ accion: 'push', idToken: tokenAna, tipo: 'alerta', id: 'noexiste' }).error, /No existe/);
  assert.match(post({ accion: 'push', idToken: tokenAna, tipo: 'alerta', id: 'ajena' }).error, /no es del usuario/);
  assert.match(post({ accion: 'push', idToken: tokenAna, tipo: 'alerta', id: 'vieja' }).error, /antiguo/);
  assert.match(post({ accion: 'push', idToken: tokenAna, tipo: 'aviso', id: 'v1' }).error, /permiso/);
  assert.equal(enviados.length, 0);
  assert.equal(fs.docs.has('envios/alerta-vieja'), false);
});

let r;
prueba('Alerta válida (POST sin «accion», como el intermediario viejo) → push a todos menos al autor', () => {
  r = post({ idToken: tokenAna, tipo: 'alerta', id: 'a1' });
  assert.deepEqual({ ...r }, { ok: true, enviadas: 2, fallidas: 1, tokensBorrados: 1 });
  assert.deepEqual(destinos(), ['tok-admin', 'tok-beto', 'token-viejo']);
  assert.ok(enviados.every((e) => e.auth === 'Bearer token-servicio'));
});

prueba('El mensaje es solo de datos, con título, cuerpo, url, tag, tipo y Urgency alta', () => {
  post({ idToken: tokenAna, tipo: 'alerta', id: 'a2' });
  const m = enviados[0].mensaje;
  assert.equal(m.notification, undefined);
  assert.deepEqual({ ...m.data }, { titulo: 'Robo · AlertaVecinal', cuerpo: 'Robo de bici', url: './?alerta=a2',
    tag: 'alerta-a2', alertaId: 'a2', tipo: 'robo' });
  assert.equal(m.webpush.headers.Urgency, 'high');
  assert.ok(Object.values(m.data).every((v) => typeof v === 'string'), 'FCM solo acepta textos en data');
});

prueba('La emergencia médica lleva tipo «medica» (sw-push.js la hace vibrar más largo)', () => {
  // a1 ya se envió: usamos una alerta nueva del mismo tipo.
  fs.poner('alertas/a3', { tipo: s('medica'), descripcion: s('Caída'), direccion: s('Calle 3 Norte 5'), uid: s('ana'), creado: hace(1) });
  post({ accion: 'push', idToken: tokenAna, tipo: 'alerta', id: 'a3' });
  assert.equal(enviados[0].mensaje.data.tipo, 'medica');
  assert.equal(enviados[0].mensaje.data.cuerpo, 'Caída · Calle 3 Norte 5');
});

prueba('Borra de Firestore el token que FCM ya no reconoce', () => {
  assert.equal(fs.docs.has('tokens/token-viejo'), false);
  assert.ok(fs.docs.has('tokens/tok-beto'));
});

prueba('La segunda llamada con el mismo id responde «repetido» y no envía nada', () => {
  assert.deepEqual({ ...post({ accion: 'push', idToken: tokenAna, tipo: 'alerta', id: 'a1' }) }, { ok: true, repetido: true, enviadas: 0 });
  assert.equal(enviados.length, 0);
});

prueba('Aviso del admin → push a todos menos al admin', () => {
  const rv = post({ accion: 'push', idToken: tokenAdmin, tipo: 'aviso', id: 'v1' });
  assert.equal(rv.ok, true);
  assert.deepEqual(destinos(), ['tok-ana', 'tok-beto']);
  assert.equal(enviados[0].mensaje.data.titulo, 'Aviso: Junta vecinal');
  assert.equal(enviados[0].mensaje.data.cuerpo, 'Sábado 10 am');
});

prueba('Alerta sin señal + Push.gs: la alerta aceptada dispara el push (SinSenal.gs de Jaziel)', () => {
  const rs = post({ accion: 'alerta_sin_senal', idToken: tokenAna, alertas: [{ idCola: 'sin-senal-xyz789abc', guardada: Date.now(),
    datos: { tipo: 'gas', descripcion: 'Huele a gas en el pasillo' } }] });
  assert.equal(rs.pushEnviado, true);
  assert.deepEqual([...rs.aceptadas], ['sin-senal-xyz789abc']);
  assert.deepEqual(destinos(), ['tok-admin', 'tok-beto']);
  assert.equal(enviados[0].mensaje.data.tipo, 'gas');
  assert.ok(fs.docs.has('envios/alerta-sin-senal-xyz789abc'));
});

console.log(`\n${resultados.filter(Boolean).length}/${resultados.length} pruebas correctas`);
process.exit(resultados.every(Boolean) ? 0 : 1);
