import { supabaseConfigurado } from "@/lib/supabase/entorno";

/** Aviso visible si faltan las variables de Supabase en .env.local. */
export function AvisoConfiguracion() {
  if (supabaseConfigurado) return null;
  return (
    <div role="alert" className="rounded-[20px] border-2 border-mandarina/40 bg-mandarina-suave p-4 text-sm">
      <p className="font-extrabold">Falta configurar Supabase</p>
      <p className="mt-1 text-texto-suave">
        Copia <code>.env.example</code> como <code>apps/web/.env.local</code>, completa{" "}
        <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> y reinicia{" "}
        <code>pnpm dev:web</code>.
      </p>
    </div>
  );
}
