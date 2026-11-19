/**
 * Utilidades comunes de la capa de datos: tipo del cliente, validación de
 * respuestas con Zod y traducción de errores de Postgres a mensajes en español.
 */
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

/** Cliente de Supabase usado por web y móvil. */
export type ClienteDiarco = SupabaseClient;

/** Error con mensaje listo para mostrar al usuario. */
export class ErrorDiarco extends Error {
  constructor(
    message: string,
    /** Código original de Postgres/PostgREST, útil para depurar. */
    readonly codigo?: string,
  ) {
    super(message);
    this.name = "ErrorDiarco";
  }
}

/** Traduce un error de Supabase a un mensaje comprensible. */
export function traducirError(error: Pick<PostgrestError, "code" | "message">): ErrorDiarco {
  const mensajes: Record<string, string> = {
    "23505": "Ya existe un registro igual.",
    "23514": "Algún dato no es válido.",
    "23503": "El elemento relacionado ya no existe.",
    "42501": "No tienes permiso para hacer esto. Vuelve a iniciar sesión.",
    "22023": "El rango de fechas no es válido.",
    PGRST116: "No se encontró el elemento.",
    PGRST301: "Tu sesión expiró. Vuelve a iniciar sesión.",
    // Columna o función nueva que aún no existe en la base: faltan migraciones.
    PGRST204: "Tu base de datos necesita actualizarse (supabase db push).",
    PGRST202: "Tu base de datos necesita actualizarse (supabase db push).",
    "42703": "Tu base de datos necesita actualizarse (supabase db push).",
  };
  return new ErrorDiarco(mensajes[error.code] ?? "Algo salió mal. Inténtalo de nuevo.", error.code);
}

/** Respuesta típica de supabase-js. */
interface Respuesta {
  data: unknown;
  error: PostgrestError | null;
}

/** Lanza si hay error y valida los datos con el esquema. */
export function validar<T>(respuesta: Respuesta, esquema: z.ZodType<T>): T {
  if (respuesta.error) throw traducirError(respuesta.error);
  const resultado = esquema.safeParse(respuesta.data);
  if (!resultado.success) {
    throw new ErrorDiarco("Los datos recibidos no tienen el formato esperado.", "VALIDACION");
  }
  return resultado.data;
}

/** Lanza si hay error (para operaciones que no devuelven datos). */
export function comprobar(respuesta: Pick<Respuesta, "error">): void {
  if (respuesta.error) throw traducirError(respuesta.error);
}

/** Tamaño de página: PostgREST devuelve como máximo 1000 filas por petición. */
export const TAMANO_PAGINA = 1000;

/**
 * Pide todas las páginas de una consulta hasta agotarla.
 * @param pagina función que pide el rango [desde, hasta] (ambos incluidos)
 */
export async function obtenerTodo<T>(
  pagina: (desde: number, hasta: number) => PromiseLike<Respuesta>,
  esquema: z.ZodType<T[]>,
): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += TAMANO_PAGINA) {
    const lote = validar(await pagina(desde, desde + TAMANO_PAGINA - 1), esquema);
    filas.push(...lote);
    if (lote.length < TAMANO_PAGINA) return filas;
  }
}
