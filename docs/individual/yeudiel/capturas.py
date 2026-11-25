"""Toma las capturas de los PDF individuales de Yeudiel (SP4–SP7).

Usa Playwright con el navegador Edge instalado (channel="msedge").
- App publicada: https://jazyelae.github.io/alertavecinal/
- Ejemplo mínimo propio y diagramas: servidor local temporal (http.server) en la raíz del repo.
Guarda las imágenes en docs/individual/yeudiel/capturas/ y los datos medidos en capturas/verificacion.json.

Uso (desde la raíz del repo):  python docs/individual/yeudiel/capturas.py
"""
import json
import os
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, "..", "..", ".."))
SALIDA = os.path.join(AQUI, "capturas")
APP = "https://jazyelae.github.io/alertavecinal/"
BACKEND = ("https://script.google.com/macros/s/AKfycbyA-8YNUHxTZ0XILx0vCNW0PV-lX_SlT-"
           "zDDEMG_7wUcgRelPpH_9_MfC0GzfSZihiJkg/exec")
PUERTO = 8765
LOCAL = f"http://localhost:{PUERTO}/"
os.makedirs(SALIDA, exist_ok=True)
datos = {}


class Silencioso(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def servidor():
    srv = ThreadingHTTPServer(("localhost", PUERTO), partial(Silencioso, directory=RAIZ))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def foto(pg, nombre, **kw):
    pg.screenshot(path=os.path.join(SALIDA, nombre), **kw)
    print("  ✔", nombre)


def esperar_sw(pg):
    pg.evaluate("navigator.serviceWorker.ready.then(() => true)")
    pg.wait_for_timeout(1500)


def clic(pg, selector, espera=900):
    pg.click(selector)
    pg.wait_for_timeout(espera)


def main():
    srv = servidor()
    with sync_playwright() as p:
        nav = p.chromium.launch(channel="msedge")
        ctx = nav.new_context(viewport={"width": 1280, "height": 800}, locale="es-MX",
                              device_scale_factor=1.5)

        # ---------- SP4: demo-cache.html publicada ----------
        pg = ctx.new_page()
        pg.goto(APP + "demo-cache.html")
        esperar_sw(pg)
        pg.reload(); pg.wait_for_timeout(2500)
        clic(pg, "[data-metodo=cachesKeys]")
        foto(pg, "sp4-01-caches-keys.png", full_page=True)
        datos["caches_keys"] = pg.evaluate("caches.keys()")
        shell = next((n for n in datos["caches_keys"] if n.startswith("alertavecinal-v")), None)
        if shell:
            pg.select_option("#demo-cache-nombre", shell)
        clic(pg, "[data-metodo=cacheKeys]")
        foto(pg, "sp4-02-cache-keys.png", full_page=True)
        clic(pg, "[data-metodo=cacheMatch]")
        foto(pg, "sp4-03-cache-match.png", full_page=True)
        clic(pg, "[data-metodo=cachePut]")
        foto(pg, "sp4-04-cache-put.png", full_page=True)
        datos["shell_entradas"] = pg.evaluate(
            f"caches.open({json.dumps(shell or '')}).then(c => c.keys()).then(k => k.length)")
        datos["sw_version"] = pg.inner_text("#sw-version")
        datos["sw_estado"] = pg.inner_text("#sw-estado")

        # ---------- PWA: manifest, service worker, offline ----------
        pg.goto(APP + "?demo=1"); esperar_sw(pg); pg.reload(); pg.wait_for_timeout(3500)
        foto(pg, "pwa-01-inicio-demo.png")
        datos["pwa"] = pg.evaluate("""async () => {
          const m = await (await fetch('manifest.json')).json();
          const r = await navigator.serviceWorker.getRegistration();
          return { https: location.protocol, display: m.display, start_url: m.start_url,
                   iconos: m.icons.map(i => i.sizes + ' ' + (i.purpose || 'any')),
                   sw_scope: r && r.scope, sw_estado: r && r.active && r.active.state,
                   controlada: !!navigator.serviceWorker.controller,
                   indexeddb: 'indexedDB' in window, sync: !!(r && 'sync' in r),
                   push: 'PushManager' in window, compartir: 'share' in navigator,
                   geolocalizacion: 'geolocation' in navigator, vibracion: 'vibrate' in navigator };
        }""")
        ctx.set_offline(True)
        pg.reload(); pg.wait_for_timeout(3000)
        foto(pg, "pwa-02-sin-conexion.png")
        pg.goto(APP + "pagina-que-no-esta-en-cache.html"); pg.wait_for_timeout(1500)
        foto(pg, "pwa-03-offline-html.png")
        ctx.set_offline(False)

        movil = nav.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2,
                                is_mobile=True, has_touch=True, locale="es-MX")
        pm = movil.new_page(); pm.goto(APP + "?demo=1"); pm.wait_for_timeout(4000)
        foto(pm, "pwa-04-movil.png")
        movil.close()

        # ---------- SP5 / SP7: Panel Pro y Administración en demo ----------
        pg.goto(APP + "estadisticas.html?demo=1"); pg.wait_for_timeout(4000)
        foto(pg, "sp5-01-panel-pro-demo.png", full_page=True)
        pg.goto(APP + "admin.html?demo=1"); pg.wait_for_timeout(4000)
        foto(pg, "sp5-02-admin-demo.png", full_page=True)
        boton = pg.locator("button", has_text="Verificar domicilio").first
        if boton.count():
            boton.click(); pg.wait_for_timeout(1500)
            foto(pg, "sp5-03-admin-verificado-demo.png", full_page=True)

        # ---------- SP7: estado del backend (JSON) ----------
        pg.goto(BACKEND); pg.wait_for_timeout(4000)
        foto(pg, "sp7-01-backend-estado.png")
        try:
            datos["backend"] = json.loads(pg.inner_text("body"))
        except Exception as e:  # noqa: BLE001
            datos["backend"] = {"error": str(e)}
        pg.goto(BACKEND + "?vista=verificado&uid=noExiste123"); pg.wait_for_timeout(4000)
        foto(pg, "sp7-02-ficha-no-disponible.png")

        # ---------- SP6: demo-push.html publicada ----------
        pg.goto(APP + "demo-push.html"); pg.wait_for_timeout(4000)
        foto(pg, "sp6-01-demo-push.png", full_page=True)
        pg.click("#btn-pagina"); pg.wait_for_timeout(1200)
        foto(pg, "sp6-02-mensaje-primer-plano.png")

        # ---------- Ejemplo mínimo propio (local) ----------
        ctx_l = nav.new_context(viewport={"width": 1100, "height": 900}, device_scale_factor=1.5,
                                locale="es-MX")
        ctx_l.grant_permissions(["notifications"], origin=LOCAL.rstrip("/"))
        pe = ctx_l.new_page()
        pe.goto(LOCAL + "docs/individual/yeudiel/ejemplo/"); esperar_sw(pe)
        clic(pe, "[data-paso=guardar]")
        foto(pe, "ej-01-guardar.png", full_page=True)
        clic(pe, "[data-paso=listar]")
        foto(pe, "ej-02-listar.png", full_page=True)
        clic(pe, "[data-paso=buscar]")
        foto(pe, "ej-03-buscar.png", full_page=True)
        clic(pe, "[data-paso=existe]")
        foto(pe, "ej-04-has.png", full_page=True)
        clic(pe, "[data-paso=borrar]")
        foto(pe, "ej-05-borrar.png", full_page=True)
        clic(pe, "[data-paso=notificar]", 1800)
        foto(pe, "ej-06-notificacion.png", full_page=True)
        datos["ejemplo_notificacion"] = pe.inner_text("#salida")

        # ---------- Diagramas ----------
        pd = ctx_l.new_page()
        pd.goto(LOCAL + "docs/individual/yeudiel/diagramas/diagramas.html")
        for id_, nombre in [("d-verificado", "diag-01-verificado.png"),
                            ("d-push", "diag-02-push.png"), ("d-backend", "diag-03-backend.png")]:
            pd.locator("#" + id_).screenshot(path=os.path.join(SALIDA, nombre)); print("  ✔", nombre)

        nav.close()
    srv.shutdown()
    with open(os.path.join(SALIDA, "verificacion.json"), "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
    print(json.dumps(datos, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
