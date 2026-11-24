/**
 * Push.gs · Notificaciones push desde el backend.  (Dueño: Luis)
 *
 * POST {accion: 'push', idToken, tipo: 'aviso' | 'alerta', id}
 * (un POST SIN "accion" también llega aquí: así llamaba js/push.js al intermediario viejo).
 *
 * Por qué en el servidor: enviar un push real con Firebase Cloud Messaging (API v1)
 * exige la clave privada de la cuenta de servicio, y esa clave NO puede ir en la app
 * (en GitHub Pages todo el código es público). Aquí vive en "Propiedades del script".
 *
 * Qué hace:
 *   1. Verifica que la sesión sea real y que el vecino esté aprobado (admin si es un aviso).
 *   2. Lee el aviso o la alerta con la cuenta de servicio: debe existir, ser de quien llama
 *      y tener como máximo 15 minutos. NUNCA recibe el texto: lo toma de Firestore.
 *   3. Evita repetir el mismo push con el documento envios/<tipo>-<id>, que solo se crea una vez
 *      (es el mismo que usaba scripts/apps-script/Codigo.gs, así el viejo y el nuevo no envían doble).
 *   4. Envía un mensaje SOLO DE DATOS a todos los tokens de la colección "tokens", menos a los
 *      del autor. sw-push.js decide cómo mostrarlo (título, icono, vibración según el tipo).
 *   5. Borra los tokens que FCM dice que ya no existen.
 * Responde {ok, enviadas, fallidas, tokensBorrados}, {ok, enviadas: 0, nota} o {ok, repetido: true, enviadas: 0}.
 *
 * Migrado de scripts/apps-script/Codigo.gs: misma entrada y salida, pero usando el núcleo de
 * Comun.gs (sesión, cuenta de servicio y Firestore) en lugar de repetir esas funciones.
 */

const PUSH_MINUTOS_MAXIMOS = 15;
const PUSH_ID_VALIDO = /^[A-Za-z0-9_-]{1,64}$/;
const PUSH_TIPOS_ALERTA = { robo: 'Robo', medica: 'Emergencia médica', gas: 'Fuga de gas', otro: 'Alerta' };

function accion_push(peticion) {
  const { idToken, tipo, id } = peticion || {};
  if (!idToken || !id || (tipo !== 'aviso' && tipo !== 'alerta')) throw new Error('Petición incompleta');
  if (!PUSH_ID_VALIDO.test(String(id))) throw new Error('Id inválido');

  // 1) Sesión real y aprobada. Los avisos solo los manda el administrador.
  const { uid } = verificarSesion_(idToken, tipo === 'aviso' ? { rol: 'admin' } : null);

  // 2) El documento existe, es de quien llama y es reciente.
  const doc = leerDoc_(`${tipo === 'aviso' ? 'avisos' : 'alertas'}/${id}`);
  if (!doc) throw new Error('No existe el documento');
  if (doc.uid !== uid) throw new Error('El documento no es del usuario');
  const creado = new Date(doc.creado).getTime();
  if (!creado || Date.now() - creado > PUSH_MINUTOS_MAXIMOS * 60 * 1000) throw new Error('Demasiado antiguo');

  // 3) Marca de "ya enviado": solo se puede crear una vez.
  if (!crearDoc_(`envios/${tipo}-${id}`, { uid, fecha: new Date() }, { soloSiNoExiste: true })) {
    return { ok: true, repetido: true, enviadas: 0 };
  }

  // 4) Mensaje y destinatarios.
  const datos = datosPush_(tipo, id, doc);
  const tokens = consultar_('tokens').filter((t) => t.uid !== uid)
    .map((t) => ({ id: t.id, token: t.token || t.id }));
  if (!tokens.length) return { ok: true, enviadas: 0, nota: 'No hay otros dispositivos registrados' };

  const url = `https://fcm.googleapis.com/v1/projects/${proyecto_()}/messages:send`;
  const acceso = tokenDeAcceso_();
  const respuestas = UrlFetchApp.fetchAll(tokens.map((t) => ({
    url, method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + acceso },
    payload: JSON.stringify({ message: { token: t.token, data: datos,
      webpush: { headers: { Urgency: 'high', TTL: '3600' } } } })
  })));

  let enviadas = 0;
  const invalidos = [];
  respuestas.forEach((r, i) => {
    if (r.getResponseCode() === 200) enviadas++;
    else if (/UNREGISTERED|registration-token-not-registered|INVALID_ARGUMENT/.test(r.getContentText())) invalidos.push(tokens[i].id);
  });

  // 5) Limpieza de tokens que ya no sirven (navegador desinstalado o permiso retirado).
  invalidos.forEach((docId) => borrarDoc_(`tokens/${encodeURIComponent(docId)}`));

  return { ok: true, enviadas, fallidas: tokens.length - enviadas, tokensBorrados: invalidos.length };
}

/** Datos del mensaje. FCM solo acepta textos en "data", por eso todo va como string. */
function datosPush_(tipo, id, doc) {
  if (tipo === 'aviso') {
    return { titulo: `Aviso: ${doc.titulo || 'AlertaVecinal'}`,
      cuerpo: String(doc.mensaje || `Enviado por ${doc.autor || 'el administrador'}`),
      url: './', tag: `aviso-${id}`, tipo: 'aviso' };
  }
  return { titulo: `${PUSH_TIPOS_ALERTA[doc.tipo] || 'Alerta'} · AlertaVecinal`,
    cuerpo: [doc.descripcion, doc.direccion].filter(Boolean).join(' · '),
    url: `./?alerta=${id}`, tag: `alerta-${id}`, alertaId: String(id),
    tipo: PUSH_TIPOS_ALERTA[doc.tipo] ? doc.tipo : 'otro' };
}

/* Prueba manual desde el editor de Apps Script: Ejecutar → probarPush */
function probarPush() {
  const tokens = consultar_('tokens');
  Logger.log(`Proyecto ${proyecto_()}: ${tokens.length} token(s) registrados. accion_push lista.`);
}
