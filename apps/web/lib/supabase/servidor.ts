/**
 * Cliente de Supabase para el servidor (Route Handlers y Server Actions).
 * Crear uno nuevo por petición: nunca compartirlo entre usuarios.
 */
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./entorno";

export async function crearClienteServidor() {
  const almacen = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(cookiesNuevas) {
        try {
          cookiesNuevas.forEach(({ name, value, options }) => almacen.set(name, value, options));
        } catch {
          // Llamado desde un Server Component, donde no se pueden escribir
          // cookies. No pasa nada: proxy.ts refresca la sesión en cada petición.
        }
      },
    },
  });
}
