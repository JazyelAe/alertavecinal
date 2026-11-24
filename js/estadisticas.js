/*
 * estadisticas.js - Aportación "Vecino Verificado Pro".
 * Panel para comités vecinales y fraccionamientos con datos reales de Firestore:
 *   - Indicadores de la colonia: alertas del periodo, tipo más frecuente,
 *     horario de mayor riesgo y calles con más incidentes.
 *   - Vecino Verificado: alertas por vecino, alertas útiles, antigüedad e insignia,
 *     más la ficha del vecino que tiene la sesión abierta.
 * Las alertas llegan de alertas.js (evento "av:alertas"), que escucha la colección
 * "alertas" en tiempo real. El cobro del plan, el reporte PDF y el aviso a la caseta
 * siguen siendo una maqueta: no cobran ni envían nada real.
 */
import {
  collection, onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db, esDemo, datosDemo, onSesion, aviso, agregarMenu, aFecha } from './auth.js';

const $ = (id) => document.getElementById(id);
const enPanel = Boolean($('pro-panel'));
const DIAS = 30;
const DIA_MS = 864e5;

const TIPOS_RESPALDO = {
  robo: { nombre: 'Robo', color: '#d62828' }, medica: { nombre: 'Emergencia médica', color: '#1d70b8' },
  gas: { nombre: 'Fuga de gas', color: '#f08c00' }, otro: { nombre: 'Otro', color: '#6c757d' }
};
const tipos = () => window.AV?.TIPOS || TIPOS_RESPALDO;
const calleDe = (dir = '') => dir.split(',')[0].replace(/\s+\d+\w*$/, '').trim() || 'Sin calle';
const escapar = (texto = '') => String(texto).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

// Estado del módulo
let sesion = { usuario: null, perfil: null };
let alertas = [];
let usuarios = null;            // Map uid -> perfil (solo el admin puede leer todos)
let dejarDeEscucharUsuarios = null;

/* ---------- Reglas de Vecino Verificado ---------- */

// Una alerta es útil si permite actuar sin pedir más datos:
// trae ubicación GPS y una descripción clara, o trae foto de evidencia.
export function esUtil(a) {
  const conUbicacion = typeof a.lat === 'number' && typeof a.lng === 'number';
  const descripcionClara = (a.descripcion || '').trim().length >= 15;
  return (conUbicacion && descripcionClara) || Boolean(a.foto);
}

// De mayor a menor: la primera condición que se cumple es la insignia.
const INSIGNIAS = [
  { nombre: 'Guardián', utiles: 8, dias: 90, clase: 'insignia-pro' },
  { nombre: 'Vecino confiable', utiles: 3, dias: 30, clase: 'chip chip-ok' },
  { nombre: 'Colaborador', utiles: 1, dias: 0, clase: 'chip chip-espera' },
  { nombre: 'Nuevo', utiles: 0, dias: 0, clase: 'chip' }
];

export function insigniaDe(utiles, dias) {
  return INSIGNIAS.find((i) => utiles >= i.utiles && (dias ?? 0) >= i.dias);
}

function siguienteInsignia(utiles, dias) {
  const actual = INSIGNIAS.indexOf(insigniaDe(utiles, dias));
  if (actual === 0) return 'Ya tienes la insignia más alta. ¡Gracias por cuidar a tu colonia!';
  const meta = INSIGNIAS[actual - 1];
  const faltan = [];
  if (utiles < meta.utiles) faltan.push(`${meta.utiles - utiles} alerta(s) útil(es)`);
  if ((dias ?? 0) < meta.dias) faltan.push(`${meta.dias - (dias ?? 0)} día(s) de antigüedad`);
  return `Para llegar a "${meta.nombre}" te faltan ${faltan.join(' y ')}.`;
}

const diasDesde = (fecha) => (fecha ? Math.max(0, Math.floor((Date.now() - fecha.getTime()) / DIA_MS)) : null);
const textoDias = (dias) => (dias === null ? '—' : dias === 1 ? '1 día' : `${dias} días`);
const chipInsignia = (ins) => `<span class="${ins.clase}">${ins.nombre}</span>`;

