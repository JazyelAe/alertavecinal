// Prueba local del núcleo (Comun.gs) SIN Google: carga el archivo .gs en Node y simula los servicios
// de Apps Script (ContentService, HtmlService, PropertiesService, Utilities...).
// Ejecutar desde la raíz del repo:  node apps-script/pruebas/prueba_comun.mjs
// No sube nada a Google (clasp ignora la carpeta pruebas/).
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const codigo = readFileSync(new URL('../Comun.gs', import.meta.url), 'utf8');

function crearEntorno(propiedades = {}) {
  const salida = (contenido) => {
    const o = { contenido, titulo: null, meta: {}, mime: null };
    o.setMimeType = (m) => { o.mime = m; return o; };
    o.setTitle = (t) => { o.titulo = t; return o; };
    o.addMetaTag = (k, v) => { o.meta[k] = v; return o; };
    o.setXFrameOptionsMode = () => o;
    o.getContent = () => contenido;
    return o;
  };
  const entorno = {
    console,
    ContentService: { createTextOutput: salida, MimeType: { JSON: 'application/json' } },
    HtmlService: { createHtmlOutput: salida, XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => propiedades[k] || null }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
    Session: { getScriptTimeZone: () => 'America/Mexico_City' },
    Utilities: {
      base64DecodeWebSafe: (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'),
      newBlob: (b) => ({ getDataAsString: () => Buffer.from(b).toString('utf8') }),
      formatDate: (d) => d.toISOString()
    }
  };
  vm.createContext(entorno);
  vm.runInContext(codigo, entorno);
  return entorno;
}

const json = (salida) => JSON.parse(salida.contenido);
// Los objetos creados dentro del simulador (otro «realm») se comparan como JSON.
const plano = (x) => JSON.parse(JSON.stringify(x));
const resultados = [];
function prueba(nombre, fn) {
  try { fn(); resultados.push(true); console.log('✅', nombre); }
  catch (e) { resultados.push(false); console.log('❌', nombre, '\n   ', e.message); }
}

// Entorno con una vista y dos acciones de ejemplo, como si fueran archivos de otros integrantes.
const av = crearEntorno();
vm.runInContext(`
  function vista_demo(e) { return HtmlService.createHtmlOutput('<p>demo ' + (e.parameter.x || '') + '</p>'); }
  function vista_rota() { throw new Error('falla a propósito'); }
  function accion_push(d) { return { ok: true, recibido: d.tipo + ':' + d.id }; }
  function accion_eco(d) { return { ok: true, eco: d.texto }; }
`, av);

prueba('CA-1 GET sin parámetros → JSON de estado con vistas y acciones', () => {
  const r = json(av.doGet({ parameter: {} }));
  assert.equal(r.ok, true);
  assert.equal(r.servicio, 'AlertaVecinal Backend');
  assert.deepEqual(r.vistas, ['demo', 'rota']);
  assert.deepEqual(r.acciones, ['eco', 'push']);
  assert.equal(r.configurado, false);  // sin SERVICE_ACCOUNT
});

prueba('CA-2 GET ?vista=demo llama a vista_demo', () => {
  assert.equal(av.doGet({ parameter: { vista: 'demo', x: '7' } }).contenido, '<p>demo 7</p>');
});

prueba('CA-2 vista inexistente → página 404 amigable', () => {
  const html = av.doGet({ parameter: { vista: 'no_existe' } }).contenido;
  assert.match(html, /La vista «no_existe» no existe/);
  assert.match(html, /Volver a la aplicación/);
});

prueba('CA-2 nombre con caracteres raros → se rechaza sin ejecutar nada', () => {
  assert.match(av.doGet({ parameter: { vista: '../constructor' } }).contenido, /no es válido/);
  assert.match(av.doGet({ parameter: { vista: '<script>' } }).contenido, /no es válido/);
});

prueba('Una vista que falla → página de error (no se cae el servidor)', () => {
  assert.match(av.doGet({ parameter: { vista: 'rota' } }).contenido, /falla a propósito/);
});

prueba('CA-3 POST sin "accion" → accion_push (compatibilidad con js/push.js)', () => {
  const r = json(av.doPost({ postData: { contents: JSON.stringify({ idToken: 'x', tipo: 'alerta', id: 'abc' }) } }));
  assert.deepEqual(r, { ok: true, recibido: 'alerta:abc' });
});

prueba('CA-3 POST con accion → accion_<nombre>', () => {
  const r = json(av.doPost({ postData: { contents: JSON.stringify({ accion: 'eco', texto: 'hola' }) } }));
  assert.deepEqual(r, { ok: true, eco: 'hola' });
});

prueba('CA-3 acción inexistente, nombre inválido o JSON roto → {ok:false}', () => {
  assert.equal(json(av.doPost({ postData: { contents: '{"accion":"nada"}' } })).ok, false);
  assert.equal(json(av.doPost({ postData: { contents: '{"accion":"__proto__"}' } })).ok, false);
  assert.equal(json(av.doPost({ postData: { contents: 'esto no es json' } })).ok, false);
});

prueba('CA-4 conversión objeto ⇄ campos de Firestore (todos los tipos)', () => {
  const fecha = new Date('2026-11-21T06:00:00.000Z');
  const original = {
    texto: 'Fuga de gas', entero: 3, decimal: 19.05, si: true, nada: null, creado: fecha,
    lista: ['a', 2, false], mapa: { calle: '3 Norte', numero: 126 }, ubicacion: { latitude: 19.04, longitude: -98.2 }
  };
  const campos = plano(av.aCampos_(original));
  assert.deepEqual(campos.entero, { integerValue: '3' });
  assert.deepEqual(campos.decimal, { doubleValue: 19.05 });
  assert.deepEqual(campos.creado, { timestampValue: '2026-11-21T06:00:00.000Z' });
  assert.ok(campos.ubicacion.geoPointValue);
  const vuelta = plano(av.aObjeto_(campos));   // como si viajara por la red
  assert.deepEqual(vuelta, { ...original, creado: fecha.toISOString() });
});

prueba('CA-5 uidDelToken_ lee el uid y rechaza tokens mal formados', () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  assert.equal(av.uidDelToken_(`${b64({ alg: 'RS256' })}.${b64({ user_id: 'Abc123' })}.firma`), 'Abc123');
  assert.throws(() => av.uidDelToken_('solo.dos'), /mal formado/);
  assert.throws(() => av.uidDelToken_('a.%%%.c'), /mal formado/);
  assert.throws(() => av.uidDelToken_(`x.${b64({ user_id: 'no válido!' })}.y`), /sin usuario/);
  assert.throws(() => av.uidDelToken_(undefined), /mal formado/);
});

prueba('redondearCoord_ y escaparHtml_ (para vistas públicas)', () => {
  assert.equal(av.redondearCoord_(19.04327, 2), 19.04);
  assert.equal(av.redondearCoord_(-98.19876), -98.2);
  assert.equal(av.escaparHtml_('<b>"x"</b>'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
});

prueba('Sin SERVICE_ACCOUNT, las operaciones de Firestore avisan con un error claro', () => {
  assert.throws(() => av.leerDoc_('usuarios/x'), /SERVICE_ACCOUNT/);
});

prueba('Con SERVICE_ACCOUNT, el estado dice configurado: true', () => {
  const conCuenta = crearEntorno({ SERVICE_ACCOUNT: JSON.stringify({ project_id: 'demo', client_email: 'a@b', private_key: 'x' }) });
  assert.equal(json(conCuenta.doGet({ parameter: {} })).configurado, true);
  assert.equal(conCuenta.proyecto_(), 'demo');
});

console.log(`\n${resultados.filter(Boolean).length}/${resultados.length} pruebas correctas`);
process.exit(resultados.every(Boolean) ? 0 : 1);
