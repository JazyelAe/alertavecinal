/**
 * Boletin.gs · Vista generada en el SERVIDOR: «Boletín público de alertas».  (Dueño: Jaziel)
 *
 * GET …/exec?vista=boletin
 * Apps Script lee las alertas de Firestore con la cuenta de servicio, calcula los
 * conteos y arma el HTML aquí mismo (plantilla vista_boletin.html). El navegador
 * recibe la página ya con los datos; no ejecuta JavaScript para obtenerlos.
 *
 * Privacidad: las reglas de Firestore solo dejan ver alertas a vecinos aprobados.
 * Este boletín es público, así que NO muestra nombres, descripciones, calles ni
 * ubicaciones exactas: solo el tipo, la zona aproximada y la hora.
 */

const BOLETIN_TIPOS = {
  robo: 'Robo', medica: 'Emergencia médica', gas: 'Fuga de gas', otro: 'Otro'
};

function vista_boletin(e) {
  const ahora = new Date();
  const hace7dias = new Date(ahora.getTime() - 7 * 24 * 3600 * 1000);
  const alertas = consultar_('alertas', {
    desde: { campo: 'creado', fecha: hace7dias }, orden: { campo: 'creado', desc: true }, limite: 300
  });
  return renderVista_('vista_boletin', armarBoletin_(alertas, ahora), 'Boletín de alertas · AlertaVecinal');
}

/** Calcula todo lo que muestra el boletín. Separado de la vista para poder probarlo. */
function armarBoletin_(alertas, ahora) {
  const hace24h = ahora.getTime() - 24 * 3600 * 1000;
  const conteo = (lista) => Object.keys(BOLETIN_TIPOS).map((tipo) => ({
    tipo, nombre: BOLETIN_TIPOS[tipo], total: lista.filter((a) => a.tipo === tipo).length
  }));
  const ultimas24h = alertas.filter((a) => new Date(a.creado).getTime() >= hace24h);
  return {
    total7d: alertas.length,
    total24h: ultimas24h.length,
    porTipo24h: conteo(ultimas24h),
    porTipo7d: conteo(alertas),
    // Solo datos públicos: nada de nombre, descripción, calle ni coordenada exacta.
    lista: ultimas24h.map((a) => ({
      tipo: BOLETIN_TIPOS[a.tipo] ? a.tipo : 'otro',
      nombre: BOLETIN_TIPOS[a.tipo] || 'Otro',
      zona: zonaAproximada_(a),
      hace: haceCuanto_(new Date(a.creado), ahora),
      sinSenal: a.origen === 'sin-senal'
    }))
  };
}

/**
 * «Av. Juárez 152, Centro, Puebla» → «Centro, Puebla» (se quita la calle y el número).
 * Sin dirección, usa las coordenadas redondeadas a 2 decimales (≈ 1 km).
 */
function zonaAproximada_(alerta) {
  const partes = String(alerta.direccion || '').split(',').map((p) => p.trim()).filter(Boolean);
  if (partes.length >= 2 && !/^-?\d+(\.\d+)?$/.test(partes[0])) return partes.slice(1).join(', ');
  if (typeof alerta.lat === 'number' && typeof alerta.lng === 'number') {
    return `Zona ${redondearCoord_(alerta.lat, 2)}, ${redondearCoord_(alerta.lng, 2)}`;
  }
  return 'Zona no indicada';
}

function haceCuanto_(fecha, ahora) {
  const min = Math.max(0, Math.round((ahora.getTime() - fecha.getTime()) / 60000));
  if (min < 1) return 'justo ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
}
