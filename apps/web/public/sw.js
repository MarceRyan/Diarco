/*
 * Service worker de Diarco (PWA).
 *  - Páginas: siempre desde internet; si no hay conexión, se muestra /offline.
 *  - Archivos estáticos con huella (/_next/static, íconos, fuentes): se guardan
 *    la primera vez y luego se sirven desde el caché (la app abre rápido).
 *  - Nada de datos: las consultas a Supabase (otro dominio) no se tocan.
 * Al cambiar VERSION se borran los cachés viejos.
 */
const VERSION = "diarco-v1";
const ESTATICOS = `${VERSION}-estaticos`;
const PAGINAS = `${VERSION}-paginas`;
const SIN_CONEXION = "/offline";

/** Guarda la página sin conexión y todos los archivos que necesita (si no, Next no puede mostrarla). */
async function guardarSinConexion() {
  const respuesta = await fetch(new Request(SIN_CONEXION, { cache: "reload" }));
  if (!respuesta.ok) return;
  await (await caches.open(PAGINAS)).put(SIN_CONEXION, respuesta.clone());
  const html = await respuesta.text();
  const recursos = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) ?? [])];
  const estaticos = await caches.open(ESTATICOS);
  await Promise.all(recursos.map((url) => estaticos.add(url).catch(() => {})));
}

self.addEventListener("install", (evento) => {
  evento.waitUntil(guardarSinConexion().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => !c.startsWith(VERSION)).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if (peticion.method !== "GET") return;
  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return; // Supabase y otros dominios: sin tocar

  // Navegación: internet primero; sin conexión, la página de aviso.
  if (peticion.mode === "navigate") {
    evento.respondWith(fetch(peticion).catch(() => caches.match(SIN_CONEXION)));
    return;
  }

  // Estáticos con huella: caché primero.
  const estatico = url.pathname.startsWith("/_next/static/") || /\.(?:png|svg|ico|woff2?)$/.test(url.pathname);
  if (estatico) {
    evento.respondWith(
      caches.match(peticion).then(
        (guardada) =>
          guardada ||
          fetch(peticion).then((respuesta) => {
            if (respuesta.ok) {
              const copia = respuesta.clone();
              caches.open(ESTATICOS).then((cache) => cache.put(peticion, copia));
            }
            return respuesta;
          }),
      ),
    );
  }
});
