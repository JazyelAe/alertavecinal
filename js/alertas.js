/*
 * alertas.js - Enviar alertas y verlas en una lista en tiempo real.
 * Publica el evento "av:alertas" (document) cada vez que cambia la lista,
 * para que el mapa, el mapa de calor y otros módulos se actualicen.
 */
import {
  collection, doc, setDoc, onSnapshot, query, orderBy, limit, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db, esDemo, datosDemo, onSesion, aviso, aFecha, agregarMenu } from './auth.js';

// Catálogo de tipos (lo reutilizan mapa.js, heatmap.js y estadisticas.js).
export const TIPOS = {
  robo: { nombre: 'Robo', color: '#d62828' },
  medica: { nombre: 'Emergencia médica', color: '#1d70b8' },
  gas: { nombre: 'Fuga de gas', color: '#f08c00' },
  otro: { nombre: 'Otro', color: '#6c757d' }
};
window.AV.TIPOS = TIPOS;

const $ = (id) => document.getElementById(id);
let alertas = [];
let ubicacion = null;          // { lat, lng, direccion }
let foto = null;               // data-URL JPEG ya comprimida (cámara) o null
let idsConocidos = null;       // ids de alertas ya vistas (para vibrar solo con las nuevas)
let dejarDeEscuchar = null;
const idResaltada = new URLSearchParams(location.search).get('alerta');

/* ---------- Publicar (lo usa también offline-sync.js) ---------- */
// Guarda una alerta con un id propio; así, si se reintenta, no se duplica.
export async function publicarAlerta(datos, id = doc(collection(db, 'alertas')).id) {
  if (esDemo) {
    alertas = [{ id, ...datos, creado: new Date() }, ...alertas];
    return notificarCambio();
  }
  await setDoc(doc(db, 'alertas', id), { ...datos, creado: serverTimestamp() });
  // Si existe el módulo de push, avisa a los demás celulares (sin esperar la respuesta).
  window.AV.push?.enviarPushReal?.('alerta', id);
}
// Solo en modo demo: simula que llega una alerta de OTRO vecino (para probar la vibración).
function recibirDemo(datos) {
  if (!esDemo) return;
  alertas = [{ id: 'demo-recibida-' + Date.now(), uid: 'otro-vecino', creado: new Date(), ...datos }, ...alertas];
  notificarCambio();
}
window.AV.alertasApi = { publicarAlerta, TIPOS, recibirDemo };

function notificarCambio() {
  vibrarSiHayNuevas(alertas);
  window.AV.alertas = alertas;
  pintarLista();
  document.dispatchEvent(new CustomEvent('av:alertas', { detail: alertas }));
}

/* ---------- Lista ---------- */
function tiempoRelativo(fecha) {
  const min = Math.round((Date.now() - fecha.getTime()) / 60000);
  if (min < 1) return 'justo ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function pintarLista() {
  const lista = $('lista-alertas');
  if (!lista) return;
  if ($('contador-alertas')) $('contador-alertas').textContent = alertas.length;
  lista.innerHTML = '';
  if (!alertas.length) {
    lista.innerHTML = '<li class="vacio">Aún no hay alertas. ¡Ojalá siga así!</li>';
    return;
  }
  for (const a of alertas.slice(0, 50)) {
    const tipo = TIPOS[a.tipo] || TIPOS.otro;
    const li = document.createElement('li');
    li.className = `alerta ${a.tipo}`;
    li.id = `alerta-${a.id}`;
    if (a.id === idResaltada) li.classList.add('resaltada');

    const cabeza = document.createElement('div');
    cabeza.className = 'alerta-cabeza';
    const titulo = document.createElement('span');
    titulo.className = 'alerta-tipo';
    titulo.innerHTML = `<span class="punto" style="background:${tipo.color}"></span>`;
    titulo.append(tipo.nombre);
    const hora = document.createElement('span');
    hora.className = 'alerta-meta';
    hora.textContent = tiempoRelativo(aFecha(a.creado));
    cabeza.append(titulo, hora);

    const texto = document.createElement('div');
    texto.textContent = a.descripcion;
    const meta = document.createElement('div');
    meta.className = 'alerta-meta';
    meta.textContent = `${a.direccion || 'Sin dirección'} · ${a.nombre || 'Vecino'}`;
    li.append(cabeza, texto);
    if (esFotoValida(a.foto)) li.appendChild(miniatura(a.foto, tipo.nombre));
    li.appendChild(meta);

    const acciones = document.createElement('div');
    acciones.className = 'alerta-acciones';
    if (typeof a.lat === 'number') {
      acciones.appendChild(botonChico('Ver en el mapa', () =>
        document.dispatchEvent(new CustomEvent('av:enfocar', { detail: a }))));
    }
    acciones.appendChild(botonChico('Compartir', () => compartirAlerta(a)));
    li.appendChild(acciones);
    lista.appendChild(li);
  }
  // Si llegamos desde una notificación (?alerta=ID), la mostramos.
  if (idResaltada) $(`alerta-${idResaltada}`)?.scrollIntoView({ block: 'center' });
}

