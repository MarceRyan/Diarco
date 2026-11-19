/**
 * Variables públicas de Supabase. Next.js las incrusta en el bundle del
 * navegador, por eso solo pueden ser la URL y la publishable key (nunca la
 * secret / service_role key).
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** true si las variables están configuradas en .env.local. */
export const supabaseConfigurado = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
