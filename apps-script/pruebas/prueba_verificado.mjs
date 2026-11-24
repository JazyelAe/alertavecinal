// Prueba local de la ficha de Vecino Verificado (Verificado.gs + vista_verificado.html) con un Firestore en memoria.
// Ejecutar desde la raíz del repo:  node apps-script/pruebas/prueba_verificado.mjs [archivo_salida.html]
// Si se indica un archivo, guarda ahí el HTML de la ficha que generaría el servidor (para verlo o capturarlo).
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { crearEntorno, firestoreFalso, tokenDe, CUENTA_FALSA } from './simulador.mjs';

const fs = firestoreFalso();
const haceDias = (d) => ({ timestampValue: new Date(Date.now() - d * 24 * 3600 * 1000).toISOString() });
const perfil = (uid, campos) => fs.poner(`usuarios/${uid}`, {
  nombre: { stringValue: campos.nombre }, correo: { stringValue: `${uid}@correo-privado.mx` },
  telefono: { stringValue: '2221234567' }, calle: { stringValue: 'Calle Privada' }, numero: { stringValue: '742' },
  rol: { stringValue: campos.rol || 'vecino' }, estado: { stringValue: campos.estado || 'aprobado' },
  creado: haceDias(campos.dias ?? 100)
});
let n = 0;
const alerta = (uid, extra = {}) => fs.poner(`alertas/a${++n}`, {
  uid: { stringValue: uid }, tipo: { stringValue: 'robo' }, creado: haceDias(1 + n / 10),
  descripcion: { stringValue: 'Descripción privada con detalles del incidente' },
  direccion: { stringValue: 'Calle Secreta 12, Centro, Puebla' },
  lat: { doubleValue: 19.04327 }, lng: { doubleValue: -98.19876 }, ...extra
});

perfil('ana', { nombre: 'Ana María Torres', dias: 120 });
perfil('beto', { nombre: 'Beto', dias: 10 });
perfil('admin1', { nombre: 'Admin Comité', rol: 'admin' });
perfil('pend', { nombre: 'Pedro Pendiente', estado: 'pendiente' });
perfil('vecino2', { nombre: 'Vecino Dos' });
for (let i = 0; i < 8; i++) alerta('ana');                                         // 8 útiles
alerta('ana', { descripcion: { stringValue: 'corta' } });                          // no útil: descripción corta
alerta('ana', { lat: { nullValue: null }, lng: { nullValue: null } });             // no útil: sin ubicación
alerta('ana', { lat: { nullValue: null }, descripcion: { stringValue: 'x' },
  foto: { stringValue: 'data:image/jpeg;base64,AAAA' } });                         // útil: trae foto
alerta('beto');                                                                    // 1 útil, 10 días
alerta('otro');

const av = crearEntorno(['Comun.gs', 'Verificado.gs'], { propiedades: { SERVICE_ACCOUNT: CUENTA_FALSA }, firestore: fs });
const resultados = [];
function prueba(nombre, fn) {
  try { fn(); resultados.push(true); console.log('✅', nombre); }
  catch (e) { resultados.push(false); console.log('❌', nombre, '\n   ', e.message); }
}
const vista = (uid) => av.doGet({ parameter: uid === undefined ? { vista: 'verificado' } : { vista: 'verificado', uid } });
const post = (datos) => JSON.parse(av.doPost({ postData: { contents: JSON.stringify(datos) } }).contenido);
const leer = (uid) => av.leerDoc_(`usuarios/${uid}`);

const estado = JSON.parse(av.doGet({ parameter: {} }).contenido);
const paginaAna = vista('ana');
const html = paginaAna.contenido;
if (process.argv[2]) writeFileSync(process.argv[2], html);

prueba('El estado del backend lista la vista «verificado» y la acción «verificar»', () => {
  assert.ok(estado.vistas.includes('verificado'));
  assert.ok(estado.acciones.includes('verificar'));
});

prueba('La ficha tiene título, viewport y el pie «Generado en el servidor»', () => {
  assert.equal(paginaAna.titulo, 'Vecino Verificado · AlertaVecinal');
  assert.match(paginaAna.meta.viewport, /width=device-width/);
  assert.match(html, /Generado en el servidor \(Google Apps Script\) el/);
});

