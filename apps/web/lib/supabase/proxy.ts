/**
 * Lógica de sesión que corre en proxy.ts en cada petición:
 *  1. Refresca el token de Supabase y lo reescribe en las cookies.
 *  2. Redirige a /login si no hay sesión y la ruta es privada, o a /hoy si
 *     ya hay sesión y se visita /login o /registro.
 *
 * Es un control optimista de navegación: la seguridad de los datos la
 * garantiza RLS en la base de datos.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigurado } from "./entorno";

/** Rutas accesibles sin sesión. */
const RUTAS_PUBLICAS = ["/login", "/registro", "/recuperar", "/auth"];
/** Rutas que no tiene sentido ver con sesión iniciada. */
const RUTAS_SOLO_INVITADOS = ["/login", "/registro", "/recuperar"];

const empiezaCon = (ruta: string, prefijos: string[]) =>
  prefijos.some((p) => ruta === p || ruta.startsWith(`${p}/`));

export async function actualizarSesion(request: NextRequest) {
  // Sin variables de entorno no hay sesión posible: se deja pasar para que la
  // página muestre el aviso de configuración en vez de un bucle de redirecciones.
  if (!supabaseConfigurado) return NextResponse.next({ request });

  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesNuevas, cabeceras) {
        cookiesNuevas.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        cookiesNuevas.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
        // Evita que un CDN guarde en caché la cookie de sesión de un usuario.
        Object.entries(cabeceras).forEach(([clave, valor]) => respuesta.headers.set(clave, valor));
      },
    },
  });

  // getClaims() valida el JWT (no confiar en getSession() en el servidor).
  // No poner código entre createServerClient y esta llamada.
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims?.sub);
  const ruta = request.nextUrl.pathname;

  const redirigir = (destino: string) => {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    url.search = "";
    const redireccion = NextResponse.redirect(url);
    // Conserva las cookies (y cabeceras) que haya escrito el refresco del token.
    respuesta.cookies.getAll().forEach((c) => redireccion.cookies.set(c));
    ["cache-control", "expires", "pragma"].forEach((h) => {
      const valor = respuesta.headers.get(h);
      if (valor) redireccion.headers.set(h, valor);
    });
    return redireccion;
  };

  if (!conSesion && !empiezaCon(ruta, RUTAS_PUBLICAS)) return redirigir("/login");
  if (conSesion && empiezaCon(ruta, RUTAS_SOLO_INVITADOS)) return redirigir("/hoy");

  return respuesta;
}
