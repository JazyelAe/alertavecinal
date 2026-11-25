"""Genera el PDF del Producto 2 a partir de las secciones de cada integrante.

Lee docs/producto2/jaziel.md, luis.md y yeudiel.md (los que existan). En cada archivo,
los apartados "## N. Título" se reparten en el documento por su número, así que cada
quien escribe solo su archivo y nadie edita el de otro. Las imágenes ![pie](ruta) se
numeran como figuras. Las referencias de todos se juntan, sin repetir, en orden alfabético.

Uso (desde la raíz del repo):
    pip install reportlab pillow
    python docs/producto2/generar_pdf.py                  # entregables/Producto2_AlertaVecinal_Equipo.pdf
    python docs/producto2/generar_pdf.py borrador.pdf     # otra ruta, para revisar
"""
import html
import os
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
sys.path.insert(0, os.path.join(RAIZ, "docs", "claude-kit", "tools"))
from utp_doc import Paragraph, Spacer, build_pdf, enlace, estilos, figura, tabla  # noqa: E402

INTEGRANTES = [
    ("jaziel", "Serrano Arana Jahir Jaziel", "2311080845"),
    ("luis", "Xicali Diaz Luis Alberto", "2311081407"),
    ("yeudiel", "Gonzalez Barrios Yeudiel Nain", "2311081344"),
]
# Títulos del documento. Del 2 al 6 son literalmente los que pide la profesora.
SECCIONES = {
    1: "1. Caso de estudio",
    2: "2. Justificación de las plataformas y herramientas utilizadas",
    3: "3. Parámetros de configuración de las plataformas y herramientas utilizadas",
    4: "4. Reporte de pruebas",
    5: "5. Evidencias de las características de la PWA",
    6: "6. Vínculo (URL) de la aplicación publicada",
    7: "7. Aportaciones del equipo",
    8: "8. Conclusiones",
}
ANCHO = 504  # ancho útil de la página vertical, en puntos

s = estilos()
s["h1"].keepWithNext = 1  # un título nunca queda solo al final de la página
s["h2"].keepWithNext = 1
num_figura = 0
# Helvetica no tiene emojis: los estados de las pruebas se escriben con texto.
ESTADOS = {"✅": '<font color="#1e7b45"><b>Aprobada</b></font>', "❌": '<font color="#b3261e"><b>Falla</b></font>'}


def leer_secciones(ruta):
    """Devuelve {número: [líneas]} y la lista de referencias de un archivo .md."""
    partes, referencias, actual = {}, [], None
    for linea in open(ruta, encoding="utf-8").read().splitlines():
        m = re.match(r"^##\s+(\d+)\.", linea)
        if m and re.search(r"sugerid", linea, re.I):
            actual = None  # "Evidencias sugeridas": notas para el coordinador, no van en el documento
            continue
        if m:
            actual = int(m.group(1))
            partes.setdefault(actual, [])
            continue
        if re.match(r"^##\s+Referencias", linea):
            actual = "ref"
            continue
        if linea.startswith("## "):
            actual = None
            continue
        if actual == "ref":
            if linea.startswith("- "):
                referencias.append(linea[2:].strip())
        elif actual is not None:
            partes[actual].append(linea)
    return partes, referencias