prueba('Ana: nombre corto, 11 alertas, 9 útiles (82 %), 120 días → insignia Guardián', () => {
  assert.match(html, /<h1>Ana M\.<\/h1>/);
  assert.match(html, /<div class="cifra">11<\/div>alertas enviadas/);
  assert.match(html, /<div class="cifra">9<\/div>alertas útiles/);
  assert.match(html, /<div class="cifra">82%<\/div>/);
  assert.match(html, /class="insignia guardian">Guardián</);
  assert.match(html, /Domicilio sin verificar/);
});

prueba('Beto: 1 útil y 10 días → Colaborador; nombre de una sola palabra queda igual', () => {
  const h = vista('beto').contenido;
  assert.match(h, /<h1>Beto<\/h1>/);
  assert.match(h, /class="insignia colaborador">Colaborador</);
});

prueba('Privacidad: sin correo, teléfono, calle, número, descripciones ni coordenadas en el HTML', () => {
  for (const prohibido of [/correo-privado/, /2221234567/, /Calle Privada/, /742/, /Calle Secreta/,
    /Descripción privada/, /19\.0432/, /98\.1987/, /Torres/]) {
    assert.doesNotMatch(html, prohibido);
  }
});

prueba('uid inexistente, pendiente, mal formado o ausente → misma página genérica', () => {
  for (const uid of ['noexiste', 'pend', '../usuarios/ana', '', undefined]) {
    const h = vista(uid).contenido;
    assert.match(h, /Ficha no disponible/, `uid ${uid}`);
    assert.doesNotMatch(h, /Pedro/);
  }
});

const tokenAdmin = tokenDe('admin1', fs);
const tokenVecino = tokenDe('vecino2', fs);

prueba('accion_verificar: un vecino que no es admin es rechazado y no se guarda nada', () => {
  const r = post({ accion: 'verificar', idToken: tokenVecino, uid: 'ana', verificado: true });
  assert.equal(r.ok, false);
  assert.match(r.error, /permiso/);
  assert.equal(leer('ana').verificado, undefined);
});

prueba('accion_verificar: sin token o con token falso → rechazado', () => {
  assert.equal(post({ accion: 'verificar', uid: 'ana', verificado: true }).ok, false);
  assert.equal(post({ accion: 'verificar', idToken: 'a.b.c', uid: 'ana', verificado: true }).ok, false);
});

prueba('accion_verificar: el admin verifica a Ana con hora del servidor y su uid', () => {
  const antes = Date.now();
  const r = post({ accion: 'verificar', idToken: tokenAdmin, uid: 'ana', verificado: true });
  assert.deepEqual({ ...r }, { ok: true, uid: 'ana', verificado: true });
  const p = leer('ana');
  assert.equal(p.verificado, true);
  assert.equal(p.verificadoPor, 'admin1');
  assert.ok(new Date(p.verificadoEn).getTime() >= antes - 1000);
  assert.equal(p.correo, 'ana@correo-privado.mx');      // no borra los demás campos
});

prueba('La ficha de Ana ahora dice «Domicilio verificado por el comité» con la fecha', () => {
  const h = vista('ana').contenido;
  assert.match(h, /Domicilio verificado por el comité/);
  assert.match(h, /Verificado el \d{1,2} de [a-z]+ de \d{4}\./);
});

prueba('accion_verificar: datos inválidos o vecino no aprobado → error claro', () => {
  assert.match(post({ accion: 'verificar', idToken: tokenAdmin, uid: '../x', verificado: true }).error, /uid no válido/);
  assert.match(post({ accion: 'verificar', idToken: tokenAdmin, uid: 'ana' }).error, /verificado/);
  assert.match(post({ accion: 'verificar', idToken: tokenAdmin, uid: 'noexiste', verificado: true }).error, /no existe/);
  assert.match(post({ accion: 'verificar', idToken: tokenAdmin, uid: 'pend', verificado: true }).error, /aprobados/);
});

prueba('accion_verificar: el admin puede quitar la verificación', () => {
  assert.equal(post({ accion: 'verificar', idToken: tokenAdmin, uid: 'ana', verificado: false }).verificado, false);
  assert.match(vista('ana').contenido, /Domicilio sin verificar/);
});

console.log(`\n${resultados.filter(Boolean).length}/${resultados.length} pruebas correctas`);
process.exit(resultados.every(Boolean) ? 0 : 1);
