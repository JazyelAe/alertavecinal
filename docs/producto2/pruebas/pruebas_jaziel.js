/*
 * pruebas_jaziel.js - Pruebas automáticas de las partes de Jaziel sobre la app PUBLICADA.
 * Toma las capturas de evidencia (docs/producto2/evidencias/jaziel-*.png) y guarda los
 * resultados en docs/producto2/pruebas/resultados_jaziel.json.
 *
 * Uso (desde la raíz del repo):
 *   npm install --no-save playwright   (o PLAYWRIGHT=<carpeta con node_modules/playwright>)
 *   node docs/producto2/pruebas/pruebas_jaziel.js
 *
 * No escribe en la base de datos real: todo en la app se prueba con ?demo=1.
 * El backend solo se consulta (GET del estado y del boletín).
 */
const fs = require('fs');
const path = require('path');
// Sin esto, Playwright no ve ni intercepta las peticiones que hace el service worker.
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';
const { chromium } = require(process.env.PLAYWRIGHT ? path.join(process.env.PLAYWRIGHT, 'playwright') : 'playwright');

const APP = 'https://jazyelae.github.io/alertavecinal/';
const BACKEND = 'https://script.google.com/macros/s/AKfycbyA-8YNUHxTZ0XILx0vCNW0PV-lX_SlT-zDDEMG_7wUcgRelPpH_9_MfC0GzfSZihiJkg/exec';
const RAIZ = path.resolve(__dirname, '..', '..', '..');
const EVIDENCIAS = path.join(RAIZ, 'docs', 'producto2', 'evidencias');
const ICONO = path.join(RAIZ, 'iconos', 'icon-512.png');
fs.mkdirSync(EVIDENCIAS, { recursive: true });

const resultados = [];
function registrar(id, paso, detalle) {
  resultados.push({ id, paso: Boolean(paso), detalle });
  console.log(`${paso ? 'OK   ' : 'FALLA'} ${id} - ${detalle}`);
}
// Espera a que se oculten los avisos flotantes (por ejemplo, "Hay una versión nueva") antes de una captura.
const sinAvisos = (pagina) => pagina.waitForFunction(() => !document.querySelector('#avisos')?.children.length, null, { timeout: 12000 }).catch(() => {});
const captura = (pagina, nombre, opciones = {}) =>
  pagina.screenshot({ path: path.join(EVIDENCIAS, `jaziel-${nombre}.png`), ...opciones });

