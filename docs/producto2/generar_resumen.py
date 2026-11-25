"""Genera el resumen de una página: cómo cumple AlertaVecinal cada punto del Producto 2.

Uso (desde la raíz del repo):
    python docs/producto2/generar_resumen.py   # entregables/Resumen_Cumplimiento_Producto2.pdf
"""
import os
import sys

from reportlab.lib.pagesizes import letter
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
sys.path.insert(0, os.path.join(RAIZ, "docs", "claude-kit", "tools"))
from utp_doc import enlace, estilos, tabla  # noqa: E402

s = estilos()
s["titulo"].fontSize, s["titulo"].leading, s["titulo"].spaceAfter = 15, 19, 2
s["bajada"].fontSize, s["bajada"].leading, s["bajada"].spaceAfter = 8, 11, 6
s["h2"].spaceBefore, s["h2"].spaceAfter = 4, 3
s["body"].fontSize, s["body"].leading, s["body"].spaceAfter = 8, 11, 3
for k in ("celda", "celda_h"):
    s[k].fontSize, s[k].leading = 7, 9


def t(filas, anchos):
    tb = tabla([[Paragraph(c, s["celda_h"] if i == 0 else s["celda"]) for c in f] for i, f in enumerate(filas)], anchos)
    tb.setStyle([("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)])
    return tb


APP = "https://jazyelae.github.io/alertavecinal/"
REPO = "https://github.com/JazyelAe/alertavecinal"

requisitos = [
    ["Requisito de la aplicación", "Cómo lo cumple AlertaVecinal", "Pruebas aprobadas"],
    ["<b>Vistas del lado del cliente</b>",
     "Panel del vecino, administración y Panel Pro: el HTML llega vacío y JavaScript pinta alertas, mapa, mapa de calor y gráficas con datos de Firestore.",
     "J-02, L-01, L-05, Y-01, Y-06"],
    ["<b>Vistas del lado del servidor</b>",
     "Tres vistas con Google Apps Script (HtmlService), una por integrante: <b>Boletín</b> público (Jaziel), <b>Reporte de mapa de calor</b> (Luis) y <b>Ficha de Vecino Verificado</b> (Yeudiel). Los datos llegan ya escritos en el HTML.",
     "J-15, J-16, L-11, L-16, Y-10, Y-13"],
    ["<b>Datos locales</b>",
     "IndexedDB guarda la cola de alertas sin señal; <i>localStorage</i> guarda preferencias y el último aviso visto.",
     "J-09, J-22"],
    ["<b>Datos remotos</b>",
     "Firestore en tiempo real (onSnapshot), Firebase Authentication, backend de Apps Script y Nominatim para convertir el GPS en dirección.",
     "J-01, J-14, L-03, Y-15"],
    ["<b>Datos offline</b>",
     "Service worker con Cache Storage (app shell, mosaicos del mapa y offline.html), persistencia offline de Firestore y Background Sync que envía la alerta al volver la señal.",
     "J-04 a J-07, J-10, J-21, L-04"],
    ["<b>Notificaciones</b>",
     "Push con Firebase Cloud Messaging enviado desde Apps Script: notificación del sistema con la app cerrada y aviso dentro de la página con la app abierta.",
     "J-17, L-08, L-09, L-12, L-13, L-14"],
    ["<b>Elementos físicos del dispositivo</b>",
     "GPS para la ubicación, cámara para la foto (comprimida en el navegador), vibración según el tipo de alerta y menú nativo de compartir.",
     "J-08, J-11, J-12, J-18 a J-20, L-10"],
    ["<b>PWA instalable y adaptable</b>",
     "manifest.json, HTTPS en GitHub Pages, botón de instalar, ventana propia y diseño adaptable a celular y escritorio.",
     "J-03, J-13, Y-03, Y-04"],
]

documento = [
    ["Parte que pide la profesora", "Dónde está en el documento del Producto 2"],
    ["Justificación de las plataformas y herramientas utilizadas", "Sección 2: tabla herramienta, para qué, por qué y alternativa descartada (Firebase, Apps Script, Leaflet/OSM, Nominatim, IndexedDB, GitHub Pages…)."],
    ["Parámetros de configuración de las plataformas y herramientas", "Sección 3: manifest.json, sw.js, firebase-config.js, firestore.rules, Authentication, FCM/VAPID, appsscript.json y GitHub Pages."],
    ["Reporte de pruebas", "Sección 4: <b>51 pruebas, todas aprobadas</b> (Jaziel 22, Luis 14, Yeudiel 15): automáticas con Playwright y el simulador del backend, y manuales con cuenta real en celular."],
    ["Evidencias de las características de la PWA", "Sección 5: 29 figuras (instalación, offline, caché, push recibido, cámara, compartir, vistas del servidor y su código fuente)."],
    ["Vínculo (URL) de la aplicación publicada", f"Sección 6: app {enlace(APP)} · repositorio {enlace(REPO)} · backend /exec con sus 3 vistas."],
]

aportaciones = [
    ["Integrante", "Aportación", "Vista del servidor"],
    ["Serrano Arana Jahir Jaziel", "<b>Alerta sin señal</b>: la alerta se guarda sin internet y se envía sola al volver la conexión.", "Boletín público de alertas"],
    ["Xicali Diaz Luis Alberto", "<b>Mapa de calor de incidentes</b>: zonas de riesgo con filtros por tipo y fecha, más notificaciones push.", "Reporte de mapa de calor"],
    ["Gonzalez Barrios Yeudiel Nain", "<b>Vecino Verificado Pro</b>: Panel Pro para el comité, verificación de domicilio e insignias.", "Ficha de Vecino Verificado"],
]

cuerpo = [
    Paragraph("AlertaVecinal · Cumplimiento del Producto 2", s["titulo"]),
    Paragraph("Aplicaciones Web Progresivas · Unidad II · Resumen de una página · Noviembre de 2026", s["bajada"]),
    Paragraph("AlertaVecinal es una PWA de seguridad vecinal: los vecinos envían alertas con ubicación y foto, las ven en tiempo real en una lista y un mapa, "
              "reciben notificaciones push y la app sigue funcionando sin conexión. Está publicada en GitHub Pages con Firebase y un backend en Google Apps Script.", s["body"]),
    Paragraph("1. Requisitos de la aplicación", s["h2"]),
    t(requisitos, [108, 302, 94]),
    Paragraph("2. Partes del documento", s["h2"]),
    t(documento, [150, 354]),
    Paragraph("3. Aportaciones del equipo", s["h2"]),
    t(aportaciones, [118, 268, 118]),
    Spacer(1, 4),
    Paragraph("El repositorio incluye README con capturas, arquitectura, instrucciones para ejecutarla y la tabla de cumplimiento; "
              "todo está fusionado en <i>main</i> y la app publicada corresponde al último commit.", s["body"]),
]


def main():
    salida = os.path.join(RAIZ, "entregables", "Resumen_Cumplimiento_Producto2.pdf")
    doc = SimpleDocTemplate(salida, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=40, bottomMargin=36,
                            title="AlertaVecinal · Cumplimiento del Producto 2")
    doc.build(cuerpo)
    print("PDF generado:", salida)


if __name__ == "__main__":
    main()