// En modo demostración todas las alertas son del usuario "demo", así que se
// agrupan también por nombre. Con datos reales cada vecino tiene su uid.
const claveVecino = (a) => `${a.uid || 'sin-uid'}|${a.nombre || 'Vecino'}`;

function alta(perfil) {
  return perfil?.creado ? aFecha(perfil.creado) : null;
}

function perfilDe(uid, nombre) {
  if (!usuarios) return null;
  if (usuarios.has(uid) && (!esDemo || uid !== 'demo')) return usuarios.get(uid);
  // En demo los perfiles de ejemplo no comparten uid con las alertas: se buscan por nombre.
  for (const p of usuarios.values()) if (p.nombre?.replace(/\s*\(demo\)$/, '') === nombre) return p;
  return null;
}

/* ---------- Cálculos por vecino ---------- */
function resumenVecinos(lista) {
  const grupos = new Map();
  for (const a of lista) {
    const clave = claveVecino(a);
    const g = grupos.get(clave) || { uid: a.uid, nombre: a.nombre || 'Vecino', total: 0, utiles: 0, primera: null };
    g.total++;
    if (esUtil(a)) g.utiles++;
    const f = aFecha(a.creado);
    if (!g.primera || f < g.primera) g.primera = f;
    grupos.set(clave, g);
  }
  return [...grupos.values()].map((g) => {
    const perfil = perfilDe(g.uid, g.nombre);
    const desdeAlta = alta(perfil);
    const dias = diasDesde(desdeAlta || g.primera);
    return { ...g, dias, exacta: Boolean(desdeAlta), insignia: insigniaDe(g.utiles, dias) };
  }).sort((x, y) => y.utiles - x.utiles || y.total - x.total);
}

function pintarVecinos(todas) {
  const filas = resumenVecinos(todas).slice(0, 10);
  $('tabla-vecinos').innerHTML = filas.map((v) => `
    <tr>
      <td>${escapar(v.nombre)}</td>
      <td>${v.total}</td>
      <td>${v.utiles} <span class="nota">(${Math.round((v.utiles / v.total) * 100)}%)</span></td>
      <td>${textoDias(v.dias)}${v.exacta ? '' : ' <span class="nota">*</span>'}</td>
      <td>${chipInsignia(v.insignia)}</td>
    </tr>`).join('') || '<tr><td colspan="5" class="nota">Aún no hay alertas.</td></tr>';
  const nota = 'Una alerta es útil si trae ubicación GPS y una descripción de al menos 15 caracteres, o si trae foto.';
  $('nota-vecinos').textContent = filas.some((v) => !v.exacta)
    ? `${nota} * Antigüedad contada desde su primera alerta registrada (solo el administrador ve la fecha de alta de todos).`
    : nota;
}

function pintarMiFicha(todas) {
  const { usuario, perfil } = sesion;
  if (!usuario || !perfil) return;
  const miNombre = (perfil.nombre || '').replace(/\s*\(demo\)$/, '');
  const mias = todas.filter((a) => a.uid === usuario.uid && (!esDemo || a.nombre === miNombre));
  const utiles = mias.filter(esUtil).length;
  const primera = mias.length ? new Date(Math.min(...mias.map((a) => aFecha(a.creado).getTime()))) : null;
  const desdeAlta = alta(perfil);
  const dias = diasDesde(desdeAlta || primera);
  const insignia = insigniaDe(utiles, dias);

  $('ficha-nombre').textContent = `${perfil.nombre || 'Vecino'} · ${perfil.calle || ''} ${perfil.numero || ''}`.trim();
  $('ficha-total').textContent = mias.length;
  $('ficha-utiles').textContent = utiles;
  $('ficha-pct').textContent = mias.length ? `${Math.round((utiles / mias.length) * 100)}% de tus alertas` : 'aún sin alertas';
  $('ficha-antiguedad').textContent = textoDias(dias);
  $('ficha-antiguedad-nota').textContent = desdeAlta ? 'desde tu registro' : primera ? 'desde tu primera alerta' : '';
  $('ficha-insignia').innerHTML = chipInsignia(insignia);
  $('ficha-siguiente').textContent = siguienteInsignia(utiles, dias);

  // Ficha pública generada en el servidor (apps-script/Verificado.gs). Requiere conexión.
  const conBackend = Boolean(self.URL_BACKEND) && !esDemo;
  $('ficha-enlace').hidden = !conBackend;
  if (conBackend) $('ficha-publica').href = `${self.URL_BACKEND}?vista=verificado&uid=${encodeURIComponent(usuario.uid)}`;
}