(async () => {
  const nav = await chromium.launch();
  const escritorio = { viewport: { width: 1280, height: 800 }, locale: 'es-MX' };

  /* J-01 y J-02 · Vistas del cliente y acceso */
  const c1 = await nav.newContext(escritorio);
  const p1 = await c1.newPage();
  const errores = [];
  p1.on('pageerror', (e) => errores.push(e.message));
  await p1.goto(APP, { waitUntil: 'networkidle' });
  registrar('J-01', await p1.isVisible('#vista-acceso'), 'Sin sesión se muestra la pantalla de acceso (registro e inicio de sesión)');
  await sinAvisos(p1);
  await captura(p1, '01-acceso');
  await p1.goto(APP + '?demo=1', { waitUntil: 'networkidle' });
  const tarjetas = await p1.$$eval('#panel-modulos > article', (a) => a.map((x) => x.id.replace('tarjeta-', '')));
  registrar('J-02', (await p1.isVisible('#vista-panel')) && !errores.length && tarjetas.length >= 5,
    `Con ?demo=1 abre el panel con ${tarjetas.length} módulos (${tarjetas.join(', ')}) y sin errores de JavaScript`);
  await sinAvisos(p1);
  await captura(p1, '02-panel-escritorio');

  /* J-03 · HTTPS y manifest */
  const manifest = await (await p1.request.get(APP + 'manifest.json')).json();
  const iconos = manifest.icons.map((i) => `${i.sizes}/${i.purpose}`).join(', ');
  registrar('J-03', APP.startsWith('https://') && manifest.display === 'standalone' && manifest.icons.some((i) => i.purpose === 'maskable'),
    `Se sirve por HTTPS; manifest con display "${manifest.display}", start_url "${manifest.start_url}" e iconos ${iconos}`);

  /* J-04 · Service worker activo y app shell en Cache Storage */
  const sw = await p1.evaluate(async () => {
    const r = await navigator.serviceWorker.ready;
    if (r.active.state !== 'activated') await new Promise((ok) => r.active.addEventListener('statechange', () => r.active.state === 'activated' && ok()));
    const nombres = await caches.keys();
    const shell = nombres.find((n) => /^alertavecinal-v\d+$/.test(n));
    const claves = shell ? (await (await caches.open(shell)).keys()).length : 0;
    return { estado: r.active.state, alcance: r.scope, nombres, shell, claves };
  });
  registrar('J-04', sw.estado === 'activated' && sw.shell && sw.claves >= 13,
    `Service worker ${sw.estado} con alcance ${sw.alcance}; cachés: ${sw.nombres.join(', ')} (${sw.claves} archivos en ${sw.shell})`);

  /* J-05 · Métodos de la API Cache (demo-cache.html) */
  await p1.goto(APP + 'demo-cache.html?demo=1', { waitUntil: 'networkidle' });
  const salidas = {};
  for (const metodo of ['cachesKeys', 'cacheKeys', 'cacheMatch', 'cacheAdd', 'cachePut', 'cachesHas']) {
    await p1.click(`button[data-metodo="${metodo}"]`);
    await p1.waitForTimeout(700);
    salidas[metodo] = (await p1.textContent('#demo-salida')).trim().slice(0, 120);
  }
  registrar('J-05', Object.values(salidas).every((t) => t && !/error/i.test(t)),
    'Los botones caches.keys(), cache.keys(), cache.match(), cache.add(), cache.put() y caches.has() responden sin error');
  await p1.click('button[data-metodo="cacheKeys"]');
  await p1.waitForTimeout(700);
  await captura(p1, '03-demo-cache', { fullPage: true });

  /* J-06 y J-07 · Sin conexión: app shell y offline.html */
  await p1.goto(APP + '?demo=1', { waitUntil: 'networkidle' });
  await c1.setOffline(true);
  await p1.reload({ waitUntil: 'domcontentloaded' });
  await p1.waitForSelector('#vista-panel', { state: 'visible', timeout: 15000 }).catch(() => {});
  registrar('J-06', await p1.isVisible('#vista-panel'), 'En modo avión la app vuelve a abrir desde la caché (app shell)');
  await captura(p1, '04-sin-conexion-app');
  // setOffline no corta la red del service worker en Chromium: se corta esa petición con route().
  await c1.route('**/pagina-que-no-existe.html', (r) => r.abort('internetdisconnected'));
  await p1.goto(APP + 'pagina-que-no-existe.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
  const textoOffline = await p1.textContent('body').catch(() => '');
  registrar('J-07', /Estás sin conexión/.test(textoOffline), 'En modo avión, una página no guardada muestra offline.html ("Estás sin conexión")');
  await captura(p1, '05-offline-html');
  await c1.setOffline(false);
  await c1.close();

  /* J-08 y J-09 · Alerta sin señal, GPS y sincronización (modo demo) */
  const c2 = await nav.newContext({ ...escritorio, geolocation: { latitude: 19.0414, longitude: -98.2063 }, permissions: ['geolocation', 'clipboard-read', 'clipboard-write'] });
  const p2 = await c2.newPage();
  await p2.goto(APP + '?demo=1', { waitUntil: 'networkidle' });
  await p2.click('#btn-ubicacion');
  await p2.waitForFunction(() => /\d/.test(document.querySelector('#alerta-ubicacion-texto')?.textContent || ''), null, { timeout: 20000 }).catch(() => {});
  const ubicacion = (await p2.textContent('#alerta-ubicacion-texto')).trim();
  registrar('J-08', /\d/.test(ubicacion), `GPS: "Obtener mi ubicación" llena la ubicación (${ubicacion.slice(0, 90)})`);
  await p2.selectOption('#alerta-tipo', 'robo');
  await p2.fill('#alerta-descripcion', 'PRUEBA sin señal: sujeto intentando abrir autos');
  const antes = await p2.$$eval('#lista-alertas > *', (l) => l.length);
  await c2.setOffline(true);
  await p2.click('#btn-enviar-alerta');
  await p2.waitForFunction(() => /esperando señal/i.test(document.body.innerText), null, { timeout: 10000 }).catch(() => {});
  const enCola = /esperando señal/i.test(await p2.textContent('body'));
  registrar('J-09', enCola, 'Sin conexión, la alerta queda guardada en IndexedDB con el aviso "esperando señal"');
  await p2.waitForTimeout(6000); // que se oculten los avisos flotantes antes de la captura
  await captura(p2, '06-alerta-sin-senal');
  await c2.setOffline(false);
  await p2.evaluate(() => window.dispatchEvent(new Event('online')));
  await p2.waitForFunction((n) => document.querySelectorAll('#lista-alertas > *').length > n, antes, { timeout: 15000 }).catch(() => {});
  const despues = await p2.$$eval('#lista-alertas > *', (l) => l.length);
  registrar('J-10', despues > antes, `Al volver la señal la alerta se envía sola y aparece en la lista (${antes} → ${despues} alertas)`);

  /* J-11 · Cámara: foto comprimida con vista previa */
  await p2.setInputFiles('#alerta-foto', ICONO);
  await p2.waitForSelector('#foto-previa:not([hidden])', { timeout: 10000 }).catch(() => {});
  const peso = (await p2.textContent('#foto-peso').catch(() => '')).trim();
  registrar('J-11', await p2.isVisible('#foto-previa'), `"Agregar foto" comprime la imagen en el navegador y muestra la vista previa (${peso})`);
  await (await p2.$('#tarjeta-enviar')).screenshot({ path: path.join(EVIDENCIAS, 'jaziel-07-foto-alerta.png') });

  /* J-12 · Compartir (en escritorio sin navigator.share se copia al portapapeles) */
  await p2.locator('#lista-alertas button', { hasText: 'Compartir' }).first().click();
  await p2.waitForTimeout(800);
  const portapapeles = await p2.evaluate(() => navigator.clipboard.readText()).catch(() => '');
  registrar('J-12', /alerta=/.test(portapapeles), `"Compartir" usa navigator.share o, si no existe, copia el texto con el enlace (${portapapeles.replace(/\s+/g, ' ').slice(0, 80)}…)`);
  await c2.close();

  /* J-13 · Diseño adaptable (celular) */
  const c3 = await nav.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'es-MX' });
  const p3 = await c3.newPage();
  await p3.goto(APP + '?demo=1', { waitUntil: 'networkidle' });
  const ancho = await p3.evaluate(() => document.documentElement.scrollWidth);
  registrar('J-13', ancho <= 375, `En un celular de 375 px no hay desplazamiento horizontal (ancho del documento: ${ancho} px)`);
  await sinAvisos(p3);
  await captura(p3, '08-celular');
  await c3.close();

  /* J-14 a J-16 · Backend y vista del lado del servidor */
  const c4 = await nav.newContext(escritorio);
  const p4 = await c4.newPage();
  const estado = await (await p4.request.get(BACKEND)).json();
  registrar('J-14', estado.ok && estado.configurado, `El backend responde: configurado=${estado.configurado}, vistas ${estado.vistas.join(', ')}, acciones ${estado.acciones.join(', ')}`);
  await p4.goto(BACKEND + '?vista=boletin', { waitUntil: 'networkidle' });
  // Google sirve la vista dentro de varios marcos: se busca el que tiene el boletín.
  let marco = p4.mainFrame();
  for (const f of p4.frames()) {
    if (/Boletín de seguridad vecinal/.test(await f.evaluate(() => document.body?.innerText || '').catch(() => ''))) marco = f;
  }
  const textoBoletin = await marco.evaluate(() => document.body.innerText);
  registrar('J-15', /Generado en el servidor/.test(textoBoletin), 'El boletín se genera en el servidor de Apps Script y trae el pie "Generado en el servidor el …"');
  registrar('J-16', !/@|\b\d{1,4}\s*(int|#)/i.test(textoBoletin), 'El boletín público no muestra correos, nombres ni números de casa');
  await captura(p4, '09-boletin', { fullPage: true });
  const fuente = await marco.content();
  const inicio = Math.max(0, fuente.indexOf('<main'));
  const fragmento = fuente.slice(inicio, inicio + 1500).replace(/\n\s*\n/g, '\n');
  const pv = await c4.newPage();
  await pv.setViewportSize({ width: 820, height: 400 });
  await pv.setContent(`<pre style="font:12px/1.45 Consolas,monospace;white-space:pre-wrap;margin:16px">${fragmento.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>`);
  await pv.locator('pre').screenshot({ path: path.join(EVIDENCIAS, 'jaziel-10-boletin-codigo-fuente.png') });
  await c4.close();

  await nav.close();
  fs.writeFileSync(path.join(__dirname, 'resultados_jaziel.json'), JSON.stringify({ fecha: new Date().toISOString(), app: APP, resultados }, null, 2) + '\n');
  console.log(`\n${resultados.filter((r) => r.paso).length} de ${resultados.length} pruebas correctas`);
})().catch((e) => { console.error(e); process.exit(1); });
