// Prueba local del reporte de mapa de calor (MapaCalor.gs + vista_mapacalor.html) con un Firestore en memoria.
// Ejecutar desde la raíz del repo:  node apps-script/pruebas/prueba_mapacalor.mjs [archivo_salida.html]
// Si se indica un archivo, guarda ahí el HTML que generaría el servidor (para verlo o capturarlo).
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { crearEntorno, firestoreFalso, CUENTA_FALSA } from './simulador.mjs';

const fs = firestoreFalso();
// Fecha a una hora fija del centro de México (UTC−6), hace «dias» días.
const aLas = (dias, horaMx) => {
  const d = new Date(Date.now() - dias * 864e5);
  d.setUTCHours(horaMx + 6, 15, 0, 0);
  return { timestampValue: d.toISOString() };
};
const alerta = (id, tipo, dias, horaMx, lat, lng, direccion, extra = {}) => fs.poner(`alertas/${id}`, {
  tipo: { stringValue: tipo }, descripcion: { stringValue: `Descripción privada ${id}` },
  nombre: { stringValue: 'María López' }, autor: { stringValue: 'María López' }, uid: { stringValue: 'u1' },
  creado: aLas(dias, horaMx),
  ...(lat != null ? { lat: { doubleValue: lat }, lng: { doubleValue: lng } } : {}),
  ...(direccion ? { direccion: { stringValue: direccion } } : {}),
  ...extra
});
// Centro: 4 alertas en la misma celda (19.0432x, -98.1987x), 3 de noche (20–24 h).
alerta('c1', 'robo', 1, 21, 19.04327, -98.19876, 'Calle Secreta 742, Centro, Puebla');
alerta('c2', 'robo', 3, 22, 19.04311, -98.19861, 'Calle Secreta 100, Centro, Puebla');
alerta('c3', 'gas', 5, 23, 19.04302, -98.19899, 'Av. Privada 9, Centro, Puebla');
alerta('c4', 'medica', 8, 9, 19.04340, -98.19850, 'Calle Secreta 5, Centro, Puebla');
// Otra colonia, otra celda.
alerta('l1', 'robo', 2, 21, 19.06120, -98.30510, 'Calle Uno 1, La Paz, Puebla');
alerta('l2', 'otro', 4, 13, 19.06130, -98.30520, 'Calle Dos 2, La Paz, Puebla');
// Sin coordenadas (cuenta por colonia y hora, no en el mapa).
alerta('s1', 'robo', 6, 21, null, null, 'Calle Tres 3, Centro, Puebla');
// Fuera de 30 días, pero dentro de 90.
alerta('v1', 'gas', 45, 2, 19.0500, -98.2100, 'Calle Vieja 4, Analco, Puebla');
// Intento de romper la página desde una dirección.
alerta('x1', 'otro', 1, 10, 19.0700, -98.2200, 'Calle 7, </script><script>alert(1)</script>, Puebla');

const av = crearEntorno(['Comun.gs', 'MapaCalor.gs'], { propiedades: { SERVICE_ACCOUNT: CUENTA_FALSA }, firestore: fs });
const vista = (parametros = {}) => av.doGet({ parameter: { vista: 'mapacalor', ...parametros } });
const salida = vista();
const html = salida.contenido;
const datos = (parametros = {}) => av.armarMapaCalor_(
  av.consultar_('alertas', { desde: { campo: 'creado', fecha: new Date(Date.now() - (parametros.dias || 30) * 864e5) } }),
  { dias: parametros.dias || 30, tipo: parametros.tipo || 'todos' });

const resultados = [];
function prueba(nombre, fn) {
  try { fn(); resultados.push(true); console.log('✅', nombre); }
  catch (e) { resultados.push(false); console.log('❌', nombre, '\n   ', e.message); }
}

prueba('El backend lista la vista «mapacalor»', () => {
  assert.ok(JSON.parse(av.doGet({ parameter: {} }).contenido).vistas.includes('mapacalor'));
});

