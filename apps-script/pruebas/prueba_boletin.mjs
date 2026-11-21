// Prueba local del boletín público (Boletin.gs + vista_boletin.html) con un Firestore en memoria.
// Ejecutar desde la raíz del repo:  node apps-script/pruebas/prueba_boletin.mjs [archivo_salida.html]
// Si se indica un archivo, guarda ahí el HTML que generaría el servidor (para verlo o capturarlo).
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { crearEntorno, firestoreFalso, CUENTA_FALSA } from './simulador.mjs';

const fs = firestoreFalso();
const hace = (horas) => ({ timestampValue: new Date(Date.now() - horas * 3600 * 1000).toISOString() });
const alerta = (id, tipo, horas, extra = {}) => fs.poner(`alertas/${id}`, {
  tipo: { stringValue: tipo }, descripcion: { stringValue: `Descripción privada ${id}` },
  autor: { stringValue: 'María López' }, uid: { stringValue: 'u1' }, creado: hace(horas),
  direccion: { stringValue: `Calle Secreta ${id}, Centro, Puebla` }, lat: { doubleValue: 19.04327 }, lng: { doubleValue: -98.19876 },
  ...extra
});
alerta('a1', 'robo', 1);
alerta('a2', 'gas', 3, { origen: { stringValue: 'sin-senal' } });
alerta('a3', 'medica', 20);
alerta('a4', 'robo', 30);                         // fuera de 24 h, dentro de 7 días
alerta('a5', 'otro', 100);                        // dentro de 7 días
alerta('a6', 'robo', 200);                        // fuera de 7 días: no debe contar
fs.poner('alertas/a7', { tipo: { stringValue: 'gas' }, creado: hace(2), lat: { doubleValue: 19.0612 }, lng: { doubleValue: -98.3051 } });

const av = crearEntorno(['Comun.gs', 'Boletin.gs'], { propiedades: { SERVICE_ACCOUNT: CUENTA_FALSA }, firestore: fs });
const resultados = [];
function prueba(nombre, fn) {
  try { fn(); resultados.push(true); console.log('✅', nombre); }
  catch (e) { resultados.push(false); console.log('❌', nombre, '\n   ', e.message); }
}

const estado = JSON.parse(av.doGet({ parameter: {} }).contenido);
const pagina = av.doGet({ parameter: { vista: 'boletin' } });
const html = pagina.contenido;
if (process.argv[2]) writeFileSync(process.argv[2], html);

prueba('El estado del backend lista la vista «boletin»', () => assert.ok(estado.vistas.includes('boletin')));
prueba('La página tiene título y viewport', () => {
  assert.equal(pagina.titulo, 'Boletín de alertas · AlertaVecinal');
  assert.match(pagina.meta.viewport, /width=device-width/);
});

// Lo que sale del simulador (otro «realm») se compara como JSON.
const plano = (x) => JSON.parse(JSON.stringify(x));
const datos = plano(av.armarBoletin_(av.consultar_('alertas', {
  desde: { campo: 'creado', fecha: new Date(Date.now() - 7 * 24 * 3600 * 1000) }, orden: { campo: 'creado', desc: true }, limite: 300
}), new Date()));
prueba('Cuenta 7 días (6 alertas) y 24 h (4 alertas); la de hace 200 h no entra', () => {
  assert.equal(datos.total7d, 6);
  assert.equal(datos.total24h, 4);
  assert.deepEqual(datos.porTipo7d.map((t) => t.total), [2, 1, 2, 1]);   // robo, medica, gas, otro
  assert.deepEqual(datos.porTipo24h.map((t) => t.total), [1, 1, 2, 0]);
});
prueba('La lista va de la más reciente a la más antigua', () => {
  assert.deepEqual(datos.lista.map((a) => a.hace), ['hace 1 h', 'hace 2 h', 'hace 3 h', 'hace 20 h']);
});
prueba('Privacidad: sin nombres, descripciones, calles ni coordenadas exactas en el HTML', () => {
  assert.doesNotMatch(html, /María López/);
  assert.doesNotMatch(html, /Descripción privada/);
  assert.doesNotMatch(html, /Calle Secreta/);
  assert.doesNotMatch(html, /19\.0432|98\.1987|19\.0612/);
  assert.match(html, /Centro, Puebla/);
  assert.match(html, /Zona 19\.06, -98\.31/);   // sin dirección → coordenadas redondeadas
});
prueba('Marca las alertas enviadas sin señal', () => assert.match(html, /enviada sin señal/));
prueba('Los datos vienen DENTRO del HTML generado (renderizado en servidor)', () => {
  assert.match(html, /<div class="cifra">4<\/div>alertas en las últimas 24 h/);
  assert.match(html, /<div class="cifra">6<\/div>alertas en los últimos 7 días/);
  assert.doesNotMatch(html, /<\?/);   // no quedan etiquetas de plantilla sin evaluar
});
prueba('Pie «Generado en el servidor» con fecha y hora', () => {
  assert.match(html, /Generado en el servidor \(Google Apps Script\) el \d/);
});
prueba('El texto de los datos se escapa (no se puede inyectar HTML)', () => {
  fs.poner('alertas/x', { tipo: { stringValue: 'robo' }, creado: hace(0.5), direccion: { stringValue: 'Calle 1, <script>alert(1)</script>' } });
  const conInyeccion = av.doGet({ parameter: { vista: 'boletin' } }).contenido;
  assert.doesNotMatch(conInyeccion, /<script>alert/);
  assert.match(conInyeccion, /&lt;script&gt;/);
});

console.log(`\n${resultados.filter(Boolean).length}/${resultados.length} pruebas correctas`);
process.exit(resultados.every(Boolean) ? 0 : 1);
