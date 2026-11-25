"""Genera los PDF individuales de Yeudiel: SP4, SP5, SP6 y SP7.

Uso (desde la raíz del repo):
    python docs/individual/yeudiel/capturas.py      # una vez: toma las capturas
    python docs/individual/yeudiel/generar_pdfs.py  # genera entregables/SP*_Gonzalez.pdf
"""
import json
import os
import sys
from xml.sax.saxutils import escape

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, "..", "..", ".."))
sys.path.insert(0, os.path.join(RAIZ, "docs", "claude-kit", "tools"))
from utp_doc import (build_pdf, estilos, tabla, enlace, figura, GUINDA)  # noqa: E402
from reportlab.lib.colors import HexColor  # noqa: E402
from reportlab.lib.styles import ParagraphStyle  # noqa: E402
from reportlab.platypus import Paragraph, Preformatted, Spacer, PageBreak, KeepTogether  # noqa: E402

CAP = os.path.join(AQUI, "capturas")
EVI = os.path.join(RAIZ, "docs", "producto2", "evidencias")
ENT = os.path.join(RAIZ, "entregables")
ALUMNO, MATRICULA = "Gonzalez Barrios Yeudiel Nain", "2311081344"
SUB = "Actividad Desarrollo · Unidad II – Desarrollo de aplicaciones web progresivas"
APP = "https://jazyelae.github.io/alertavecinal/"
REPO = "https://github.com/JazyelAe/alertavecinal"
EJEMPLO = APP + "docs/individual/yeudiel/ejemplo/"
BACKEND = ("https://script.google.com/macros/s/AKfycbyA-8YNUHxTZ0XILx0vCNW0PV-lX_SlT-"
           "zDDEMG_7wUcgRelPpH_9_MfC0GzfSZihiJkg/exec")
with open(os.path.join(CAP, "verificacion.json"), encoding="utf-8") as f:
    MED = json.load(f)

s = estilos()
CODIGO = ParagraphStyle("codigo", fontName="Courier", fontSize=7.3, leading=9.4,
                        textColor=HexColor("#1b263b"), backColor=HexColor("#F3F4F7"),
                        borderColor=HexColor("#DDDDDD"), borderWidth=0.5, borderPadding=6,
                        leftIndent=6, rightIndent=6, spaceBefore=4, spaceAfter=10)
REF = ParagraphStyle("ref", parent=s["body"], leftIndent=18, firstLineIndent=-18, alignment=0)


# Courier (fuente PDF estándar) no trae estos caracteres: se sustituyen solo en el PDF.
SUSTITUTOS = {"→": "->", "✔": "(v)", "🏠": "(casa)", "⬇": "v", "✓": "(v)"}
MAX_COL = 98  # caracteres por línea que caben en el ancho útil con Courier 7.3


def _ajustar(texto):
    """Sustituye glifos sin soporte y parte las líneas largas con sangría de continuación."""
    for a, b in SUSTITUTOS.items():
        texto = texto.replace(a, b)
    salida = []
    for linea in texto.split("\n"):
        sangria = " " * (len(linea) - len(linea.lstrip()) + 4)
        while len(linea) > MAX_COL:
            corte = linea.rfind(" ", len(sangria), MAX_COL)
            corte = corte if corte > len(sangria) else MAX_COL
            salida.append(linea[:corte])
            linea = sangria + linea[corte:].lstrip()
        salida.append(linea)
    return "\n".join(salida)


class Doc:
    """Acumula el cuerpo de un PDF y numera las figuras."""

    def __init__(self):
        self.c, self.n, self.num = [], 0, {}

    def h1(self, t): self.c.append(Paragraph(t, s["h1"]))
    def h2(self, t): self.c.append(Paragraph(t, s["h2"]))
    def p(self, t): self.c.append(Paragraph(t, s["body"]))

    def li(self, items):
        for t in items:
            self.c.append(Paragraph("• " + t, s["bullet"]))

    def code(self, texto, pie=None):
        bloque = [Preformatted(_ajustar(texto.strip("\n")), CODIGO)]
        if pie:
            bloque.insert(0, Paragraph(f"<i>{pie}</i>", s["bullet"]))
        self.c.append(KeepTogether(bloque))

    def fig(self, clave, ruta, pie, ancho=430, alto=420):
        self.n += 1
        self.num[clave] = self.n
        self.c.append(figura(ruta, f"Figura {self.n}. {pie}", ancho=ancho, alto_max=alto))

    def f(self, clave): return f"Figura {self.num[clave]}"
    def t(self, filas, anchos): self.c.extend([tabla(filas, anchos), Spacer(1, 10)])
    def salto(self): self.c.append(PageBreak())

    def refs(self, lista):
        self.h1("Referencias")
        for r in lista:
            self.c.append(Paragraph(r, REF))


def cap(n): return os.path.join(CAP, n)
def evi(n): return os.path.join(EVI, n)


def mdn(titulo, ruta):
    return (f"MDN Web Docs. (s. f.). <i>{titulo}</i>. Mozilla. "
            + enlace("https://developer.mozilla.org/" + ruta))


R_CACHE = mdn("Cache", "en-US/docs/Web/API/Cache")
R_CSTORAGE = mdn("CacheStorage", "es/docs/Web/API/CacheStorage")
R_PWA = mdn("Aplicaciones web progresivas", "es/docs/Web/Progressive_web_apps")
R_PUSH = mdn("Push API", "es/docs/Web/API/Push_API")
R_NOTIF = mdn("Notifications API", "es/docs/Web/API/Notifications_API")
R_SHOW = mdn("ServiceWorkerRegistration: showNotification() method",
             "en-US/docs/Web/API/ServiceWorkerRegistration/showNotification")
