// Simulador de Google Apps Script para probar el backend en Node, sin subir nada a Google.
// Carga los .gs en un mismo contexto (como hace Apps Script) e imita los servicios que usan:
// ContentService, HtmlService (con plantillas <? ?>, <?= ?> y <?!= ?>), PropertiesService,
// CacheService, Session, Utilities y UrlFetchApp con un Firestore EN MEMORIA.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CARPETA = new URL('../', import.meta.url);

function salida(contenido) {
  const o = { contenido, titulo: null, meta: {}, mime: null };
  o.setMimeType = (m) => { o.mime = m; return o; };
  o.setTitle = (t) => { o.titulo = t; return o; };
  o.addMetaTag = (k, v) => { o.meta[k] = v; return o; };
  o.setXFrameOptionsMode = () => o;
  o.getContent = () => contenido;
  return o;
}

const escapar = (t) => String(t == null ? '' : t)
  .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Convierte una plantilla de Apps Script en una función de JavaScript (igual que HtmlService).
function compilarPlantilla(texto, contexto) {
  let codigo = 'var __s = "";\n';
  const partes = texto.split(/(<\?(?:!=|=)?[\s\S]*?\?>)/);
  for (const p of partes) {
    if (p.startsWith('<?!=')) codigo += `__s += (${p.slice(4, -2)});\n`;
    else if (p.startsWith('<?=')) codigo += `__s += __esc(${p.slice(3, -2)});\n`;
    else if (p.startsWith('<?')) codigo += p.slice(2, -2) + '\n';
    else if (p) codigo += `__s += ${JSON.stringify(p)};\n`;
  }
  return vm.runInContext(`(function (datos, __esc) { ${codigo} return __s; })`, contexto);
}

/** Firestore en memoria con la API REST mínima que usa Comun.gs. */
export function firestoreFalso(proyecto = 'demo') {
  const docs = new Map();   // ruta → fields
  const base = `https://firestore.googleapis.com/v1/projects/${proyecto}/databases/(default)/documents`;
  const resp = (codigo, cuerpo) => ({ getResponseCode: () => codigo, getContentText: () => JSON.stringify(cuerpo ?? {}) });
  const tokensValidos = new Map();   // idToken → uid (simula que Firestore valida la firma)
  return {
    docs, tokensValidos,
    poner(ruta, fields) { docs.set(ruta, fields); },
    fetch(url, opciones = {}) {
      if (url === 'https://oauth2.googleapis.com/token') return resp(200, { access_token: 'token-servicio' });
      const auth = (opciones.headers || {}).Authorization || '';
      const esServicio = auth === 'Bearer token-servicio';
      const [ruta, query = ''] = url.replace(base, '').replace(/^\//, '').split('?');
      const metodo = (opciones.method || 'get').toLowerCase();
      if (ruta.endsWith(':runQuery')) {
        const q = JSON.parse(opciones.payload).structuredQuery;
        const coleccion = q.from[0].collectionId;
        let lista = [...docs.entries()].filter(([r]) => r.split('/')[0] === coleccion && r.split('/').length === 2);
        if (q.where) {
          const f = q.where.fieldFilter;
          lista = lista.filter(([, d]) => d[f.field.fieldPath] && d[f.field.fieldPath].timestampValue >= f.value.timestampValue);
        }
        if (q.orderBy) {
          const campo = q.orderBy[0].field.fieldPath, desc = q.orderBy[0].direction === 'DESCENDING';
          lista.sort(([, a], [, b]) => (a[campo].timestampValue < b[campo].timestampValue ? -1 : 1) * (desc ? -1 : 1));
        }
        if (q.limit) lista = lista.slice(0, q.limit);
        return resp(200, lista.map(([r, f]) => ({ document: { name: `${base}/${r}`, fields: f } })));
      }
      if (metodo === 'get') {
        if (!esServicio) {   // con token de usuario: solo puede leer su propio perfil (como las reglas)
          const uid = tokensValidos.get(auth.replace('Bearer ', ''));
          if (!uid || ruta !== `usuarios/${uid}`) return resp(403, { error: 'PERMISSION_DENIED' });
        }
        return docs.has(ruta) ? resp(200, { name: `${base}/${ruta}`, fields: docs.get(ruta) }) : resp(404, {});
      }
      if (!esServicio) return resp(403, {});
      if (metodo === 'patch') {
        if (query.includes('currentDocument.exists=false') && docs.has(ruta)) return resp(409, { error: 'ALREADY_EXISTS' });
        if (query.includes('currentDocument.exists=true') && !docs.has(ruta)) return resp(404, {});
        const nuevos = JSON.parse(opciones.payload).fields;
        docs.set(ruta, query.includes('updateMask') ? { ...docs.get(ruta), ...nuevos } : nuevos);
        return resp(200, { name: `${base}/${ruta}`, fields: docs.get(ruta) });
      }
      if (metodo === 'delete') { docs.delete(ruta); return resp(200, {}); }
      return resp(400, {});
    }
  };
}

/**
 * Crea un entorno de Apps Script con los archivos indicados (por ejemplo ['Comun.gs', 'Boletin.gs']).
 * opciones: { propiedades, firestore }
 */
export function crearEntorno(archivos, opciones = {}) {
  const propiedades = opciones.propiedades || {};
  const firestore = opciones.firestore || firestoreFalso();
  const entorno = {
    console: { log: console.log, info: () => {}, warn: () => {}, error: () => {} },
    ContentService: { createTextOutput: salida, MimeType: { JSON: 'application/json' } },
    HtmlService: {
      createHtmlOutput: salida,
      createHtmlOutputFromFile: (f) => salida(readFileSync(new URL(f + '.html', CARPETA), 'utf8')),
      createTemplateFromFile: (f) => {
        const plantilla = { evaluate: () => salida(compilarPlantilla(readFileSync(new URL(f + '.html', CARPETA), 'utf8'), entorno)(plantilla.datos, escapar)) };
        return plantilla;
      },
      XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' }
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => propiedades[k] || null }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
    Session: { getScriptTimeZone: () => 'America/Mexico_City' },
    Utilities: {
      base64DecodeWebSafe: (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'),
      base64EncodeWebSafe: (s) => Buffer.from(s).toString('base64url'),
      computeRsaSha256Signature: () => 'firma',
      newBlob: (b) => ({ getDataAsString: () => Buffer.from(b).toString('utf8') }),
      formatDate: (d) => d.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
    },
    UrlFetchApp: { fetch: (url, o) => firestore.fetch(url, o), fetchAll: (lista) => lista.map((p) => firestore.fetch(p.url, p)) },
    Logger: { log: () => {} }
  };
  vm.createContext(entorno);
  for (const archivo of archivos) vm.runInContext(readFileSync(new URL(archivo, CARPETA), 'utf8'), entorno, { filename: archivo });
  return entorno;
}

/** Token de sesión falso con el uid indicado (la "firma" la valida el Firestore falso). */
export function tokenDe(uid, firestore) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const token = `${b64({ alg: 'RS256' })}.${b64({ user_id: uid })}.firma-${uid}`;
  firestore.tokensValidos.set(token, uid);
  return token;
}

export const CUENTA_FALSA = JSON.stringify({ project_id: 'demo', client_email: 'backend@demo.iam', private_key: 'no-es-real' });