/* ---------- Indicadores de la colonia ---------- */
function contar(lista, clave) {
  const conteo = {};
  lista.forEach((x) => { const k = clave(x); conteo[k] = (conteo[k] || 0) + 1; });
  return Object.entries(conteo).sort((a, b) => b[1] - a[1]);
}

function pintarBarrasTipo(lista) {
  const conteo = Object.fromEntries(contar(lista, (a) => a.tipo));
  const max = Math.max(1, ...Object.values(conteo));
  $('graf-tipos').innerHTML = Object.entries(tipos()).map(([k, t]) => `
    <div class="barra-h">
      <span>${t.nombre}</span>
      <div class="pista"><div class="relleno" style="width:${((conteo[k] || 0) / max) * 100}%;background:${t.color}"></div></div>
      <strong>${conteo[k] || 0}</strong>
    </div>`).join('');
}

// Gráfica de columnas en SVG (sin librerías) por franjas de 3 horas.
function pintarHoras(lista) {
  const franjas = new Array(8).fill(0);
  lista.forEach((a) => { franjas[Math.floor(aFecha(a.creado).getHours() / 3)]++; });
  const max = Math.max(1, ...franjas);
  const ancho = 320, alto = 150, col = ancho / 8;
  const barras = franjas.map((n, i) => {
    const h = (n / max) * (alto - 42);
    const color = n === max ? '#e63946' : '#457b9d';
    return `<rect x="${i * col + 6}" y="${alto - 20 - h}" width="${col - 12}" height="${h}" rx="4" fill="${color}"/>
      <text x="${i * col + col / 2}" y="${alto - 24 - h}" font-size="10" text-anchor="middle" fill="#1f2933">${n}</text>
      <text x="${i * col + col / 2}" y="${alto - 6}" font-size="9" text-anchor="middle" fill="#5f6b7a">${String(i * 3).padStart(2, '0')}h</text>`;
  }).join('');
  $('graf-horas').innerHTML = `<svg viewBox="0 0 ${ancho} ${alto}" width="100%" role="img" aria-label="Alertas por horario">${barras}</svg>`;
}

function pintarCalles(lista) {
  const top = contar(lista, (a) => calleDe(a.direccion)).slice(0, 5);
  const max = top[0]?.[1] || 1;
  $('tabla-calles').innerHTML = top.map(([calle, n]) => {
    const nivel = n / max > 0.66 ? ['Alto', 'chip-mal'] : n / max > 0.33 ? ['Medio', 'chip-espera'] : ['Bajo', 'chip-ok'];
    return `<tr><td>${escapar(calle)}</td><td>${n}</td><td><span class="chip ${nivel[1]}">${nivel[0]}</span></td></tr>`;
  }).join('') || '<tr><td colspan="3" class="nota">Sin datos.</td></tr>';
}

function pintarCaseta(lista) {
  const urgentes = lista.filter((a) => a.tipo === 'robo' || a.tipo === 'gas');
  $('kpi-caseta').textContent = urgentes.length;
  $('lista-caseta').innerHTML = urgentes.slice(0, 4).map((a) => {
    const f = aFecha(a.creado);
    return `<li><span>${escapar(tipos()[a.tipo]?.nombre || a.tipo)} · ${escapar(calleDe(a.direccion))}</span>
      <span class="nota">${f.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} ${f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} · simulado</span></li>`;
  }).join('') || '<li>Sin avisos.</li>';
}