R_COOK = ("Archibald, J. (2014). <i>The offline cookbook</i>. web.dev. "
          + enlace("https://web.dev/articles/offline-cookbook"))
R_LEARN = "Google. (s. f.). <i>Learn PWA</i>. web.dev. " + enlace("https://web.dev/learn/pwa")
R_FCM = ("Google. (s. f.). <i>Set up a JavaScript Firebase Cloud Messaging client app</i>. Firebase. "
         + enlace("https://firebase.google.com/docs/cloud-messaging/js/client"))
R_REST = ("Google. (s. f.). <i>Use the Cloud Firestore REST API</i>. Firebase. "
          + enlace("https://firebase.google.com/docs/firestore/use-rest-api"))
R_TPL = ("Google. (s. f.). <i>HTML Service: Templated HTML</i>. Google Apps Script. "
         + enlace("https://developers.google.com/apps-script/guides/html/templates"))
R_WEB = ("Google. (s. f.). <i>Web Apps</i>. Google Apps Script. "
         + enlace("https://developers.google.com/apps-script/guides/web"))
R_REPO = ("Serrano Arana, J. J., Xicali Diaz, L. A. y Gonzalez Barrios, Y. N. (2026). <i>AlertaVecinal</i> "
          "[Repositorio de código fuente]. GitHub. " + enlace(REPO))


def leer(ruta, desde, hasta):
    """Devuelve las líneas [desde, hasta] (1-based) de un archivo del repo."""
    with open(os.path.join(RAIZ, ruta), encoding="utf-8") as fh:
        return "".join(fh.readlines()[desde - 1:hasta])


def pdf(nombre, titulo, encabezado, d):
    salida = os.path.join(ENT, nombre)
    build_pdf(salida, titulo=titulo, subtitulo=SUB, cuerpo=d.c, encabezado=encabezado,
              alumno=ALUMNO, matricula=MATRICULA)
    print("✔", salida)


