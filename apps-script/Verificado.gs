/**
 * Verificado.gs · Aportación «Vecino Verificado Pro» en el SERVIDOR.  (Dueño: Yeudiel)
 *
 * 1. GET …/exec?vista=verificado&uid=UID
 *    Ficha pública de un Vecino Verificado. Apps Script lee el perfil y las alertas
 *    de Firestore con la cuenta de servicio, calcula los indicadores y arma el HTML
 *    aquí mismo (plantilla vista_verificado.html). El navegador recibe la página
 *    con los datos ya incrustados.
 *
 * 2. POST {accion: "verificar", idToken, uid, verificado: true|false}
 *    El administrador marca (o quita) el «domicilio verificado» de un vecino.
 *    El servidor comprueba que quien llama es admin aprobado antes de guardar.
 *
 * Privacidad: la ficha es pública para que el vecino pueda compartirla, así que
 * solo lleva datos no sensibles: nombre corto, estado, mes de alta, conteos e
 * insignia. Nunca correo, teléfono, calle, descripciones ni coordenadas.
 *
 * Las reglas de «alerta útil» y de insignias son las mismas que usa
 * js/estadisticas.js (Panel Pro). Se repiten aquí porque Apps Script no puede
 * importar módulos de la PWA; si cambian, hay que cambiarlas en ambos archivos.
 */

const VERIFICADO_UID_VALIDO = /^[A-Za-z0-9]{1,128}$/;
const VERIFICADO_DIA_MS = 24 * 3600 * 1000;
const VERIFICADO_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// De mayor a menor: la primera condición que se cumple es la insignia.
const VERIFICADO_INSIGNIAS = [
  { nombre: 'Guardián', utiles: 8, dias: 90, clase: 'guardian' },
  { nombre: 'Vecino confiable', utiles: 3, dias: 30, clase: 'confiable' },
  { nombre: 'Colaborador', utiles: 1, dias: 0, clase: 'colaborador' },
  { nombre: 'Nuevo', utiles: 0, dias: 0, clase: 'nuevo' }
];

/* ======================= VISTA ======================= */

function vista_verificado(e) {
  const uid = String((e && e.parameter && e.parameter.uid) || '');
  const titulo = 'Vecino Verificado · AlertaVecinal';
  if (!VERIFICADO_UID_VALIDO.test(uid)) return renderVista_('vista_verificado', { encontrado: false }, titulo);

  const perfil = leerDoc_(`usuarios/${uid}`);
  // Página genérica: no se revela si la cuenta existe, está pendiente o suspendida.
  if (!perfil || perfil.estado !== 'aprobado') return renderVista_('vista_verificado', { encontrado: false }, titulo);

  const alertas = consultar_('alertas', { orden: { campo: 'creado', desc: true }, limite: 500 })
    .filter((a) => a.uid === uid);
  return renderVista_('vista_verificado', armarFicha_(perfil, alertas, new Date()), titulo);
}

/** Calcula todo lo que muestra la ficha. Separado de la vista para poder probarlo. */
function armarFicha_(perfil, alertas, ahora) {
  const utiles = alertas.filter(esAlertaUtil_).length;
  const alta = perfil.creado ? new Date(perfil.creado) : null;
  const dias = alta ? Math.max(0, Math.floor((ahora.getTime() - alta.getTime()) / VERIFICADO_DIA_MS)) : 0;
  const insignia = insigniaVerificado_(utiles, dias);
  const verificadoEn = perfil.verificado && perfil.verificadoEn ? new Date(perfil.verificadoEn) : null;
  return {
    encontrado: true,
    nombreCorto: nombreCorto_(perfil.nombre),
    esAdmin: perfil.rol === 'admin',
    domicilioVerificado: Boolean(perfil.verificado),
    verificadoEn: verificadoEn ? fechaLarga_(verificadoEn) : '',
    miembroDesde: alta ? `${VERIFICADO_MESES[alta.getMonth()]} de ${alta.getFullYear()}` : 'fecha no registrada',
    dias,
    total: alertas.length,
    utiles,
    porcentajeUtil: alertas.length ? Math.round((utiles / alertas.length) * 100) : 0,
    insignia: insignia.nombre,
    claseInsignia: insignia.clase
  };
}

// Una alerta es útil si permite actuar sin pedir más datos (igual que js/estadisticas.js).
function esAlertaUtil_(a) {
  const conUbicacion = typeof a.lat === 'number' && typeof a.lng === 'number';
  const descripcionClara = String(a.descripcion || '').trim().length >= 15;
  return (conUbicacion && descripcionClara) || Boolean(a.foto);
}

function insigniaVerificado_(utiles, dias) {
  for (let i = 0; i < VERIFICADO_INSIGNIAS.length; i++) {
    const ins = VERIFICADO_INSIGNIAS[i];
    if (utiles >= ins.utiles && dias >= ins.dias) return ins;
  }
  return VERIFICADO_INSIGNIAS[VERIFICADO_INSIGNIAS.length - 1];
}

// «María López Hernández» → «María L.»  (sin apellidos completos en una página pública)
function nombreCorto_(nombre) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return 'Vecino';
  return partes.length === 1 ? partes[0] : `${partes[0]} ${partes[1].charAt(0).toUpperCase()}.`;
}

function fechaLarga_(fecha) {
  return `${fecha.getDate()} de ${VERIFICADO_MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

/* ======================= ACCIÓN (solo admin) ======================= */

function accion_verificar(d) {
  const sesion = verificarSesion_(d.idToken, { rol: 'admin' });
  const uid = String(d.uid || '');
  if (!VERIFICADO_UID_VALIDO.test(uid)) return { ok: false, error: 'uid no válido' };
  if (typeof d.verificado !== 'boolean') return { ok: false, error: 'Falta indicar verificado: true o false' };

  const perfil = leerDoc_(`usuarios/${uid}`);
  if (!perfil) return { ok: false, error: 'El vecino no existe' };
  if (perfil.estado !== 'aprobado') return { ok: false, error: 'Solo se verifica a vecinos aprobados' };

  actualizarDoc_(`usuarios/${uid}`, {
    verificado: d.verificado,
    verificadoEn: new Date(),          // hora del servidor, no la del navegador
    verificadoPor: sesion.uid
  });
  return { ok: true, uid, verificado: d.verificado };
}
