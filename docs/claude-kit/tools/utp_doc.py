"""Plantilla UTP - Aplicaciones Web Progresivas (10° D).

Uso:
    from utp_doc import *
    s = estilos()
    cuerpo = [
        Paragraph("Introducción", s["h1"]),
        Paragraph("Texto con " + enlace("https://github.com/JazyelAe", "mi GitHub"), s["body"]),
        figura("docs/capturas/inicio.png", "Figura 1. Pantalla principal", ancho=400),
        tabla([["Col A", "Col B"], ["a", "b"]], [150, 330]),
        horizontal(),            # las páginas siguientes van en horizontal
        tabla(...),              # tabla ancha (ancho útil horizontal: ~684 pt)
        vertical(),              # regresa a vertical
    ]
    build_pdf("salida.pdf", titulo="SUBPRODUCTO No. 1: APLICACIÓN NATIVA",
              subtitulo="Actividad Apertura · Unidad I", cuerpo=cuerpo,
              encabezado="APLICACIONES WEB PROGRESIVAS · SUBPRODUCTO 1")
    # Otro integrante:   build_pdf(..., alumno="Gonzalez Barrios Yeudiel Nain", matricula="...")
    # Portada de equipo: build_pdf(..., integrantes=[("Serrano Arana Jahir Jaziel", "2311080845"), ...])

Ancho útil vertical: 504 pt. Requiere: pip install reportlab pillow
"""
import os
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                NextPageTemplate, PageBreak, Table, TableStyle, Spacer,
                                Image, KeepTogether)

# ---- Datos fijos -------------------------------------------------------------
MATERIA = "APLICACIONES WEB PROGRESIVAS"
DIVISION = "DIVISIÓN DE TECNOLOGÍAS DE LA INFORMACIÓN"
CARRERA = "INGENIERÍA EN DESARROLLO Y GESTIÓN DE SOFTWARE"
ALUMNO = "Jahir Jaziel Serrano Arana"
MATRICULA = "2311080845"
PROFESORA = "Mather Xóchitl Mendoza Piscil"
GRUPO = "10° D"

# ---- Colores -----------------------------------------------------------------
GUINDA = HexColor("#7B173B")
TEXTO = HexColor("#222222")
GRIS = HexColor("#555555")
GRIS_CLARO = HexColor("#CCCCCC")
FILA_ALTERNA = HexColor("#F4EEF1")

LOGO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logo_utp.png")
W, H = letter
CX = (105 + 567) / 2  # centro del bloque de la portada


def _portada(c, doc):
    c.saveState()
    c.setFillColor(GUINDA)
    c.rect(0, 0, 22, H, stroke=0, fill=1)          # barra lateral
    c.rect(0, 0, 67, 16, stroke=0, fill=1)          # pestaña inferior
    if os.path.exists(LOGO):
        c.drawImage(LOGO, 81, H - 59 - 86, 86, 86, mask="auto")
    c.setFillColor(TEXTO)
    c.setFont("Helvetica-Bold", 16.5)
    c.drawCentredString(CX, H - 205, MATERIA)
    c.setFont("Helvetica", 10)
    c.drawCentredString(CX, H - 228, DIVISION)
    c.drawCentredString(CX, H - 246, CARRERA)
    c.setStrokeColor(GRIS_CLARO); c.setLineWidth(0.8)
    c.line(105, H - 270, 567, H - 270)
    # título y subtítulo (con ajuste de línea)
    t = Paragraph(doc.titulo, ParagraphStyle("pt", fontName="Helvetica-Bold", fontSize=15,
                  leading=21, textColor=GUINDA, alignment=TA_CENTER))
    tw, th = t.wrap(400, 200)
    y = H - 290 - th
    t.drawOn(c, CX - 200, y)
    if doc.subtitulo:
        st = Paragraph(doc.subtitulo, ParagraphStyle("ps", fontName="Helvetica-Oblique",
                       fontSize=9.5, leading=15, textColor=GRIS, alignment=TA_CENTER))
        sw, sh = st.wrap(320, 100)
        st.drawOn(c, CX - 160, y - 12 - sh)
    # datos
    y = H - 425
    if doc.integrantes:  # portada de equipo
        c.setFillColor(TEXTO); c.setFont("Helvetica-Bold", 8)
        c.drawString(105, y, "INTEGRANTES DEL EQUIPO (NOMBRE · MATRÍCULA):")
        c.setFont("Helvetica", 9.5)
        for i, (nom, mat) in enumerate(doc.integrantes):
            c.drawString(105, y - 16 - i * 15, f"{nom} · {mat}")
        y -= 16 + 15 * len(doc.integrantes) + 22
        filas = [("NOMBRE DE/LA PROFESOR(A):", PROFESORA), ("GRUPO:", GRUPO)]
    else:
        filas = [("NOMBRE DEL ALUMNO(A):", doc.alumno), ("MATRÍCULA:", doc.matricula),
                 ("NOMBRE DE/LA PROFESOR(A):", PROFESORA), ("GRUPO:", GRUPO)]
    for etiqueta, valor in filas:
        c.setFillColor(TEXTO); c.setFont("Helvetica-Bold", 8); c.drawString(105, y, etiqueta)
        c.setFont("Helvetica", 9.5); c.drawString(105, y - 16, valor)
        y -= 53
    c.setFillColor(GRIS); c.setFont("Helvetica", 8)
    c.drawRightString(577, 41, doc.fecha.upper())
    c.restoreState()