# =====================================================================
#  SP4 · API CACHÉ
# =====================================================================
def sp4():
    d = Doc()
    d.h1("1. Introducción")
    d.p("Una aplicación web progresiva (PWA) debe abrir rápido y seguir funcionando aunque la conexión sea mala "
        "o no exista. La pieza que lo hace posible es la <b>API Cache</b>, usada desde un <b>service worker</b>. "
        "En este documento explico qué es la caché de una PWA, cómo funciona, las estrategias más comunes, los "
        "métodos principales de la API y cómo se implementan en <b>AlertaVecinal</b>, la PWA de seguridad vecinal "
        "de nuestro equipo. Además incluyo un ejemplo mínimo propio que usa los 12 métodos principales.")

    d.h1("2. ¿Qué es la caché en una PWA y cómo funciona?")
    d.p("La caché de una PWA es un almacén del navegador donde se guardan pares <b>petición → respuesta</b> "
        "(por ejemplo, <i>index.html</i> y su contenido). A diferencia de la caché HTTP normal, que controla el "
        "navegador, la API Cache la controla el programador desde JavaScript: decide qué se guarda, cuándo se "
        "actualiza y cuándo se borra. Se accede con el objeto global <font name='Courier'>caches</font> "
        "(interfaz <i>CacheStorage</i>), que contiene varias cachés con nombre (interfaz <i>Cache</i>).")
    d.p("El <b>service worker</b> es un script que el navegador ejecuta en segundo plano y que actúa como un "
        "<b>proxy</b> entre la página y la red: cada petición de la página pasa por su evento "
        "<font name='Courier'>fetch</font>, y ahí se decide si responder desde la caché o desde la red. Su ciclo "
        "de vida tiene tres momentos clave:")
    d.t([["Evento", "Qué pasa", "En AlertaVecinal (sw.js)"],
         ["install", "Se ejecuta una vez por versión del service worker. Se guarda el <i>app shell</i>.",
          "caches.open('alertavecinal-v7') + cache.addAll(APP_SHELL) y cache.add() de los opcionales."],
         ["activate", "La nueva versión toma el control. Se borran las cachés viejas.",
          "caches.keys() + caches.delete() de cualquier 'alertavecinal-*' que no sea la actual."],
         ["fetch", "Cada petición GET de la página pasa por aquí.",
          "Elige la estrategia según el tipo de recurso (HTML, estáticos, mosaicos del mapa)."]],
        [70, 200, 234])
    d.p("Las cachés se nombran con una <b>versión</b> (<font name='Courier'>alertavecinal-v7</font>). Cuando "
        "cambia algún archivo de la app se sube la versión en <font name='Courier'>sw.js</font>; el navegador "
        "detecta el cambio, instala la versión nueva y en <i>activate</i> elimina la anterior. Así el usuario "
        "siempre recibe archivos actualizados sin quedarse con copias viejas.")

    d.h1("3. Estrategias de caché")
    d.t([["Estrategia", "Cómo funciona", "Ventaja", "Uso en AlertaVecinal"],
         ["Cache first", "Busca en caché; si no está, va a la red y guarda una copia.",
          "Muy rápida; funciona offline.", "CSS, JS, íconos y librerías de CDN con versión fija."],
         ["Network first", "Intenta la red; si falla usa la caché; si tampoco, una página de respaldo.",
          "Contenido siempre actualizado cuando hay red.", "Páginas HTML (navegación) con respaldo en offline.html."],
         ["Stale-while-revalidate", "Responde con la copia guardada y en paralelo la actualiza desde la red.",
          "Rápida y se mantiene al día.", "Mosaicos del mapa de OpenStreetMap (máximo 120)."],
         ["Solo caché", "Responde únicamente desde la caché.", "Predecible; nunca usa red.",
          "No se usa (el app shell se precachea en install)."],
         ["Solo red", "No intercepta; el navegador va directo a la red.", "Datos siempre en vivo.",
          "Firestore, Authentication, googleapis y Nominatim."]],
        [88, 160, 106, 150])
    d.code(leer("sw.js", 147, 167), "Fragmento de sw.js · estrategia Cache First")

    d.h1("4. Métodos principales de la API Cache")
    d.p("La API tiene dos niveles: <b>CacheStorage</b> (<font name='Courier'>caches</font>), que administra las "
        "cachés por nombre, y <b>Cache</b>, que administra las entradas de una caché. Todos los métodos son "
        "asíncronos y devuelven promesas. La última columna indica dónde se usa cada uno en el repositorio.")
    c = lambda x: f"<font name='Courier'>{escape(x)}</font>"
    d.t([["#", "Método", "Qué hace", "Devuelve", "Dónde se usa (repositorio)"],
         ["1", c("caches.open(nombre)"), "Abre la caché con ese nombre; si no existe, la crea.", "Promise&lt;Cache&gt;",
          "sw.js (install, estrategias) · cache-demo.js · ejemplo.js"],
         ["2", c("caches.keys()"), "Lista los nombres de todas las cachés del origen.", "Promise&lt;string[]&gt;",
          "sw.js (activate) · demo-cache · ejemplo.js"],
         ["3", c("caches.match(pet)"), "Busca una petición en todas las cachés.", "Promise&lt;Response|undefined&gt;",
          "sw.js (cacheFirst) · sw-ejemplo.js · ejemplo.js"],
         ["4", c("caches.has(nombre)"), "Indica si existe una caché con ese nombre.", "Promise&lt;boolean&gt;",
          "cache-demo.js · ejemplo.js"],
         ["5", c("caches.delete(nombre)"), "Borra una caché completa.", "Promise&lt;boolean&gt;",
          "sw.js (activate) · cache-demo.js · ejemplo.js"],
         ["6", c("cache.add(url)"), "Descarga la URL y la guarda (fetch + put).", "Promise&lt;void&gt;",
          "sw.js (opcionales) · cache-demo.js · ejemplo.js"],
         ["7", c("cache.addAll(urls)"), "Descarga y guarda varias URL; si una falla, no guarda ninguna.",
          "Promise&lt;void&gt;", "sw.js (app shell) · sw-ejemplo.js · ejemplo.js"],
         ["8", c("cache.put(pet, resp)"), "Guarda una respuesta ya obtenida o creada por el código.",
          "Promise&lt;void&gt;", "sw.js (estrategias) · cache-demo.js · ejemplo.js"],
         ["9", c("cache.match(pet)"), "Busca una petición solo en esa caché.", "Promise&lt;Response|undefined&gt;",
          "sw.js (networkFirst, SWR) · cache-demo.js"],
         ["10", c("cache.matchAll()"), "Devuelve todas las respuestas (o las que coinciden).",
          "Promise&lt;Response[]&gt;", "ejemplo.js"],
         ["11", c("cache.keys()"), "Lista las peticiones guardadas en esa caché.", "Promise&lt;Request[]&gt;",
          "sw.js (limitarCache) · cache-demo.js · ejemplo.js"],
         ["12", c("cache.delete(pet)"), "Borra una entrada concreta.", "Promise&lt;boolean&gt;",
          "sw.js (limitarCache) · cache-demo.js · ejemplo.js"]],
        [24, 104, 148, 90, 138])
    d.code(leer("sw.js", 80, 117), "Fragmento de sw.js · install (open, addAll, add) y activate (keys, delete)")
    d.code(leer("sw.js", 188, 219), "Fragmento de sw.js · stale-while-revalidate y límite de mosaicos (match, put, keys, delete)")

    d.h1("5. Implementación en AlertaVecinal")
    d.p("La aplicación publicada registra <font name='Courier'>sw.js</font> en la raíz. Al abrir la app, el "
        f"service worker queda <b>{escape(MED['sw_estado'])}</b> con la caché <b>{escape(MED['sw_version'])}</b>, que "
        f"contenía <b>{MED['shell_entradas']}</b> entradas al tomar estas capturas. La página "
        f"{enlace(APP + 'demo-cache.html', 'demo-cache.html')} ejecuta cada método en el navegador y muestra el "
        "resultado, como en DevTools → Application → Cache Storage.")
    d.fig("keys", cap("sp4-01-caches-keys.png"), "demo-cache.html: caches.keys() lista la caché de la versión actual.")
    d.fig("ckeys", cap("sp4-02-cache-keys.png"), "cache.keys() muestra las entradas del app shell guardadas en install.", alto=440)
    d.fig("match", cap("sp4-03-cache-match.png"), "cache.match('offline.html') devuelve la respuesta guardada (status 200).")
    d.fig("put", cap("sp4-04-cache-put.png"), "cache.put() guarda una respuesta JSON creada en el código, sin usar la red.")
    d.fig("offline", cap("pwa-02-sin-conexion.png"),
          "Con la red desconectada (modo sin conexión del navegador), la app abre desde la caché y muestra «Sin conexión».")
    d.fig("offhtml", cap("pwa-03-offline-html.png"),
          "Sin conexión y sin copia de la página pedida, networkFirst responde con offline.html.")

    d.h1("6. Ejemplo mínimo propio")
    d.p("Para practicar los 12 métodos fuera de la app hice una PWA mínima en "
        "<font name='Courier'>docs/individual/yeudiel/ejemplo/</font>: una página con su propio manifest y su "
        "propio service worker (<font name='Courier'>sw-ejemplo.js</font>), cuyo alcance es solo esa carpeta para "
        "no interferir con la app. Usa una caché aparte llamada <font name='Courier'>ejemplo-yeudiel-v1</font>.")
    d.code(leer("docs/individual/yeudiel/ejemplo/ejemplo.js", 24, 70), "Fragmento de ejemplo.js · los 12 métodos numerados")
    d.fig("ej1", cap("ej-01-guardar.png"), "Ejemplo propio: open + addAll + add + put guardan 4 entradas.", alto=360)
    d.fig("ej2", cap("ej-02-listar.png"), "Ejemplo propio: caches.keys() y cache.keys().", alto=360)
    d.fig("ej3", cap("ej-03-buscar.png"), "Ejemplo propio: cache.match(), cache.matchAll() y caches.match().", alto=360)
    d.fig("ej5", cap("ej-05-borrar.png"), "Ejemplo propio: cache.delete() y caches.delete().", alto=360)
    d.p("Las capturas del ejemplo se tomaron en un servidor local (localhost) con Microsoft Edge.")

    d.h1("7. URL de la aplicación")
    d.li([f"Aplicación publicada: {enlace(APP)}",
          f"Demostración de la API Cache: {enlace(APP + 'demo-cache.html')}",
          f"Ejemplo mínimo propio: {enlace(EJEMPLO)}",
          f"Repositorio: {enlace(REPO)}"])

    d.h1("8. Conclusión")
    d.p("La API Cache es lo que convierte un sitio web en una aplicación que abre sin internet. Lo más importante "
        "que aprendí es que no existe una sola estrategia correcta: en AlertaVecinal los archivos estáticos usan "
        "<i>cache first</i> porque casi no cambian, las páginas usan <i>network first</i> para mostrar lo más "
        "reciente y el mapa usa <i>stale-while-revalidate</i> con un límite de mosaicos para no llenar el "
        "almacenamiento. También entendí la importancia de versionar la caché: sin el número de versión y la "
        "limpieza en <i>activate</i>, los usuarios se quedarían con archivos viejos.")
    d.refs([R_COOK, R_CACHE, R_CSTORAGE, R_PWA, R_LEARN, R_REPO])
    pdf("SP4_API_Cache_Gonzalez.pdf", "SUBPRODUCTO No. 4: API CACHÉ",
        "APLICACIONES WEB PROGRESIVAS · SUBPRODUCTO 4 · API CACHÉ", d)


