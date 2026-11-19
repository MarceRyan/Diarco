/**
 * Destino del enlace del correo de confirmación de Supabase. Acepta los dos formatos:
 *  - ?code=...                       plantilla por defecto (flujo PKCE de @supabase/ssr)
 *  - ?token_hash=...&type=email      plantilla personalizada:
 *      {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 */
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";

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

  if (confirmado) return NextResponse.redirect(new URL("/hoy", request.url));

  const url = new URL("/login", request.url);
  url.searchParams.set("error", "enlace");
  return NextResponse.redirect(url);
}
