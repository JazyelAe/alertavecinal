// Prueba local del backend «Alerta sin señal» (SinSenal.gs) con un Firestore en memoria.
// Ejecutar desde la raíz del repo:  node apps-script/pruebas/prueba_sin_senal.mjs
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { crearEntorno, firestoreFalso, tokenDe, CUENTA_FALSA } from './simulador.mjs';

const fs = firestoreFalso();
fs.poner('usuarios/vecino1', { nombre: { stringValue: 'Ana Torres' }, estado: { stringValue: 'aprobado' }, rol: { stringValue: 'vecino' } });
fs.poner('usuarios/pendiente1', { nombre: { stringValue: 'Sin Aprobar' }, estado: { stringValue: 'pendiente' } });
const tokenAna = tokenDe('vecino1', fs);
const tokenPendiente = tokenDe('pendiente1', fs);

const av = crearEntorno(['Comun.gs', 'SinSenal.gs'], { propiedades: { SERVICE_ACCOUNT: CUENTA_FALSA }, firestore: fs });
const post = (cuerpo) => JSON.parse(av.doPost({ postData: { contents: JSON.stringify(cuerpo) } }).contenido);
const alerta = (id, extra = {}) => ({
  idCola: id, guardada: Date.now() - 10 * 60 * 1000,
  datos: { tipo: 'robo', descripcion: 'Forzaron una puerta', lat: 19.0433, lng: -98.1988, direccion: 'Calle 3 Norte 126, Centro, Puebla',
           uid: 'OTRO-USUARIO', nombre: 'Nombre falso', ...extra }
});
const leer = (id) => av.aObjeto_(fs.docs.get(`alertas/${id}`));

const resultados = [];
function prueba(nombre, fn) {
  try { fn(); resultados.push(true); console.log('✅', nombre); }
  catch (e) { resultados.push(false); console.log('❌', nombre, '\n   ', e.message); }
}

prueba('El backend lista la acción «alerta_sin_senal»', () => {
  assert.ok(JSON.parse(av.doGet({ parameter: {} }).contenido).acciones.includes('alerta_sin_senal'));
});

prueba('Sin sesión, con token falso o con vecino no aprobado → rechazado', () => {
  assert.equal(post({ accion: 'alerta_sin_senal', alertas: [alerta('sin-senal-aaaaaa1')] }).ok, false);
  assert.match(post({ accion: 'alerta_sin_senal', idToken: 'x.y.z', alertas: [] }).error, /mal formado|Sesión/);
  const falso = tokenAna.replace('firma-vecino1', 'firma-inventada');   // mismo uid, firma que Firestore no acepta
  assert.match(post({ accion: 'alerta_sin_senal', idToken: falso, alertas: [] }).error, /Sesión inválida/);
  assert.match(post({ accion: 'alerta_sin_senal', idToken: tokenPendiente, alertas: [] }).error, /no aprobado/);
  assert.equal(fs.docs.has('alertas/sin-senal-aaaaaa1'), false);
});

let r;
prueba('Alerta válida → aceptada y guardada con el id de la cola', () => {
  r = post({ accion: 'alerta_sin_senal', idToken: tokenAna, alertas: [alerta('sin-senal-abc123def')] });
  assert.equal(r.ok, true);
  assert.deepEqual([...r.aceptadas], ['sin-senal-abc123def']);
  assert.ok(fs.docs.has('alertas/sin-senal-abc123def'));
});

prueba('El servidor pone la hora, el uid y el nombre de la SESIÓN (no los del teléfono)', () => {
  const doc = leer('sin-senal-abc123def');
  assert.equal(doc.uid, 'vecino1');
  assert.equal(doc.nombre, 'Ana Torres');
  assert.equal(doc.origen, 'sin-senal');
  assert.equal(doc.enviadaSinSenal, true);
  const creado = new Date(doc.creado).getTime(), guardada = new Date(doc.guardadaEn).getTime();
  assert.ok(Math.abs(Date.now() - creado) < 5000, 'creado = ahora (hora del servidor)');
  assert.ok(creado - guardada > 9 * 60 * 1000, 'guardadaEn = cuando se guardó en el teléfono (hace 10 min)');
  assert.equal(doc.lat, 19.0433);
});

prueba('Duplicado (la página y el service worker la mandan otra vez) → «repetidas», no se guarda dos veces', () => {
  const antes = JSON.stringify(fs.docs.get('alertas/sin-senal-abc123def'));
  const otra = post({ accion: 'alerta_sin_senal', idToken: tokenAna, alertas: [alerta('sin-senal-abc123def', { descripcion: 'cambiada' })] });
  assert.deepEqual([...otra.repetidas], ['sin-senal-abc123def']);
  assert.equal(otra.aceptadas.length, 0);
  assert.equal(JSON.stringify(fs.docs.get('alertas/sin-senal-abc123def')), antes);
});

prueba('Datos inválidos → «rechazadas» con el motivo; las válidas del mismo envío sí entran', () => {
  const mixto = post({ accion: 'alerta_sin_senal', idToken: tokenAna, alertas: [
    alerta('sin-senal-tipo00x', { tipo: 'incendio' }),
    alerta('sin-senal-vacia00', { descripcion: '   ' }),
    alerta('sin-senal-larga00', { descripcion: 'x'.repeat(501) }),
    alerta('sin-senal-coord00', { lat: 200 }),
    alerta('../alertas/hack'),
    alerta('sin-senal-buena01')
  ] });
  assert.deepEqual([...mixto.aceptadas], ['sin-senal-buena01']);
  assert.deepEqual(mixto.rechazadas.map((x) => x.error), [
    'Tipo de alerta no válido', 'La descripción debe tener de 1 a 500 caracteres',
    'La descripción debe tener de 1 a 500 caracteres', 'Ubicación no válida', 'idCola no válido'
  ]);
  assert.equal([...fs.docs.keys()].filter((k) => k.startsWith('alertas/')).length, 2);
});

prueba('Sin Push.gs, responde pushEnviado: false (la app pide el push por su cuenta)', () => {
  assert.equal(r.pushEnviado, false);
});

prueba('Con accion_push (Push.gs de Luis), avisa a los vecinos de cada alerta nueva', () => {
  const llamadas = [];
  av.__registrar = (d) => llamadas.push(`${d.tipo}:${d.id}`);
  vm.runInContext('function accion_push(d) { __registrar(d); return { ok: true }; }', av);
  const conPush = post({ accion: 'alerta_sin_senal', idToken: tokenAna, alertas: [alerta('sin-senal-conpush1')] });
  assert.equal(conPush.pushEnviado, true);
  assert.deepEqual(llamadas, ['alerta:sin-senal-conpush1']);
});

console.log(`\n${resultados.filter(Boolean).length}/${resultados.length} pruebas correctas`);
process.exit(resultados.every(Boolean) ? 0 : 1);