# =====================================================================
#  SP5 · APORTACIÓN
# =====================================================================
def sp5():
    d = Doc()
    d.h1("a) Hoja de presentación")
    d.p("La portada de este documento corresponde a la hoja de presentación. La aportación se integra en "
        f"<b>AlertaVecinal</b>, la PWA de seguridad vecinal del equipo ({enlace(APP)}).")

    d.h1("b) Nombre de la aportación")
    d.p("<b>Vecino Verificado Pro</b>: reputación verificable para los vecinos de la red, con un panel de "
        "indicadores (Panel Pro), verificación de domicilio por el comité y una ficha pública generada en el servidor.")

    d.h1("c) Categoría")
    d.p("<b>Innovación + emprendimiento.</b>")
    d.li(["<b>Innovación:</b> agrega a la app una capa de confianza que no existía. Mide la calidad de las "
          "alertas de cada vecino (si traen ubicación y descripción clara, o foto) y la convierte en una insignia "
          "visible. Además, la ficha pública se genera en el servidor (Google Apps Script), así que se puede "
          "compartir con alguien que no tiene la app.",
          "<b>Emprendimiento:</b> es la base de un modelo «Pro» para comités vecinales y fraccionamientos: "
          "el comité obtiene indicadores para tomar decisiones (vecinos más activos, horarios y calles con más "
          "incidentes) y un sello de domicilio verificado que da valor a la membresía."])

    d.h1("d) Problema o necesidad")
    d.p("En una red vecinal cualquiera puede mandar una alerta. Sin un mecanismo de confianza aparecen tres "
        "problemas: (1) alertas falsas o poco útiles («hay algo raro» sin ubicación) que generan pánico y desgastan "
        "la atención de los vecinos; (2) no se sabe si quien alerta realmente vive en la colonia; y (3) el comité "
        "no tiene datos para saber quién participa ni dónde ocurren los incidentes. En los grupos de mensajería "
        "esto se resuelve «de palabra», sin evidencia.")

    d.h1("e) Descripción de la propuesta")
    d.h2("Flujo")
    d.fig("flujo", cap("diag-01-verificado.png"), "Diagrama de flujo de Vecino Verificado Pro.", ancho=500)
    d.h2("Pantallas")
    d.t([["Pantalla", "Quién la usa", "Qué muestra o hace"],
         ["Panel Pro (estadisticas.html)", "Vecino y comité",
          "Indicadores de la colonia, alertas por tipo y horario, calles con más incidentes, vecinos más activos "
          "con su insignia y «Mi ficha de Vecino Verificado» con el enlace a la ficha pública."],
         ["Administración (admin.html)", "Administrador / comité",
          "Botón «Verificar domicilio» / «Quitar verificación», chip «Domicilio verificado» y enlace a la ficha."],
         ["Ficha pública (vista del servidor)", "Cualquier persona con el enlace",
          "Nombre corto, sellos de vecino aprobado y domicilio verificado, antigüedad, alertas enviadas y útiles, "
          "porcentaje de utilidad e insignia. Sin correo, teléfono, domicilio ni coordenadas."]],
        [130, 100, 274])
    d.h2("Datos")
    d.t([["Dato", "Dónde vive", "Para qué"],
         ["usuarios/{uid}.estado, rol, creado", "Firestore", "Solo los aprobados tienen ficha; antigüedad en días."],
         ["usuarios/{uid}.verificado, verificadoEn, verificadoPor", "Firestore (lo escribe el servidor)",
          "Sello de domicilio verificado, con hora del servidor y el admin que lo hizo."],
         ["alertas: uid, lat, lng, descripcion, foto", "Firestore",
          "Alerta útil = GPS + descripción de 15 o más caracteres, o foto."],
         ["Insignia", "Calculada (cliente y servidor)",
          "Nuevo → Colaborador (1 útil) → Vecino confiable (3 útiles, 30 días) → Guardián (8 útiles, 90 días)."]],
        [170, 120, 214])

    d.h1("f) Valor agregado")
    d.li(["<b>Para los vecinos:</b> saben a quién creerle. Una alerta de un «Guardián» con domicilio verificado "
          "tiene más peso que la de una cuenta nueva, y la insignia motiva a mandar alertas completas.",
          "<b>Para el comité:</b> datos reales para organizar rondines y reconocer a los vecinos más "
          "participativos, sin hojas de cálculo.",
          "<b>Para el proyecto:</b> suma una vista generada en el servidor, una acción protegida por rol en el "
          "backend y una función que puede ofrecerse como plan «Pro» a fraccionamientos.",
          "<b>Privacidad por diseño:</b> la ficha pública solo muestra datos no sensibles; el servidor nunca "
          "envía correo, teléfono, calle ni coordenadas."])

    d.h1("g) Elemento diferenciador")
    d.t([["Criterio", "Grupo de WhatsApp vecinal", "Redes vecinales comerciales", "AlertaVecinal + Vecino Verificado Pro"],
         ["¿Quién puede alertar?", "Cualquiera que agreguen al grupo.", "Usuarios registrados.",
          "Solo vecinos aprobados por el administrador."],
         ["Verificación de domicilio", "No existe.", "Algunas la piden al registrarse.",
          "La hace el comité de la colonia y queda registrada con fecha."],
         ["Calidad de cada alerta", "No se mide.", "Generalmente no se mide.",
          "Se mide (GPS + descripción o foto) y se refleja en la insignia."],
         ["Indicadores para el comité", "No hay.", "Limitados o de pago.",
          "Panel Pro: tipos, horarios, calles y vecinos más activos."],
         ["Reputación compartible", "No.", "Perfil dentro de la plataforma.",
          "Ficha pública por enlace, generada en el servidor, sin datos sensibles."],
         ["Ubicación y mapa", "Se escribe a mano.", "Variable.", "GPS y mapa en tiempo real."]],
        [100, 120, 120, 164])
    d.p("El diferenciador principal es que la confianza <b>se basa en evidencia</b> (alertas útiles y verificación "
        "del comité) y no en la opinión del grupo, y que puede compartirse fuera de la app sin exponer datos personales.")

    d.h1("h) Imágenes")
    d.fig("real", evi("yeudiel-01-app-instalada-panel-pro.png"),
          "App instalada en mi computadora (ventana propia de la PWA) con mi cuenta real: Panel Pro y «Mi ficha de Vecino Verificado».", alto=400)
    d.fig("ficha", evi("yeudiel-02-ficha-servidor.png"),
          "Mi ficha pública real generada por Google Apps Script (vista verificado).", alto=400)
    d.fig("demo", cap("sp5-01-panel-pro-demo.png"),
          "Panel Pro con datos de ejemplo (?demo=1): indicadores, vecinos más activos con insignia y gráficas.", alto=460)
    d.fig("admin", cap("sp5-03-admin-verificado-demo.png"),
          "Administración (?demo=1): al pulsar «Verificar domicilio» aparece el chip «Domicilio verificado».", alto=400)

    d.h1("Conclusión")
    d.p("Vecino Verificado Pro resuelve un problema real de las redes vecinales: la falta de confianza en quien "
        "alerta. Con reglas simples y transparentes (alerta útil e insignias por participación y antigüedad), la "
        "verificación del comité y una ficha pública que respeta la privacidad, la app pasa de ser un canal de "
        "avisos a una red con reputación verificable. En el SP7 documento el backend que lo hace posible.")
    d.refs([R_PWA, R_TPL, R_REST, R_REPO])
    pdf("SP5_Aportacion_Gonzalez.pdf", "SUBPRODUCTO No. 5: APORTACIÓN – VECINO VERIFICADO PRO",
        "APLICACIONES WEB PROGRESIVAS · SUBPRODUCTO 5 · APORTACIÓN", d)


