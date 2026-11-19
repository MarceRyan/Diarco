/**
 * Cliente de Supabase para el navegador (Client Components).
 * createBrowserClient guarda la sesión en cookies, así proxy.ts y el
 * servidor pueden leerla. Es un singleton: se puede llamar varias veces.
 */
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./entorno";

export function crearClienteNavegador() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