prueba('Últimos 30 días: 8 alertas, 3 celdas, la del Centro primero con 4 (2 robo, 1 gas, 1 médica)', () => {
  const d = datos();
  assert.equal(d.total, 8);
  assert.equal(d.celdas.length, 3);
  assert.equal(d.conUbicacion, 7);
  const c = d.celdas[0];
  assert.deepEqual({ total: c.total, robo: c.robo, gas: c.gas, medica: c.medica, otro: c.otro, zona: c.zona },
    { total: 4, robo: 2, gas: 1, medica: 1, otro: 0, zona: 'Centro, Puebla' });
});

prueba('Zona más reportada: Centro, Puebla (5, incluye la alerta sin coordenadas)', () => {
  assert.deepEqual({ ...datos().zonaTop }, { nombre: 'Centro, Puebla', total: 5 });
});

prueba('Franja más frecuente: 20:00–24:00 (5) en hora del centro de México', () => {
  const d = datos();
  assert.deepEqual({ ...d.franjaTop }, { nombre: '20:00–24:00', total: 5 });
  assert.deepEqual([...d.porFranja].map((f) => f.total), [0, 0, 2, 1, 0, 5]);
});

prueba('Parámetros: dias=90 incluye la alerta vieja; tipo=gas filtra; valores raros usan 30 días y todos', () => {
  assert.match(vista({ dias: '90' }).contenido, /Últimos 90 días/);
  assert.equal(datos({ dias: 90 }).total, 9);
  assert.equal(datos({ tipo: 'gas' }).total, 1);
  const raro = vista({ dias: '9999', tipo: '<b>x</b>' }).contenido;
  assert.match(raro, /Últimos 30 días · Todos los tipos/);
  assert.doesNotMatch(raro, /<b>x<\/b>/);
});

prueba('El HTML trae los datos incrustados (SSR) y el pie «Generado en el servidor»', () => {
  assert.match(html, /<div class="cifra">8<\/div>alertas en el periodo/);
  assert.match(html, /var CELDAS = \[\{"lat":/);
  assert.match(html, /Generado en el servidor \(Google Apps Script\) el/);
  assert.equal(salida.titulo, 'Reporte de mapa de calor · AlertaVecinal');
});

prueba('Privacidad: sin nombres, descripciones, calles, números ni coordenadas exactas', () => {
  for (const prohibido of [/María/, /Descripción privada/, /Calle Secreta/, /742/, /Av\. Privada/, /Calle Uno/,
    /19\.04327/, /98\.19876/, /19\.0612\b/, /u1/]) {
    assert.doesNotMatch(html, prohibido, String(prohibido));
  }
});

prueba('Una dirección con </script> no puede inyectar código', () => {
  // El fin de línea puede ser \n o \r\n: en Windows, git convierte los archivos a CRLF al clonarlos.
  const dentroDelScript = html.match(/var CELDAS = (.*);\r?\n/)[1];
  assert.doesNotMatch(dentroDelScript, /<\/script>/i);
  // Escapado no es lo mismo que perdido: al leerlo, el navegador recupera la dirección original.
  assert.ok(JSON.parse(dentroDelScript).some((c) => c.zona === '</script><script>alert(1)</script>, Puebla'));
  assert.equal((html.match(/<script>alert\(1\)/g) || []).length, 0);
  assert.match(html, /&lt;\/script&gt;/);   // en la tabla aparece escapado
});

prueba('Sin alertas: la página se genera sin mapa y con «Sin datos»', () => {
  const vacio = crearEntorno(['Comun.gs', 'MapaCalor.gs'], { propiedades: { SERVICE_ACCOUNT: CUENTA_FALSA }, firestore: firestoreFalso() });
  const h = vacio.doGet({ parameter: { vista: 'mapacalor' } }).contenido;
  assert.match(h, /No hay alertas con ubicación/);
  assert.doesNotMatch(h, /var CELDAS/);
  assert.match(h, /Sin datos/);
});

if (process.argv[2]) writeFileSync(process.argv[2], html);
console.log(`\n${resultados.filter(Boolean).length}/${resultados.length} pruebas correctas`);
process.exit(resultados.every(Boolean) ? 0 : 1);