function escucharAlertas() {
  if (esDemo) {
    alertas = [...datosDemo.alertas];
    return notificarCambio();
  }
  // onSnapshot: Firestore nos avisa cada vez que se crea o cambia una alerta.
  const consulta = query(collection(db, 'alertas'), orderBy('creado', 'desc'), limit(200));
  dejarDeEscuchar = onSnapshot(consulta, (snap) => {
    alertas = snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
    notificarCambio();
  }, (error) => {
    console.error('Error al escuchar alertas:', error);
    aviso('No se pudieron cargar las alertas.', 'error');
  });
}

function botonChico(texto, alPulsar) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn btn-claro btn-chico';
  boton.textContent = texto;
  boton.addEventListener('click', alPulsar);
  return boton;
}

/* ---------- Cámara: foto de evidencia ---------- */
// Solo aceptamos JPEG en data-URL (igual que firestore.rules).
const esFotoValida = (f) => typeof f === 'string' && f.startsWith('data:image/jpeg;base64,');
const LADO_MAXIMO = 800;            // px
const PESO_OBJETIVO = 150 * 1024;   // bytes
const pesoDe = (dataUrl) => Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 3 / 4);

// Reduce la foto en el propio teléfono con <canvas> y la convierte en JPEG.
// Así cabe dentro del documento de Firestore (Firebase Storage pide el plan de pago).
async function comprimirFoto(archivo) {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close?.();
  let calidad = 0.6;
  let resultado = lienzo.toDataURL('image/jpeg', calidad);
  while (pesoDe(resultado) > PESO_OBJETIVO && calidad > 0.4) {
    calidad = Math.round((calidad - 0.1) * 10) / 10;
    resultado = lienzo.toDataURL('image/jpeg', calidad);
  }
  return resultado;
}

async function alElegirFoto(e) {
  const archivo = e.target.files?.[0];
  if (!archivo) return;
  if (!archivo.type.startsWith('image/')) return aviso('El archivo no es una imagen.', 'error');
  try {
    foto = await comprimirFoto(archivo);
    $('foto-previa-img').src = foto;
    $('foto-peso').textContent = `Foto lista: ${Math.round(pesoDe(foto) / 1024)} KB`;
    $('foto-previa').hidden = false;
  } catch (error) {
    console.error(error);
    foto = null;
    aviso('No se pudo procesar la foto. Intenta con otra.', 'error');
  }
}

function quitarFoto() {
  foto = null;
  if ($('alerta-foto')) $('alerta-foto').value = '';
  if ($('foto-previa')) $('foto-previa').hidden = true;
}

function miniatura(dataUrl, tipoNombre) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'alerta-foto';
  boton.setAttribute('aria-label', 'Ver la foto en grande');
  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = `Foto de la alerta: ${tipoNombre}`;
  img.loading = 'lazy';
  boton.appendChild(img);
  boton.addEventListener('click', () => verFotoGrande(dataUrl, img.alt));
  return boton;
}

function verFotoGrande(dataUrl, texto) {
  let dialogo = $('dialogo-foto');
  if (!dialogo) {
    dialogo = document.createElement('dialog');
    dialogo.id = 'dialogo-foto';
    dialogo.className = 'foto-grande';
    dialogo.innerHTML = '<img alt=""><form method="dialog"><button class="btn btn-claro btn-chico">Cerrar</button></form>';
    dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });
    document.body.appendChild(dialogo);
  }
  const img = dialogo.querySelector('img');
  img.src = dataUrl;
  img.alt = texto;
  dialogo.showModal();
}

/* ---------- Vibración al llegar una alerta nueva ---------- */
// Solo con alertas NUEVAS de otros vecinos (no al cargar la lista ni con las propias).
// iOS no tiene navigator.vibrate: ahí simplemente no vibra.
function vibrarSiHayNuevas(lista) {
  const miUid = window.AV.sesion?.usuario?.uid;
  if (idsConocidos) {
    const nuevas = lista.filter((a) => !idsConocidos.has(a.id) && a.uid !== miUid);
    if (nuevas.length && 'vibrate' in navigator) navigator.vibrate([200, 100, 200]);
  }
  // Mientras la lista esté vacía (todavía cargando) no fijamos el punto de partida.
  if (lista.length) idsConocidos = new Set(lista.map((a) => a.id));
}

