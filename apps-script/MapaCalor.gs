/**
 * MapaCalor.gs · Vista generada en el SERVIDOR: «Reporte de mapa de calor».  (Dueño: Luis)
 *
 * GET …/exec?vista=mapacalor[&dias=7|30|90][&tipo=robo|medica|gas|otro]
 *
 * Es la parte de servidor de mi aportación «Mapa de calor de incidentes» (js/heatmap.js).
 * En la app, el mapa de calor se calcula en el NAVEGADOR con las alertas que el vecino ya
 * tiene. Aquí Apps Script lee las alertas de Firestore con la cuenta de servicio, las
 * AGREGA (por celda de ≈ 500 m, por colonia y por franja horaria) y arma el HTML con los
 * resultados ya calculados (plantilla vista_mapacalor.html).
 *
 * Privacidad: la página es pública. No muestra nombres, descripciones, calles, números ni
 * coordenadas exactas; solo el centro de cada celda y la colonia.
 */

const CALOR_TIPOS = { robo: 'Robo', medica: 'Emergencia médica', gas: 'Fuga de gas', otro: 'Otro' };
const CALOR_DIAS_VALIDOS = [7, 30, 90];
const CALOR_DIAS_DEFECTO = 30;
const CALOR_MAXIMO = 1000;          // alertas leídas por reporte
const CALOR_CELDA = 0.005;          // grados de la rejilla (≈ 550 m en Puebla)
const CALOR_DESFASE_MX = -6;        // hora del centro de México: UTC−6 todo el año (sin horario de verano desde 2022)
const CALOR_FRANJAS = ['00:00–04:00', '04:00–08:00', '08:00–12:00', '12:00–16:00', '16:00–20:00', '20:00–24:00'];

function vista_mapacalor(e) {
  const p = (e && e.parameter) || {};
  const dias = CALOR_DIAS_VALIDOS.indexOf(Number(p.dias)) >= 0 ? Number(p.dias) : CALOR_DIAS_DEFECTO;
  const tipo = CALOR_TIPOS[p.tipo] ? p.tipo : 'todos';
  const ahora = new Date();
  const alertas = consultar_('alertas', {
    desde: { campo: 'creado', fecha: new Date(ahora.getTime() - dias * 24 * 3600 * 1000) },
    orden: { campo: 'creado', desc: true },
    limite: CALOR_MAXIMO
  });
  return renderVista_('vista_mapacalor', armarMapaCalor_(alertas, { dias, tipo }), 'Reporte de mapa de calor · AlertaVecinal');
}

/** Calcula todo lo que muestra el reporte. Separado de la vista para poder probarlo. */
function armarMapaCalor_(alertas, opciones) {
  const tipo = opciones.tipo || 'todos';
  const lista = alertas.filter((a) => tipo === 'todos' || a.tipo === tipo);

  // 1) Celdas de la rejilla (solo alertas con coordenadas válidas).
  const celdas = {};
  lista.forEach((a) => {
    const lat = Number(a.lat), lng = Number(a.lng);
    if (typeof a.lat !== 'number' || typeof a.lng !== 'number' || !isFinite(lat) || !isFinite(lng)) return;
    const fila = Math.floor(lat / CALOR_CELDA), col = Math.floor(lng / CALOR_CELDA);
    const clave = fila + ':' + col;
    if (!celdas[clave]) {
      celdas[clave] = { lat: redondearCoord_((fila + 0.5) * CALOR_CELDA, 4), lng: redondearCoord_((col + 0.5) * CALOR_CELDA, 4),
        total: 0, robo: 0, medica: 0, gas: 0, otro: 0, zonas: {} };
    }
    const c = celdas[clave];
    c.total++;
    c[CALOR_TIPOS[a.tipo] ? a.tipo : 'otro']++;
    const z = coloniaCalor_(a.direccion);
    if (z) c.zonas[z] = (c.zonas[z] || 0) + 1;
  });
  const listaCeldas = Object.keys(celdas).map((k) => {
    const c = celdas[k];
    const zona = masFrecuenteCalor_(c.zonas);
    return { lat: c.lat, lng: c.lng, total: c.total, robo: c.robo, medica: c.medica, gas: c.gas, otro: c.otro,
      zona: zona ? zona[0] : 'Sin colonia' };
  }).sort((a, b) => b.total - a.total || a.lat - b.lat);

  // 2) Colonias.
  const zonas = {};
  lista.forEach((a) => { const z = coloniaCalor_(a.direccion) || 'Sin colonia'; zonas[z] = (zonas[z] || 0) + 1; });
  const zonaTop = masFrecuenteCalor_(zonas, 'Sin colonia');

  // 3) Franjas horarias (hora del centro de México).
  const porFranja = CALOR_FRANJAS.map((nombre) => ({ nombre, total: 0 }));
  lista.forEach((a) => {
    const t = new Date(a.creado).getTime();
    if (!isFinite(t)) return;
    const hora = (new Date(t).getUTCHours() + 24 + CALOR_DESFASE_MX) % 24;
    porFranja[Math.floor(hora / 4)].total++;
  });
  const franjaTop = porFranja.reduce((m, f) => (f.total > m.total ? f : m), { nombre: null, total: 0 });

  return {
    dias: opciones.dias,
    tipo,
    tipoNombre: tipo === 'todos' ? 'Todos los tipos' : CALOR_TIPOS[tipo],
    total: lista.length,
    conUbicacion: listaCeldas.reduce((s, c) => s + c.total, 0),
    celdas: listaCeldas,
    zonaTop: zonaTop ? { nombre: zonaTop[0], total: zonaTop[1] } : null,
    porZona: Object.keys(zonas).map((nombre) => ({ nombre, total: zonas[nombre] }))
      .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre)).slice(0, 10),
    porFranja,
    franjaTop: franjaTop.total ? franjaTop : null,
    tipos: Object.keys(CALOR_TIPOS).map((k) => ({ clave: k, nombre: CALOR_TIPOS[k] })),
    diasValidos: CALOR_DIAS_VALIDOS
  };
}

/** «Av. Juárez 152, Centro, Puebla» → «Centro, Puebla». Sin colonia reconocible → null. */
function coloniaCalor_(direccion) {
  const partes = String(direccion || '').split(',').map((p) => p.trim()).filter(Boolean);
  if (partes.length < 2) return null;
  return partes.slice(1).join(', ').slice(0, 80);
}

/** Devuelve [clave, cuenta] de la más frecuente (desempate alfabético), excluyendo «excluir». */
function masFrecuenteCalor_(conteo, excluir) {
  let mejor = null;
  Object.keys(conteo).forEach((k) => {
    if (k === excluir) return;
    if (!mejor || conteo[k] > mejor[1] || (conteo[k] === mejor[1] && k < mejor[0])) mejor = [k, conteo[k]];
  });
  return mejor;
}

/** JSON seguro para incrustar dentro de <script>: «<», U+2028 y U+2029 se escriben como \uXXXX. */
const BARRA_INVERTIDA = String.fromCharCode(92);
const CALOR_ESCAPAR = new RegExp('[<' + String.fromCharCode(0x2028, 0x2029) + ']', 'g');
function jsonCalor_(valor) {
  return JSON.stringify(valor).replace(CALOR_ESCAPAR, (c) => BARRA_INVERTIDA + 'u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4));
}
