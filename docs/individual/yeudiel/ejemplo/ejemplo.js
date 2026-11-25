/*
 * ejemplo.js · Ejemplo mínimo propio (Yeudiel) para SP4 y SP6.
 * Usa los 12 métodos principales de la API Cache y una notificación local.
 * Caché propia: no toca las cachés de la app AlertaVecinal.
 */
const CACHE = 'ejemplo-yeudiel-v1';
const salida = document.getElementById('salida');
const escribir = (lineas) => { salida.textContent = [].concat(lineas).join('\n'); };
const corta = (url) => new URL(url).pathname.split('/').pop() || '(carpeta)';

// Registro del service worker propio (alcance: solo esta carpeta).
let registro = null;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw-ejemplo.js').then(async (r) => {
    registro = r;
    await navigator.serviceWorker.ready;
    document.getElementById('estado-sw').textContent =
      `Activo · alcance ${new URL(r.scope).pathname}`;
  }).catch((e) => { document.getElementById('estado-sw').textContent = 'Error: ' + e.message; });
} else {
  document.getElementById('estado-sw').textContent = 'Este navegador no soporta service workers.';
}

const pasos = {
  async guardar() {
    const cache = await caches.open(CACHE);                  // 1. caches.open
    await cache.addAll(['index.html', 'ejemplo.js']);         // 2. cache.addAll (todo o nada)
    await cache.add('manifest.json');                         // 3. cache.add (fetch + put)
    const datos = { alerta: 'Robo', colonia: 'Centro', hora: new Date().toLocaleTimeString('es-MX') };
    await cache.put('ultima-alerta.json', new Response(JSON.stringify(datos), {
      headers: { 'Content-Type': 'application/json' }       // 4. cache.put (respuesta creada aquí)
    }));
    escribir(['OK: 4 entradas guardadas en "' + CACHE + '"',
      'addAll → index.html, ejemplo.js', 'add → manifest.json', 'put → ultima-alerta.json (sin red)']);
  },

  async listar() {
    const nombres = await caches.keys();                      // 5. caches.keys
    const cache = await caches.open(CACHE);
    const peticiones = await cache.keys();                    // 6. cache.keys
    escribir(['caches.keys() → ' + JSON.stringify(nombres),
      `cache.keys() en "${CACHE}" → ${peticiones.length} entradas:`,
      ...peticiones.map((p) => '  · ' + corta(p.url))]);
  },

  async buscar() {
    const cache = await caches.open(CACHE);
    const r = await cache.match('ultima-alerta.json');        // 7. cache.match
    const todas = await cache.matchAll();                     // 8. cache.matchAll
    const global = await caches.match('manifest.json');       // 9. caches.match (todas las cachés)
    escribir([
      'cache.match("ultima-alerta.json") → ' + (r ? await r.text() : 'undefined'),
      `cache.matchAll() → ${todas.length} respuestas (${todas.map((x) => x.status).join(', ')})`,
      'caches.match("manifest.json") → ' + (global ? `status ${global.status}, ${global.headers.get('content-type')}` : 'undefined')
    ]);
  },

  async existe() {
    const si = await caches.has(CACHE);                       // 10. caches.has
    const no = await caches.has('no-existe');
    escribir([`caches.has("${CACHE}") → ${si}`, `caches.has("no-existe") → ${no}`]);
  },

  async borrar() {
    const cache = await caches.open(CACHE);
    const una = await cache.delete('ultima-alerta.json');     // 11. cache.delete (una entrada)
    const toda = await caches.delete(CACHE);                  // 12. caches.delete (la caché completa)
    escribir([`cache.delete("ultima-alerta.json") → ${una}`, `caches.delete("${CACHE}") → ${toda}`,
      'La caché se volverá a crear al pulsar "Guardar".']);
  },

  async notificar() {
    if (!('Notification' in window)) return escribir('Este navegador no soporta notificaciones.');
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') return escribir('Permiso: ' + permiso + ' (no se puede notificar).');
    const r = registro || await navigator.serviceWorker.ready;
    await r.showNotification('AlertaVecinal · prueba', {
      body: 'Fuga de gas reportada en tu colonia. Toca para abrir.',
      icon: '../../../../iconos/icon-192.png',
      tag: 'ejemplo-yeudiel',
      vibrate: [200, 100, 200],
      data: { url: './' }
    });
    const visibles = await r.getNotifications({ tag: 'ejemplo-yeudiel' });
    escribir(['Permiso: ' + permiso, 'registration.showNotification() → OK',
      `getNotifications() → ${visibles.length} visible(s): "${visibles.map((n) => n.title).join('", "')}"`,
      'Cuerpo: ' + (visibles[0]?.body || '')]);
  }
};

document.querySelectorAll('[data-paso]').forEach((b) => b.addEventListener('click', async () => {
  try { await pasos[b.dataset.paso](); } catch (e) { escribir('Error: ' + e.message); }
}));