/* ---------- Compartir (menú nativo del teléfono) ---------- */
async function compartirAlerta(a) {
  const tipo = (TIPOS[a.tipo] || TIPOS.otro).nombre;
  const url = new URL(`./?alerta=${encodeURIComponent(a.id)}`, location.href).href;
  const texto = `${tipo}: ${a.descripcion}${a.direccion ? ' · ' + a.direccion : ''}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: `${tipo} · AlertaVecinal`, text: texto, url });
    } catch (error) {
      if (error.name !== 'AbortError') aviso('No se pudo compartir la alerta.', 'error');
    }
    return;
  }
  // Respaldo (por ejemplo, Firefox en computadora): copiar al portapapeles.
  try {
    await navigator.clipboard.writeText(`${texto}\n${url}`);
    aviso('Tu navegador no tiene «Compartir»: copiamos la alerta al portapapeles.', 'ok');
  } catch {
    aviso('No se pudo compartir ni copiar la alerta.', 'error');
  }
}

/* ---------- Ubicación ---------- */
function obtenerUbicacion() {
  const texto = $('alerta-ubicacion-texto');
  if (!('geolocation' in navigator)) {
    texto.textContent = 'Tu navegador no permite obtener la ubicación.';
    return;
  }
  texto.textContent = 'Buscando tu ubicación…';
  // API de geolocalización del navegador (pide permiso al usuario).
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    ubicacion = { lat, lng, direccion: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
    texto.textContent = ubicacion.direccion;
    // Si el módulo del mapa está cargado, convertimos coordenadas en dirección (Nominatim).
    if (window.AV.mapa?.direccionDe && navigator.onLine) {
      try {
        ubicacion.direccion = await window.AV.mapa.direccionDe(lat, lng);
        texto.textContent = ubicacion.direccion;
      } catch { /* nos quedamos con las coordenadas */ }
    }
  }, (error) => {
    texto.textContent = error.code === 1
      ? 'Permiso de ubicación denegado. Actívalo para enviar alertas.'
      : 'No se pudo obtener la ubicación. Intenta de nuevo.';
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
}

async function enviarAlerta(e) {
  e.preventDefault();
  const { usuario, perfil } = window.AV.sesion || {};
  if (!ubicacion) {
    aviso('Primero pulsa "Obtener mi ubicación".', 'error');
    return;
  }
  const datos = {
    tipo: $('alerta-tipo').value,
    descripcion: $('alerta-descripcion').value.trim(),
    lat: ubicacion.lat,
    lng: ubicacion.lng,
    direccion: ubicacion.direccion,
    uid: usuario.uid,
    nombre: perfil?.nombre || usuario.email
  };
  if (foto) datos.foto = foto;
  const boton = $('btn-enviar-alerta');
  boton.disabled = true;
  try {
    // Sin internet: si existe el módulo "Alerta sin señal", la guarda para enviarla después.
    if (!navigator.onLine && window.AV.offline?.encolar) {
      await window.AV.offline.encolar(datos);
    } else {
      await publicarAlerta(datos);
      aviso('Alerta enviada a tus vecinos.', 'ok');
    }
    e.target.reset();
    ubicacion = null;
    quitarFoto();
    $('alerta-ubicacion-texto').textContent = 'Sin ubicación todavía';
  } catch (error) {
    console.error(error);
    aviso('No se pudo enviar la alerta. Revisa tu conexión.', 'error');
  } finally {
    boton.disabled = false;
  }
}

/* ---------- Boletín público (vista generada en el servidor) ---------- */
// La página la arma Google Apps Script (apps-script/Boletin.gs) con datos de Firestore.
// Es de otro origen, así que no se guarda en caché: sin conexión avisamos en lugar de abrirla.
function agregarEnlaceBoletin() {
  if (!self.URL_BACKEND) return;
  const li = agregarMenu({ id: 'menu-boletin', texto: 'Boletín', href: self.URL_BACKEND + '?vista=boletin' });
  const enlace = (li || document.getElementById('menu-boletin'))?.querySelector('a');
  if (!enlace) return;
  enlace.target = '_blank';
  enlace.rel = 'noopener';
  enlace.addEventListener('click', (e) => {
    if (!navigator.onLine) {
      e.preventDefault();
      aviso('El boletín se genera en el servidor y necesita conexión a Internet.', 'info');
    }
  });
}

/* ---------- Arranque ---------- */
agregarEnlaceBoletin();
$('btn-ubicacion')?.addEventListener('click', obtenerUbicacion);
$('alerta-foto')?.addEventListener('change', alElegirFoto);
$('btn-quitar-foto')?.addEventListener('click', quitarFoto);
$('form-alerta')?.addEventListener('submit', enviarAlerta);

onSesion(({ perfil }) => {
  const aprobado = perfil?.estado === 'aprobado';
  if (aprobado && !dejarDeEscuchar && !alertas.length) escucharAlertas();
  if (!aprobado && dejarDeEscuchar) {
    dejarDeEscuchar();
    dejarDeEscuchar = null;
    alertas = [];
    notificarCambio();
  }
});