# =====================================================================
#  SP6 · NOTIFICACIONES
# =====================================================================
def sp6():
    d = Doc()
    d.h1("1. Notificaciones push en una PWA")
    d.h2("Propósito")
    d.p("Una notificación push es un mensaje que un servidor envía al dispositivo del usuario y que el sistema "
        "operativo muestra aunque la aplicación esté cerrada. Su propósito es avisar de algo importante en el "
        "momento en que ocurre y traer de vuelta al usuario a la app. En AlertaVecinal es la función central: "
        "cuando un vecino envía una alerta, los demás deben enterarse de inmediato.")
    d.h2("Características")
    d.li(["Llegan aunque la página esté cerrada, porque las recibe el <b>service worker</b>.",
          "Requieren <b>permiso explícito</b> del usuario y un contexto seguro (HTTPS).",
          "Pueden llevar título, cuerpo, ícono, insignia, vibración, etiqueta (<i>tag</i>) para no duplicarse y datos "
          "para abrir una URL al tocarlas.",
          "Usan un <b>servicio de push</b> del navegador; en nuestro caso se accede con Firebase Cloud Messaging (FCM)."])
    d.h2("Ventajas")
    d.li(["Inmediatez: el aviso llega en segundos.", "Reenganche: el usuario vuelve a la app con un toque.",
          "No requieren publicar en una tienda de apps: funcionan desde la web instalada.",
          "Bajo consumo: el navegador mantiene una sola conexión para todos los sitios."])
    d.h2("Aplicaciones prácticas")
    d.li(["Alertas de seguridad y emergencias (AlertaVecinal).", "Estado de pedidos y entregas.",
          "Recordatorios de citas y vencimientos.", "Mensajes nuevos en apps de chat.",
          "Avisos de noticias o cambios de precio."])

    d.h1("2. Componentes y tecnologías")
    d.t([["Componente", "Qué es", "En AlertaVecinal"],
         ["Notifications API", "Muestra notificaciones y pide permiso (Notification.requestPermission).",
          "js/push.js pide el permiso al pulsar «Activar notificaciones»."],
         ["Push API", "Permite al service worker recibir mensajes del servidor de push.",
          "La usa el SDK de Firebase Messaging internamente."],
         ["Service worker", "Script en segundo plano que recibe el push y muestra la notificación.",
          "sw.js importa sw-push.js (onBackgroundMessage, notificationclick)."],
         ["Servidor de push (FCM)", "Servicio de Google que entrega el mensaje a cada navegador.",
          "API HTTP v1 de FCM llamada desde Apps Script (Push.gs)."],
         ["Claves VAPID", "Par de claves que identifica al servidor que envía los mensajes.",
          "La clave pública va en js/firebase-config.js; la privada la guarda Firebase."],
         ["Token de registro", "Identificador único de cada navegador para FCM.",
          "getToken(messaging, {vapidKey}); se guarda en Firestore para enviarle mensajes."],
         ["Permiso", "default, granted o denied. Sin «granted» no se muestra nada.",
          "Chip de estado en demo-push.html."],
         ["Payload", "Datos del mensaje: notification (lo muestra el SDK) o data (lo arma el código).",
          "Push.gs manda data: titulo, cuerpo, tipo, alertaId, url."],
         ["Primer plano", "La app está abierta: el mensaje llega a onMessage en la página.",
          "Se muestra un aviso dentro de la página."],
         ["Segundo plano", "La app está cerrada: el mensaje llega al service worker.",
          "onBackgroundMessage → showNotification con vibración según el tipo."]],
        [96, 200, 208])
    d.fig("flujo", cap("diag-02-push.png"), "Flujo completo de una notificación en AlertaVecinal.", ancho=500)
    d.code(leer("js/push.js", 47, 75), "Fragmento de js/push.js · permiso y token FCM")
    d.code(leer("sw-push.js", 56, 80), "Fragmento de sw-push.js · mensaje en segundo plano")

    d.h1("3. Ejemplo: demo-push.html")
    d.p(f"La página {enlace(APP + 'demo-push.html', 'demo-push.html')} de la app publicada permite probar cada "
        "paso: (1) ver el estado del permiso, del service worker y del soporte de Push API; (2) obtener y copiar el "
        "token FCM para enviar un mensaje de prueba desde la consola de Firebase; (3) lanzar una notificación local; "
        "y (4) ver cómo se muestra un mensaje en primer plano.")
    d.fig("demo", cap("sp6-01-demo-push.png"), "demo-push.html en la app publicada: estado, token, notificación local y primer plano.")
    d.fig("primer", cap("sp6-02-mensaje-primer-plano.png"),
          "Mensaje en primer plano: con la app abierta el aviso se muestra dentro de la página.")

    d.h1("4. Ejemplo mínimo propio")
    d.p("Como ejemplo propio hice una página independiente en "
        f"{enlace(EJEMPLO, 'docs/individual/yeudiel/ejemplo/')} con su propio service worker. El botón "
        "«Lanzar notificación» pide el permiso y muestra la notificación con "
        "<font name='Courier'>registration.showNotification()</font>, sin servidor de push. Para comprobarlo, "
        "consulta las notificaciones visibles con <font name='Courier'>getNotifications()</font>. Al tocarla, el "
        "service worker la cierra y enfoca la página (<font name='Courier'>notificationclick</font>).")
    d.code(leer("docs/individual/yeudiel/ejemplo/ejemplo.js", 72, 88), "Fragmento de ejemplo.js · notificación local")
    d.code(leer("docs/individual/yeudiel/ejemplo/sw-ejemplo.js", 25, 32), "Fragmento de sw-ejemplo.js · clic en la notificación")
    d.fig("ej", cap("ej-06-notificacion.png"),
          "Ejemplo propio (localhost, Microsoft Edge): permiso concedido y notificación mostrada por el service worker.", alto=380)

    d.h1("5. Conclusión")
    d.p("Las notificaciones push son lo que hace que una PWA se sienta como una app nativa: avisan aunque la app "
        "esté cerrada. Aprendí que intervienen varias piezas que deben coincidir (permiso, token, claves VAPID, "
        "servidor de push y service worker) y que es importante distinguir el primer plano del segundo plano. "
        "Con el ejemplo propio comprobé que una notificación local solo necesita el permiso y el service worker, "
        "mientras que un push real necesita además un servidor que firme el mensaje, que en nuestro proyecto es "
        "Google Apps Script.")
    d.refs([R_FCM, R_NOTIF, R_PUSH, R_SHOW, R_LEARN, R_REPO])
    pdf("SP6_Notificaciones_Gonzalez.pdf", "SUBPRODUCTO No. 6: NOTIFICACIONES",
        "APLICACIONES WEB PROGRESIVAS · SUBPRODUCTO 6 · NOTIFICACIONES", d)