def en_linea(texto):
    """Markdown en línea (negritas, cursivas, código y enlaces) a las etiquetas de reportlab."""
    t = html.escape(texto, quote=False)
    codigos = []

    def guardar(m):
        codigos.append(m.group(1))
        return f"\x00{len(codigos) - 1}\x00"

    t = re.sub(r"`([^`]+)`", guardar, t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", t)
    t = re.sub(r"(https?://[^\s<|)]+[^\s<|).,;:])", lambda m: enlace(m.group(1)), t)
    for simbolo, texto in ESTADOS.items():
        t = t.replace(simbolo, texto)
    return re.sub(r"\x00(\d+)\x00", lambda m: f'<font face="Courier">{codigos[int(m.group(1))]}</font>', t)


def anchos_columnas(filas):
    """Cada columna recibe al menos el ancho de su palabra más larga (para no partirla)
    y el resto del ancho se reparte según cuánto texto tiene en promedio."""
    columnas = range(len(filas[0]))
    celdas = [[re.sub(r"[`*]", "", f[c]) if c < len(f) else "" for f in filas] for c in columnas]
    palabra_larga = [max((len(p) for texto in col for p in texto.split()), default=4) for col in celdas]
    minimos = [min(130, 4.6 * n + 14) for n in palabra_larga]
    pesos = [max(4, sum(len(x) for x in col) / len(col)) for col in celdas]
    libre = ANCHO - sum(minimos)
    if libre <= 0:
        return [ANCHO * m / sum(minimos) for m in minimos]
    return [m + libre * p / sum(pesos) for m, p in zip(minimos, pesos)]


def bloques(lineas, ruta_md):
    """Convierte las líneas de un apartado en párrafos, listas, tablas y figuras."""
    global num_figura
    salida, parrafo, i = [], [], 0

    def cerrar_parrafo():
        if parrafo:
            salida.append(Paragraph(en_linea(" ".join(parrafo)), s["body"]))
            parrafo.clear()

    while i < len(lineas):
        linea = lineas[i].rstrip()
        if not linea.strip() or linea.strip() == "---":
            cerrar_parrafo()
        elif linea.startswith("### "):
            cerrar_parrafo()
            salida.append(Paragraph(en_linea(linea[4:]), s["h2"]))
        elif linea.startswith("|"):
            cerrar_parrafo()
            filas = []
            while i < len(lineas) and lineas[i].startswith("|"):
                celdas = [c.strip().replace("\\|", "|") for c in re.split(r"(?<!\\)\|", lineas[i].strip())[1:-1]]
                if not all(re.fullmatch(r":?-{3,}:?", c) for c in celdas):
                    filas.append(celdas)
                i += 1
            anchos = anchos_columnas(filas)
            salida.append(tabla([[en_linea(c) for c in f] for f in filas], anchos))
            salida.append(Spacer(1, 8))
            continue
        elif re.match(r"^!\[.*\]\(.*\)$", linea):
            cerrar_parrafo()
            pie, ruta = re.match(r"^!\[(.*)\]\((.*)\)$", linea).groups()
            num_figura += 1
            ruta = os.path.join(os.path.dirname(ruta_md), ruta)
            if os.path.exists(ruta):
                salida.append(figura(ruta, f"Figura {num_figura}. {en_linea(pie)}", ancho=ANCHO, alto_max=420))
            else:
                salida.append(Paragraph(f"<i>[Falta la imagen {html.escape(ruta)}]</i>", s["body"]))
        elif re.match(r"^\s*[-*] ", linea):
            cerrar_parrafo()
            texto = re.sub(r"^\s*[-*] ", "", linea)
            salida.append(Paragraph("• " + en_linea(texto), s["bullet"]))
        else:
            parrafo.append(linea.strip())
        i += 1
    cerrar_parrafo()
    return salida


def main():
    salida = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, "entregables", "Producto2_AlertaVecinal_Equipo.pdf")
    archivos = [(clave, nombre) for clave, nombre, _ in INTEGRANTES if os.path.exists(os.path.join(AQUI, f"{clave}.md"))]
    faltan = [nombre for clave, nombre, _ in INTEGRANTES if (clave, nombre) not in archivos]
    leidos = {clave: leer_secciones(os.path.join(AQUI, f"{clave}.md")) for clave, _ in archivos}

    cuerpo = [Paragraph("Contenido", s["h1"])]
    cuerpo += [Paragraph(t, s["bullet"]) for t in list(SECCIONES.values()) + ["Referencias"]]
    for numero, titulo in SECCIONES.items():
        aportes = [(nombre, leidos[clave][0][numero]) for clave, nombre in archivos if numero in leidos[clave][0]]
        cuerpo.append(Paragraph(titulo, s["h1"]))
        for nombre, lineas in aportes:
            if len(aportes) > 1:
                cuerpo.append(Paragraph(f"Parte de {nombre}", s["h2"]))
            cuerpo += bloques(lineas, os.path.join(AQUI, "x.md"))
        if not aportes:
            cuerpo.append(Paragraph("<i>Sin contenido todavía.</i>", s["body"]))

    referencias = sorted({r for clave, _ in archivos for r in leidos[clave][1]}, key=str.lower)
    cuerpo.append(Paragraph("Referencias", s["h1"]))
    cuerpo += [Paragraph(en_linea(r), s["bullet"]) for r in referencias]

    os.makedirs(os.path.dirname(os.path.abspath(salida)), exist_ok=True)
    build_pdf(salida,
              titulo="PRODUCTO No. 2: ALERTAVECINAL, RED DE SEGURIDAD VECINAL (PWA)",
              subtitulo="Unidad II – Desarrollo de aplicaciones web progresivas · Caso de estudio",
              cuerpo=cuerpo,
              encabezado="APLICACIONES WEB PROGRESIVAS · PRODUCTO 2",
              integrantes=[(nombre, matricula) for _, nombre, matricula in INTEGRANTES])
    print(f"PDF generado: {salida} ({num_figura} figuras)")
    if faltan:
        print("Aviso: todavía no hay sección de " + ", ".join(faltan))


if __name__ == "__main__":
    main()
