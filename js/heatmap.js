/*
 * heatmap.js - Aportación "Mapa de calor de incidentes".
 * Usa el plugin Leaflet.heat para pintar las zonas con más alertas,
 * con filtros por tipo y por rango de fechas, y un resumen de las
 * calles con más incidentes.
 */
import { onSesion, aFecha, aviso, agregarMenu } from './auth.js';

const PLUGIN_HEAT = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
let mapaCalor = null;
let capaCalor = null;
let alertas = [];

function cargarScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = '';
    s.onload = resolve;
    s.onerror = () => reject(new Error('No se pudo cargar ' + src));
    document.head.appendChild(s);
  });
}

// Necesitamos Leaflet (lo carga mapa.js) y después el plugin.
async function cargarDependencias() {
  if (!window.AV.mapa?.cargarLeaflet) throw new Error('Falta js/mapa.js');
  const L = await window.AV.mapa.cargarLeaflet();
  if (!L.heatLayer) await cargarScript(PLUGIN_HEAT);
  return L;
}

const fechaInput = (d) => d.toISOString().slice(0, 10);

function crearTarjeta() {
  const contenedor = document.getElementById('panel-modulos');
  if (!contenedor || document.getElementById('tarjeta-calor')) return false;
  const tipos = window.AV.TIPOS || {};
  const hoy = new Date();
  const hace30 = new Date(Date.now() - 30 * 864e5);
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta ancho-completo';
  tarjeta.id = 'tarjeta-calor';
  tarjeta.innerHTML = `
    <h2>Mapa de calor de incidentes <span class="chip">Nuevo</span></h2>
    <p class="nota">Las zonas rojas concentran más alertas. Úsalo para saber qué calles requieren más cuidado.</p>
    <div class="filtros">
      <label>Tipo
        <select id="calor-tipo">
          <option value="todos">Todos los tipos</option>
          ${Object.entries(tipos).map(([k, t]) => `<option value="${k}">${t.nombre}</option>`).join('')}
        </select>
      </label>
      <label>Desde <input type="date" id="calor-desde" value="${fechaInput(hace30)}"></label>
      <label>Hasta <input type="date" id="calor-hasta" value="${fechaInput(hoy)}"></label>
    </div>
    <div id="mapa-calor" class="mapa" role="region" aria-label="Mapa de calor"></div>
    <p id="calor-resumen" class="resumen-calor"></p>
    ${self.URL_BACKEND ? `<p class="nota"><a id="calor-reporte" href="${urlReporte()}" target="_blank" rel="noopener">
      Ver reporte generado en el servidor</a> (últimos 30 días, agrupado por zona y por hora).</p>` : ''}`;
  contenedor.appendChild(tarjeta);
  ['calor-tipo', 'calor-desde', 'calor-hasta'].forEach((id) =>
    document.getElementById(id).addEventListener('change', actualizar));
  const enlace = document.getElementById('calor-reporte');
  if (enlace) {
    protegerSinConexion(enlace);
    // El reporte respeta el tipo elegido en el filtro.
    document.getElementById('calor-tipo').addEventListener('change', (e) => { enlace.href = urlReporte(e.target.value); });
  }
  return true;
}

/* ---------- Reporte generado en el servidor (apps-script/MapaCalor.gs) ----------
 * Apps Script agrega las alertas por zona, tipo y franja horaria y devuelve la página ya armada.
 * Es de otro origen, así que no se guarda en caché: sin conexión avisamos en lugar de abrirla. */
function urlReporte(tipo = 'todos') {
  return `${self.URL_BACKEND}?vista=mapacalor${tipo && tipo !== 'todos' ? '&tipo=' + encodeURIComponent(tipo) : ''}`;
}

function protegerSinConexion(enlace) {
  enlace.addEventListener('click', (e) => {
    if (!navigator.onLine) {
      e.preventDefault();
      aviso('El reporte de calor se genera en el servidor y necesita conexión a Internet.', 'info');
    }
  });
}

function agregarEnlaceReporte() {
  if (!self.URL_BACKEND) return;
  const li = agregarMenu({ id: 'menu-reporte-calor', texto: 'Reporte de calor', href: urlReporte() });
  const enlace = (li || document.getElementById('menu-reporte-calor'))?.querySelector('a');
  if (!enlace) return;
  enlace.target = '_blank';
  enlace.rel = 'noopener';
  protegerSinConexion(enlace);
}

// Aplica los filtros y devuelve las alertas que se van a pintar.
function filtrar() {
  const tipo = document.getElementById('calor-tipo').value;
  const desde = new Date(document.getElementById('calor-desde').value + 'T00:00:00');
  const hasta = new Date(document.getElementById('calor-hasta').value + 'T23:59:59');
  return alertas.filter((a) => {
    if (typeof a.lat !== 'number') return false;
    if (tipo !== 'todos' && a.tipo !== tipo) return false;
    const f = aFecha(a.creado);
    return f >= desde && f <= hasta;
  });
}

// Calle = primera parte de la dirección, sin el número.
function calleDe(direccion = '') {
  return direccion.split(',')[0].replace(/\s+\d+\w*$/, '').trim() || 'Sin calle';
}

function actualizar() {
  if (!mapaCalor) return;
  const visibles = filtrar();
  // Cada punto: [lat, lng, intensidad]. Robo y gas pesan un poco más.
  const puntos = visibles.map((a) => [a.lat, a.lng, a.tipo === 'robo' || a.tipo === 'gas' ? 1 : 0.7]);
  capaCalor.setLatLngs(puntos);

  const conteo = {};
  visibles.forEach((a) => { const c = calleDe(a.direccion); conteo[c] = (conteo[c] || 0) + 1; });
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 3);
  document.getElementById('calor-resumen').textContent = visibles.length
    ? `${visibles.length} alertas en el periodo. Calles más reportadas: ` +
      top.map(([c, n]) => `${c} (${n})`).join(', ') + '.'
    : 'No hay alertas con esos filtros.';
}

async function iniciar() {
  if (!crearTarjeta()) return;
  try {
    const L = await cargarDependencias();
    mapaCalor = L.map('mapa-calor').setView([19.0414, -98.2063], 14);
    window.AV.mapa.capaOSM(L).addTo(mapaCalor);
    capaCalor = L.heatLayer([], {
      radius: 28, blur: 22, maxZoom: 16, minOpacity: 0.35,
      gradient: { 0.2: '#2a9d8f', 0.45: '#e9c46a', 0.7: '#f4a261', 1: '#e63946' }
    }).addTo(mapaCalor);
    alertas = window.AV.alertas || [];
    const conCoordenadas = alertas.filter((a) => typeof a.lat === 'number').map((a) => [a.lat, a.lng]);
    if (conCoordenadas.length) mapaCalor.fitBounds(conCoordenadas, { padding: [30, 30], maxZoom: 15 });
    actualizar();
  } catch (error) {
    document.getElementById('mapa-calor').textContent = 'El mapa de calor no está disponible: ' + error.message;
  }
}

document.addEventListener('av:alertas', (e) => { alertas = e.detail; actualizar(); });
agregarEnlaceReporte();

onSesion(({ perfil }) => {
  if (perfil?.estado === 'aprobado') iniciar().then(() => mapaCalor?.invalidateSize());
});
