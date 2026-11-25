/*
 * evidencias_equipo.js - Capturas de las funciones de Luis y Yeudiel para el apartado 5
 * del Producto 2 (docs/producto2/evidencias/equipo-*.png).
 * Las toma Jaziel como coordinador, sobre la app PUBLICADA en modo demostración.
 *
 * Uso (desde la raíz del repo):
 *   npm install --no-save playwright   (o PLAYWRIGHT=<carpeta con node_modules/playwright>)
 *   node docs/producto2/pruebas/evidencias_equipo.js
 */
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT ? path.join(process.env.PLAYWRIGHT, 'playwright') : 'playwright');

const APP = 'https://jazyelae.github.io/alertavecinal/';
const BACKEND = 'https://script.google.com/macros/s/AKfycbyA-8YNUHxTZ0XILx0vCNW0PV-lX_SlT-zDDEMG_7wUcgRelPpH_9_MfC0GzfSZihiJkg/exec';
const EVIDENCIAS = path.resolve(__dirname, '..', 'evidencias');
const archivo = (nombre) => path.join(EVIDENCIAS, `equipo-${nombre}.png`);
const sinAvisos = (p) => p.waitForFunction(() => !document.querySelector('#avisos')?.children.length, null, { timeout: 12000 }).catch(() => {});

(async () => {
  const nav = await chromium.launch();
  const c = await nav.newContext({ viewport: { width: 1280, height: 860 }, locale: 'es-MX' });
  const p = await c.newPage();

  // Luis · mapa de alertas con la ventana de una alerta
  await p.goto(APP + '?demo=1', { waitUntil: 'networkidle' });
  await p.waitForSelector('#tarjeta-mapa .leaflet-interactive', { timeout: 20000 });
  await p.locator('#tarjeta-mapa .leaflet-interactive').first().click({ force: true });
  await p.waitForTimeout(1500);
  await sinAvisos(p);
  await p.locator('#tarjeta-mapa').screenshot({ path: archivo('01-mapa-alertas') });

  // Luis · mapa de calor
  await p.locator('#tarjeta-calor').scrollIntoViewIfNeeded();
  await p.waitForTimeout(1500);
  await p.locator('#tarjeta-calor').screenshot({ path: archivo('02-mapa-calor') });

  // Luis · página de notificaciones push
  await p.goto(APP + 'demo-push.html?demo=1', { waitUntil: 'networkidle' });
  await sinAvisos(p);
  await p.screenshot({ path: archivo('03-demo-push'), fullPage: true });

  // Yeudiel · panel de administración
  await p.goto(APP + 'admin.html?demo=1', { waitUntil: 'networkidle' });
  await sinAvisos(p);
  await p.screenshot({ path: archivo('04-administracion') });

  // Yeudiel · Panel Pro (Vecino Verificado Pro)
  await p.goto(APP + 'estadisticas.html?demo=1', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  await sinAvisos(p);
  await p.screenshot({ path: archivo('05-panel-pro') });

  // Luis · reporte de mapa de calor generado en el servidor
  await p.goto(BACKEND + '?vista=mapacalor', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: archivo('06-reporte-calor-servidor') });

  await nav.close();
  console.log('Capturas guardadas en', EVIDENCIAS);
})().catch((e) => { console.error(e); process.exit(1); });
