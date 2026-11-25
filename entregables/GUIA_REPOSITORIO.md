# Guía para subir AlertaVecinal a GitHub (por integrante)

El repositorio nuevo `JazyelAe/alertavecinal` se construye desde cero, con los commits de cada integrante numerados por paso.
Cada integrante trabaja en su propia rama (`jaziel`, `luis` o `yeudiel`) y pide unir sus cambios a `main` con un Pull Request.
Cada quien recibe un zip con sus archivos y un instructivo completo con los comandos para **Windows (PowerShell)**:

| Integrante | Nombre | Responsabilidad | Zip |
|---|---|---|---|
| 1 | Serrano Arana Jahir Jaziel | Base web, caché y "Alerta sin señal" | `Integrante1_Jaziel_Serrano.zip` |
| 2 | Xicali Diaz Luis Alberto | Mapa, notificaciones push y "Mapa de calor" | `Integrante2_Luis_Xicali.zip` |
| 3 | Gonzalez Barrios Yeudiel Nain | Administración, instalación y "Vecino Verificado Pro" | `Integrante3_Yeudiel_Gonzalez.zip` |

La app sigue usando la base de datos actual (proyecto Firebase `alertavecinal-10d`) y se publica en
<https://jazyelae.github.io/alertavecinal/>.

---

## 1. Pasos y reparto de archivos

Cada archivo se sube una sola vez, en un solo paso. Cada quien hace **sus** pasos en orden, en su rama; no hace falta
esperar a los demás, porque nadie toca archivos de otro.

| Paso | Integrante | Acción o commit | Archivos |
|---|---|---|---|
| 01 | Jaziel | Crear repo vacío, agregar colaboradores y comprobar acceso a Firebase | (sin archivos) |
| 02 | Jaziel | `Aplicación web base` | `.gitignore`, `index.html`, `css/estilos.css`, `js/firebase-config.js`, `js/auth.js`, `js/alertas.js`, `firebase.json`, `firestore.rules` |
| 03 | Jaziel | `Conversión a PWA: manifest y caché` | `manifest.json`, `iconos/badge-96.png`, `iconos/icon-192.png`, `iconos/icon-512.png`, `iconos/icon-maskable-512.png`, `sw.js`, `offline.html`, `demo-cache.html`, `js/cache-demo.js`, `js/app.js` |
| 04 | Luis | `Mapa de alertas con Leaflet y Nominatim` | `js/mapa.js` |
| 05 | Yeudiel | `Panel de administración de usuarios` | `js/admin.js`, `admin.html` |
| 06 | Yeudiel | `Botón de instalación de la PWA` | `js/instalar.js` |
| 07 | Luis | `Notificaciones push con FCM` | `sw-push.js`, `js/push.js`, `demo-push.html`, `scripts/enviar-push.js`, `scripts/package.json`, `scripts/apps-script/Codigo.gs` |
| 08 | Jaziel | `Aportación: Alerta sin señal` | `js/offline-sync.js`, `sw-sync.js` |
| 09 | Luis | `Aportación: Mapa de calor de incidentes` | `js/heatmap.js` |
| 10 | Yeudiel | `Aportación: Vecino Verificado Pro` | `estadisticas.html`, `js/estadisticas.js` |
| 11 | Jaziel | Publicar desde el repo nuevo, conectar la base actual y hacer pruebas | (sin archivos) |
| 12 | Jaziel | `Documentación Subproducto 4` | `entregables/Subproducto4_API_Cache.pdf` |
| 13 | Luis | `Documentación Subproducto 6` | `entregables/Subproducto6_Notificaciones.pdf` |
| 14 | Yeudiel | `Documentación Subproducto 5 y README` | `entregables/Subproducto5_Aportacion.pdf`, `README.md`, `entregables/GUIA_REPOSITORIO.md`, `entregables/GUIA_REPOSITORIO.pdf` |
| 15 | Jaziel | Verificación final y desactivación del repo anterior | `sw.js` de retiro, solo para el repo anterior |

### Archivos que NO se suben

| Archivo o carpeta | Motivo |
|---|---|
| `scripts/serviceAccountKey.json`, `*-firebase-adminsdk-*.json` | Clave privada de Firebase. **Nunca** se sube. |
| `node_modules/` | Se instala con `npm install`. |
| `reportes/` | Herramientas locales para probar la app y generar los PDF. |
| `.firebaserc`, `.firebase/` | Archivos locales de Firebase CLI. |
| `INSTRUCCIONES_*.md` | Son solo para cada integrante. |

### ¿Por qué nadie edita archivos de otro?

- `index.html` ya carga todos los módulos e **ignora los que aún no existen**. Cada módulo agrega su enlace del menú y su tarjeta.
- `sw.js` carga `sw-push.js` y `sw-sync.js` dentro de `try/catch`.
- `css/estilos.css` ya trae los estilos de todas las pantallas.

Por eso **en cada commit intermedio la app abre**. Hasta que se suba un módulo, solo aparece un aviso en la consola
del navegador.

---

## 2. Reglas para todos

1. Sigue tu instructivo `INSTRUCCIONES_*.md`, en orden.
2. Descomprime el zip **fuera** del repositorio (el instructivo usa `$HOME\AlertaVecinal\zip`).
3. Trabaja siempre en tu rama (`git switch` con tu nombre). `main` está protegida: nadie sube directo a ella.
4. Usa `git add` con la lista exacta de archivos del paso, nunca con otros.
5. Comprueba la app en una **ventana de incógnito nueva** con `?demo=1`: en una ventana normal, el service worker del
   paso 03 no toma los archivos `sw-push.js` y `sw-sync.js` que se suben después.
6. Al subir tu paso, abre un **Pull Request** de tu rama hacia `main`. Jaziel lo une con un *merge commit*, que conserva
   el autor de cada commit (*Squash* y *Rebase* están desactivados).

---

## 3. Verificar que aparecen los 3 integrantes

En GitHub abre el repositorio > **Insights** > **Contributors**. Deben aparecer las tres cuentas con sus commits (puede tardar
unos minutos). Si un commit sale sin foto, el correo de `git config` no coincide con la cuenta: agrégalo en
GitHub > **Settings** > **Emails**.

---

## 4. Recordatorios importantes

- **Nunca subas `serviceAccountKey.json`.** Si se sube por error, elimina esa clave en la consola de Firebase
  (*Cuentas de servicio*) y genera otra: borrarla del repositorio no basta, porque queda en el historial.
- La clave web de `js/firebase-config.js` no es secreta. Si GitHub avisa que encontró una "Google API Key" ahí, es esperado.
- **No ejecutes `firebase init` ni `firebase deploy` sin opciones:** pueden reemplazar la configuración y las reglas publicadas.
- El repositorio anterior no se borra: se archiva en el paso 15, después de que todas las pruebas pasen.
