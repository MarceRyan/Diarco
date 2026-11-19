/**
 * Destino del enlace del correo de confirmación de Supabase.
 * Plantilla de correo: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 */
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && tipo) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL("/hoy", request.url));
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("error", "enlace");
  return NextResponse.redirect(url);
}