function pintar() {
  if (!enPanel || $('pro-panel').hidden) return;
  const limite = Date.now() - DIAS * DIA_MS;
  const lista = alertas.filter((a) => aFecha(a.creado).getTime() >= limite);
  const anteriores = alertas.filter((a) => {
    const t = aFecha(a.creado).getTime();
    return t < limite && t >= limite - DIAS * DIA_MS;
  });
  $('kpi-total').textContent = lista.length;
  const cambio = anteriores.length ? Math.round(((lista.length - anteriores.length) / anteriores.length) * 100) : null;
  $('kpi-cambio').textContent = cambio === null ? 'primer periodo' : `${cambio > 0 ? '+' : ''}${cambio}% vs. periodo anterior`;
  const [tipoTop, nTop] = contar(lista, (a) => a.tipo)[0] || [];
  $('kpi-tipo').textContent = tipoTop ? (tipos()[tipoTop]?.nombre || tipoTop).split(' ')[0] : '—';
  $('kpi-tipo-pct').textContent = tipoTop ? `${Math.round((nTop / lista.length) * 100)}% del total` : '';
  $('kpi-vecinos').textContent = new Set(lista.map(claveVecino)).size;
  pintarBarrasTipo(lista);
  pintarHoras(lista);
  pintarCalles(lista);
  pintarCaseta(lista);
  // La ficha y la tabla de vecinos usan todas las alertas cargadas (no solo el periodo):
  // la insignia premia la trayectoria del vecino.
  pintarVecinos(alertas);
  pintarMiFicha(alertas);
}

/* ---------- Perfiles (solo admin) para la antigüedad exacta de todos ---------- */
function escucharUsuarios(esAdmin) {
  if (!esAdmin || dejarDeEscucharUsuarios || usuarios) return;
  if (esDemo) {
    usuarios = new Map(datosDemo.usuarios.map((u) => [u.id, u]));
    return pintar();
  }
  dejarDeEscucharUsuarios = onSnapshot(collection(db, 'usuarios'), (snap) => {
    usuarios = new Map(snap.docs.map((d) => [d.id, d.data({ serverTimestamps: 'estimate' })]));
    pintar();
  }, (error) => {
    console.warn('[AlertaVecinal] Panel Pro: no se pudieron leer los perfiles.', error.message);
  });
}

/* ---------- Arranque ---------- */
if (enPanel) {
  // Conserva el modo demostración al navegar desde la barra.
  if (esDemo) document.querySelectorAll('header a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href.includes('demo=1') && !href.startsWith('http')) a.setAttribute('href', `${href}${href.includes('?') ? '&' : '?'}demo=1`);
  });
  if (esDemo) $('pro-origen').textContent = 'Modo demostración: indicadores calculados con datos de ejemplo. ' +
    'El cobro del plan, el reporte en PDF y el aviso a la caseta son una maqueta.';

  document.addEventListener('av:alertas', (e) => { alertas = e.detail || []; pintar(); });
  $('btn-reporte').addEventListener('click', () => {
    aviso('Maqueta: en el plan de pago aquí se generaría el reporte mensual en PDF.', 'info', 5000);
    setTimeout(() => window.print(), 600);
  });
  $('btn-caseta').addEventListener('click', () =>
    aviso('Maqueta: la caseta recibiría esta alerta en su tableta al instante.', 'ok', 5000));
}

onSesion(({ usuario, perfil }) => {
  sesion = { usuario, perfil };
  const aprobado = perfil?.estado === 'aprobado';
  if (aprobado) agregarMenu({ id: 'menu-pro', texto: 'Panel Pro', href: 'estadisticas.html' + (esDemo ? '?demo=1' : '') });
  if (!enPanel) return;
  $('pro-sin-sesion').hidden = aprobado;
  $('pro-panel').hidden = !aprobado;
  if (!aprobado) return;
  escucharUsuarios(perfil.rol === 'admin');
  if (window.AV?.alertas) alertas = window.AV.alertas;
  pintar();
});
