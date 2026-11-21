/**
 * SinSenal.gs · Backend de la aportación «Alerta sin señal».  (Dueño: Jaziel)
 *
 * POST {accion: 'alerta_sin_senal', idToken, alertas: [{idCola, datos, guardada}]}
 *
 * Cuando un vecino envía una alerta sin conexión, la app la guarda en IndexedDB con
 * un id propio (idCola). Al volver la red, el service worker o la página la mandan
 * AQUÍ en lugar de escribir directo a Firestore. El servidor:
 *   1. Verifica que la sesión sea real y que el vecino esté aprobado.
 *   2. Valida cada alerta igual que las reglas de Firestore.
 *   3. Evita duplicados: el id del documento es el idCola y solo se crea si no existe.
 *   4. Pone la HORA DEL SERVIDOR y el uid de la sesión (el teléfono no puede falsearlos),
 *      y marca enviadaSinSenal: true y guardadaEn (cuándo se guardó en el teléfono).
 *   5. Si existe accion_push (Push.gs, de Luis), avisa a los vecinos.
 * Responde {ok, aceptadas:[ids], repetidas:[ids], rechazadas:[{id, error}], pushEnviado}.
 */

const SIN_SENAL_TIPOS = ['robo', 'medica', 'gas', 'otro'];
const SIN_SENAL_MAXIMO = 20;   // alertas por petición

function accion_alerta_sin_senal(peticion) {
  const sesion = verificarSesion_(peticion.idToken);
  const alertas = Array.isArray(peticion.alertas) ? peticion.alertas.slice(0, SIN_SENAL_MAXIMO) : [];
  const respuesta = { ok: true, aceptadas: [], repetidas: [], rechazadas: [], pushEnviado: false };

  alertas.forEach((alerta) => {
    const idCola = alerta && alerta.idCola;
    try {
      if (!/^sin-senal-[A-Za-z0-9]{6,40}$/.test(String(idCola || ''))) throw new Error('idCola no válido');
      const documento = alertaSinSenal_(alerta.datos, alerta.guardada, sesion);
      if (crearDoc_(`alertas/${idCola}`, documento, { soloSiNoExiste: true })) respuesta.aceptadas.push(idCola);
      else respuesta.repetidas.push(idCola);   // ya la había enviado la página o el service worker
    } catch (error) {
      respuesta.rechazadas.push({ id: idCola || null, error: mensaje_(error) });
    }
  });

  // Push a los demás vecinos, si Luis ya subió Push.gs a este mismo backend.
  const push = funcionGlobal_('accion_push');
  if (push && respuesta.aceptadas.length) {
    respuesta.aceptadas.forEach((id) => {
      try { push({ idToken: peticion.idToken, tipo: 'alerta', id }); } catch (error) { console.warn('Push sin señal', id, error); }
    });
    respuesta.pushEnviado = true;
  }
  return respuesta;
}

/** Valida los datos que mandó el teléfono y arma el documento que se guarda (mismas reglas que firestore.rules). */
function alertaSinSenal_(datos, guardada, sesion) {
  const d = datos || {};
  if (SIN_SENAL_TIPOS.indexOf(d.tipo) === -1) throw new Error('Tipo de alerta no válido');
  const descripcion = String(d.descripcion || '').trim();
  if (!descripcion || descripcion.length > 500) throw new Error('La descripción debe tener de 1 a 500 caracteres');
  const documento = {
    tipo: d.tipo,
    descripcion,
    uid: sesion.uid,                                              // el de la sesión, no el que diga el teléfono
    nombre: sesion.perfil.nombre || String(d.nombre || '').slice(0, 80),
    creado: new Date(),                                           // hora del SERVIDOR
    origen: 'sin-senal',
    enviadaSinSenal: true
  };
  if (d.lat != null || d.lng != null) {
    const lat = Number(d.lat), lng = Number(d.lng);
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('Ubicación no válida');
    documento.lat = lat;
    documento.lng = lng;
  }
  if (d.direccion) documento.direccion = String(d.direccion).slice(0, 200);
  const fechaCola = new Date(Number(guardada));
  if (!isNaN(fechaCola.getTime())) documento.guardadaEn = fechaCola;
  return documento;
}