def _interior(c, doc):
    pw, ph = c._pagesize
    c.saveState()
    c.setFillColor(GRIS); c.setFont("Helvetica", 7)
    c.drawString(48, ph - 30, doc.encabezado.upper())
    c.setStrokeColor(GRIS_CLARO); c.setLineWidth(0.6)
    c.line(48, ph - 41, pw - 48, ph - 41)
    c.line(48, 40, pw - 48, 40)
    c.drawRightString(pw - 48, 28, f"Página {doc.page - 1}")
    c.restoreState()


def estilos():
    return {
        "titulo": ParagraphStyle("titulo", fontName="Helvetica-Bold", fontSize=20, leading=26,
                                 textColor=GUINDA, alignment=TA_CENTER, spaceAfter=8),
        "bajada": ParagraphStyle("bajada", fontName="Helvetica", fontSize=9.5, leading=13,
                                 textColor=GRIS, alignment=TA_CENTER, spaceAfter=10),
        "h1": ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=15, leading=20,
                             textColor=GUINDA, spaceBefore=10, spaceAfter=6),
        "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=11, leading=15,
                             textColor=TEXTO, spaceBefore=6, spaceAfter=4),
        "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9, leading=13.5,
                               textColor=TEXTO, alignment=TA_JUSTIFY, spaceAfter=6),
        "bullet": ParagraphStyle("bullet", fontName="Helvetica", fontSize=9, leading=13.5,
                                 textColor=TEXTO, spaceAfter=5),
        "celda": ParagraphStyle("celda", fontName="Helvetica", fontSize=7.5, leading=10, textColor=TEXTO),
        "celda_h": ParagraphStyle("celda_h", fontName="Helvetica-Bold", fontSize=7.5, leading=10,
                                  textColor=HexColor("#FFFFFF")),
    }


def tabla(filas, anchos):
    """filas[0] = encabezado. Devuelve Table con el estilo guinda del formato."""
    s = estilos()
    c = lambda x, st: x if hasattr(x, "wrap") else Paragraph(str(x), st)  # acepta texto o flowables
    data = [[c(x, s["celda_h"]) for x in filas[0]]] + [[c(x, s["celda"]) for x in f] for f in filas[1:]]
    t = Table(data, colWidths=anchos, repeatRows=1, hAlign="LEFT")
    st = [("BACKGROUND", (0, 0), (-1, 0), GUINDA),
          ("GRID", (0, 0), (-1, -1), 0.5, GRIS_CLARO),
          ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
          ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]
    for i in range(2, len(data), 2):
        st.append(("BACKGROUND", (0, i), (-1, i), FILA_ALTERNA))
    t.setStyle(TableStyle(st))
    return t


def enlace(url, texto=None):
    """Enlace clicable para usar dentro de un Paragraph (también en celdas de tabla)."""
    return f'<link href="{url}" color="#7B173B"><u>{texto or url}</u></link>'


def figura(ruta, pie="", ancho=420, alto_max=470):
    """Imagen escalada proporcionalmente + pie de figura centrado. No se parte entre páginas."""
    from PIL import Image as PILImage
    w, h = PILImage.open(ruta).size
    esc = min(ancho / w, alto_max / h)
    img = Image(ruta, w * esc, h * esc)
    img.hAlign = "CENTER"
    pie_st = ParagraphStyle("pie", fontName="Helvetica-Oblique", fontSize=8, leading=11,
                            textColor=GRIS, alignment=TA_CENTER, spaceBefore=4, spaceAfter=10)
    return KeepTogether([img, Paragraph(pie, pie_st)] if pie else [img])


def horizontal():
    """Las páginas siguientes en horizontal (para tablas anchas)."""
    return [NextPageTemplate("horizontal"), PageBreak()]


def vertical():
    """Regresa a páginas verticales."""
    return [NextPageTemplate("interior"), PageBreak()]


def build_pdf(salida, titulo, subtitulo="", cuerpo=None, encabezado=None, fecha="Noviembre de 2026",
              alumno=ALUMNO, matricula=MATRICULA, integrantes=None):
    """alumno/matricula: para entregas individuales de otro integrante.
    integrantes: [(nombre, matricula), ...] para portada de equipo (sustituye alumno/matrícula)."""
    doc = BaseDocTemplate(salida, pagesize=letter, title=titulo,
                          author=", ".join(n for n, _ in integrantes) if integrantes else alumno)
    doc.alumno, doc.matricula, doc.integrantes = alumno, matricula, integrantes
    doc.titulo, doc.subtitulo, doc.fecha = titulo, subtitulo, fecha
    doc.encabezado = encabezado or f"{MATERIA} · {titulo}"
    marco = Frame(54, 54, W - 108, H - 108, id="f")
    doc.addPageTemplates([PageTemplate("portada", [Frame(0, 0, W, H)], onPage=_portada),
                          PageTemplate("interior", [marco], onPage=_interior)])
    LW, LH = landscape(letter)
    doc.addPageTemplates([PageTemplate("horizontal", [Frame(54, 54, LW - 108, LH - 108, id="fh")],
                                       onPage=_interior, pagesize=landscape(letter))])
    plano = []
    for x in (cuerpo or [Spacer(1, 1)]):
        plano.extend(x if isinstance(x, list) else [x])
    historia = [NextPageTemplate("interior"), PageBreak()] + plano
    doc.build(historia)