# =====================================================================
#  SP7 · APORTACIÓN – BACKEND
# =====================================================================
def sp7():
    d = Doc()
    pwa, be = MED["pwa"], MED["backend"]
    d.h1("1. Resumen de la aportación")
    d.p("Este documento describe el backend de mi aportación <b>Vecino Verificado Pro</b> (SP5). El backend corre "
        "en <b>Google Apps Script</b>, publicado como aplicación web, y agrega dos piezas: la vista "
        "<font name='Courier'>vista_verificado</font>, que genera en el servidor la ficha pública de un vecino, y la "
        "acción <font name='Courier'>accion_verificar</font>, con la que un administrador marca el domicilio de un "
        "vecino como verificado. Los archivos son <font name='Courier'>apps-script/Verificado.gs</font>, "
        "<font name='Courier'>apps-script/vista_verificado.html</font> y sus pruebas.")

    d.h1("2. Arquitectura del backend")
    d.fig("arq", cap("diag-03-backend.png"), "Arquitectura del backend de la aportación.", ancho=500)
    d.p("El enrutador común (<font name='Courier'>Comun.gs</font>) recibe todo: <font name='Courier'>doGet</font> "
        "busca una función <font name='Courier'>vista_&lt;nombre&gt;</font> y <font name='Courier'>doPost</font> "
        "una función <font name='Courier'>accion_&lt;nombre&gt;</font>. Firestore se consulta por su API REST con un "
        "token OAuth de la cuenta de servicio, que se guarda en las propiedades del script (nunca en el repositorio). "
        "La sesión se valida con el <i>idToken</i> de Firebase Authentication.")
    d.t([["Método", "Ruta / acción", "Entrada", "Salida", "Validaciones"],
         ["GET", "?vista=verificado&amp;uid=UID", "uid del vecino (parámetro de la URL)",
          "HTML generado en el servidor (ficha o página genérica)",
          "uid con formato válido; el vecino existe y está aprobado; si no, misma página genérica (no revela si la cuenta existe)."],
         ["POST", "accion: «verificar»", "JSON (text/plain): idToken, uid, verificado (true/false)",
          "JSON {ok, uid, verificado} o {ok:false, error}",
          "Sesión válida con rol admin; uid válido; verificado booleano; el vecino existe y está aprobado. Fecha con hora del servidor."],
         ["GET", "(sin parámetros)", "—", "JSON de estado del servicio",
          "Lista las vistas y acciones publicadas."]],
        [44, 90, 108, 100, 162])

    d.h1("3. Código explicado")
    d.code(leer("apps-script/Verificado.gs", 38, 50),
           "Verificado.gs · vista_verificado(e): valida el uid, lee el perfil y las alertas, y genera la vista")
    d.p("La vista no confía en el parámetro: si el uid no tiene el formato esperado, o el vecino no existe o no está "
        "aprobado, responde la misma página genérica para no revelar información. Las alertas se filtran por uid "
        "y se pasan a <font name='Courier'>armarFicha_</font>.")
    d.code(leer("apps-script/Verificado.gs", 52, 73),
           "Verificado.gs · armarFicha_: calcula indicadores sin datos sensibles")
    d.code(leer("apps-script/Verificado.gs", 75, 95),
           "Verificado.gs · regla de alerta útil, insignia y nombre corto")
    d.code(leer("apps-script/Verificado.gs", 103, 119),
           "Verificado.gs · accion_verificar(d): solo un administrador puede verificar")
    d.p("La acción primero valida la sesión con rol de administrador (<font name='Courier'>verificarSesion_</font>), "
        "después los datos de entrada y el estado del vecino, y solo entonces actualiza Firestore. La fecha se toma "
        "del servidor para que no pueda alterarse desde el navegador.")
    d.code(leer("apps-script/vista_verificado.html", 35, 60),
           "vista_verificado.html · plantilla: los datos se insertan escapados en el servidor")
    d.code(leer("js/admin.js", *_rango_verificar()), "js/admin.js · el panel de administración llama a la acción")

    d.h1("4. Funcionamiento")
    d.fig("estado", cap("sp7-01-backend-estado.png"),
          "Respuesta JSON del backend publicado: incluye la vista «verificado» y la acción «verificar».", ancho=500)
    d.p(f"Datos de esa respuesta: servicio «{escape(be.get('servicio', ''))}», configurado = "
        f"{be.get('configurado')}, vistas = {', '.join(be.get('vistas', []))}, acciones = "
        f"{', '.join(be.get('acciones', []))}, hora del servidor {escape(be.get('horaServidor', ''))}.")
    d.fig("ficha", evi("yeudiel-02-ficha-servidor.png"), "Mi ficha real generada en el servidor.", alto=380)
    d.fig("fuente", evi("yeudiel-03-ficha-codigo-fuente.png"),
          "Código fuente de la ficha: los datos llegan ya incrustados en el HTML (vista del lado del servidor).", alto=380)
    d.fig("generica", cap("sp7-02-ficha-no-disponible.png"),
          "Con un uid que no corresponde a un vecino aprobado, el servidor responde la página genérica.", alto=330)
    d.fig("admin", cap("sp5-03-admin-verificado-demo.png"),
          "Administración (?demo=1): botón «Verificar domicilio» y chip de domicilio verificado.", alto=380)
    d.h2("Pruebas automatizadas del backend")
    d.p("Las pruebas corren el código de Apps Script en Node.js con un simulador local de Firestore y de las "
        "sesiones (<font name='Courier'>apps-script/pruebas/prueba_verificado.mjs</font>). Resultado real:")
    with open(os.path.join(CAP, "pruebas_verificado.txt"), encoding="utf-8-sig") as fh:
        salida = fh.read().replace("✅", "[OK]")
    d.code(salida)

    d.h1("5. Evidencias de la PWA")
    d.fig("inicio", cap("pwa-01-inicio-demo.png"), "Pantalla principal publicada (escritorio, ?demo=1).", alto=330)
    d.fig("movil", cap("pwa-04-movil.png"), "Diseño adaptable: vista de teléfono emulada a 390 × 844 px en Edge.", ancho=220, alto=420)
    d.fig("offline", cap("pwa-02-sin-conexion.png"), "La app abre sin conexión desde la caché.", alto=330)
    d.fig("offhtml", cap("pwa-03-offline-html.png"), "Página offline personalizada.", alto=300)
    d.fig("cache", cap("sp4-02-cache-keys.png"), "App shell precacheado (demo-cache.html → cache.keys()).", alto=380)
    d.fig("push", cap("sp6-01-demo-push.png"), "Notificaciones: permiso, service worker y Push API (demo-push.html).", alto=330)
    d.fig("real", evi("yeudiel-01-app-instalada-panel-pro.png"), "App instalada en mi computadora con mi cuenta real (ventana standalone).", alto=400)

    d.h1("6. Lista de cotejo de características de la PWA")
    d.p("Verificada sobre la app publicada el 25 de noviembre de 2026. Los valores de manifest, service worker y "
        "APIs se leyeron con un script de Playwright sobre Microsoft Edge; los resultados quedaron en "
        "<font name='Courier'>capturas/verificacion.json</font>.")
    F = d.f
    filas = [["#", "Característica", "Cumple", "Cómo se verificó", "Evidencia"],
             ["1", "Se sirve por HTTPS", "Sí", f"location.protocol = «{pwa['https']}» en GitHub Pages.", F("inicio")],
             ["2", "Manifest válido", "Sí", f"manifest.json con name, short_name, start_url «{pwa['start_url']}», "
              "scope, colores e id.", F("real")],
             ["3", "Íconos 192, 512 y maskable", "Sí", "Íconos: " + ", ".join(pwa["iconos"]) + ".", F("real")],
             ["4", "display: standalone", "Sí", f"display = «{pwa['display']}»; abre sin barra del navegador.", F("real")],
             ["5", "Instalable", "Sí", "Botón de instalación (beforeinstallprompt) e instalación real en mi computadora.", F("real")],
             ["6", "Service worker registrado", "Sí", f"Estado «{pwa['sw_estado']}», alcance /alertavecinal/, "
              f"página controlada = {pwa['controlada']}.", F("cache")],
             ["7", "App shell precacheado", "Sí", f"cache.keys() de {MED['sw_version']}: {MED['shell_entradas']} entradas.", F("cache")],
             ["8", "Funciona sin conexión", "Sí", "Modo sin conexión del navegador y recarga: la app abre.", F("offline")],
             ["9", "Página offline personalizada", "Sí", "Página no guardada + sin red → offline.html.", F("offhtml")],
             ["10", "Estrategia de caché por recurso", "Sí", "Cache first (estáticos), network first (HTML), "
              "stale-while-revalidate (mapa) en sw.js.", "SP4"],
             ["11", "Actualización de versión del SW", "Sí", "VERSION = 'v7'; activate borra cachés viejas; aviso "
              "«Hay una versión nueva».", F("movil")],
             ["12", "Background Sync", "Sí", f"«sync» en el registro del SW = {pwa['sync']}; sw-sync.js envía las alertas "
              "guardadas sin señal.", "sw-sync.js"],
             ["13", "Notificaciones push", "Sí", f"PushManager = {pwa['push']}; token FCM y push real desde Apps Script.", F("push")],
             ["14", "Diseño adaptable (responsive)", "Sí", "Captura a 390 × 844 px sin desbordes.", F("movil")],
             ["15", "Datos locales (IndexedDB)", "Sí", f"indexedDB disponible = {pwa['indexeddb']}; cola de alertas sin señal "
              "y caché persistente de Firestore.", F("offline")],
             ["16", "Datos remotos en tiempo real", "Sí", "Firestore onSnapshot actualiza lista, mapa y Panel Pro.", F("real")],
             ["17", "Vistas generadas en el servidor", "Sí", "vista_verificado: HTML armado en Apps Script con los datos incrustados.",
              F("fuente")],
             ["18", "Acceso a elementos físicos", "Sí", f"Geolocalización = {pwa['geolocalizacion']}, vibración = "
              f"{pwa['vibracion']}, cámara para foto de evidencia.", F("inicio")],
             ["19", "Compartir nativo", "Sí", f"navigator.share disponible = {pwa['compartir']}; botón «Compartir» en cada alerta.",
              F("inicio")],
             ["20", "Seguridad en el servidor", "Sí", "accion_verificar exige admin; pruebas: no admin y token falso "
              "rechazados (12/12).", "Pruebas"]]
    d.t(filas, [24, 116, 42, 234, 88])

    d.h1("7. Conclusión")
    d.p("El backend de Vecino Verificado Pro demuestra que una PWA puede tener lógica de servidor sin pagar "
        "infraestructura: Google Apps Script genera la ficha pública con datos ya incrustados y protege la "
        "verificación con la sesión y el rol del administrador. Separar el cálculo (<font name='Courier'>armarFicha_</font>) "
        "de la vista me permitió probarlo con 12 pruebas automatizadas, incluidas las de privacidad y seguridad. "
        "La lista de cotejo confirma que la aplicación cumple las 20 características revisadas.")
    d.refs([R_WEB, R_TPL, R_REST, R_PWA, R_LEARN, R_REPO])
    pdf("SP7_Aportacion_Backend_Gonzalez.pdf", "SUBPRODUCTO No. 7: APORTACIÓN – BACKEND",
        "APLICACIONES WEB PROGRESIVAS · SUBPRODUCTO 7 · APORTACIÓN – BACKEND", d)


def _rango_verificar():
    """Líneas de la función verificar() en js/admin.js."""
    with open(os.path.join(RAIZ, "js", "admin.js"), encoding="utf-8") as fh:
        lineas = fh.readlines()
    ini = next(i for i, l in enumerate(lineas) if "function verificar" in l)
    fin = ini
    while fin < len(lineas) - 1 and not lineas[fin].startswith("}"):
        fin += 1
    return ini + 1, fin + 1


if __name__ == "__main__":
    sp4(); sp5(); sp6(); sp7()
