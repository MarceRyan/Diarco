/**
 * Destino del enlace del correo de confirmación de Supabase. Acepta los dos formatos:
 *  - ?code=...                       plantilla por defecto (flujo PKCE de @supabase/ssr)
 *  - ?token_hash=...&type=email      plantilla personalizada:
 *      {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 */
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";

/**
 * A dónde ir después de confirmar (?siguiente=/nueva-contrasena). Solo se aceptan
 * rutas internas: evita que el enlace sirva para redirigir a otro sitio.
 * Se resuelve la URL y se compara el origen, porque el navegador ignora tabs y
 * saltos de línea ("/\t/otro.com" acaba siendo "//otro.com").
 */
function destinoSeguro(siguiente: string | null, base: URL): URL {
  const porDefecto = new URL("/hoy", base);
  if (!siguiente || !siguiente.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(siguiente)) return porDefecto;
  try {
    const destino = new URL(siguiente, base);
    return destino.origin === base.origin ? destino : porDefecto;
  } catch {
    return porDefecto;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const codigo = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;

  const supabase = await crearClienteServidor();
  let confirmado = false;

  if (codigo) {
    // El verificador PKCE lo guardó el navegador en una cookie al registrarse.
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    confirmado = !error;
  } else if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    confirmado = !error;
  }

  if (confirmado) return NextResponse.redirect(destinoSeguro(searchParams.get("siguiente"), request.nextUrl));

  const url = new URL("/login", request.url);
  url.searchParams.set("error", "enlace");
  return NextResponse.redirect(url);
}
