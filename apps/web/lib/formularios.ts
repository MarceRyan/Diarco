import type { z } from "zod";

/** Convierte los errores de Zod en { campo: primer mensaje } para mostrarlos junto a cada campo. */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "_");
    errores[campo] ??= issue.message;
  }
  return errores;
}

/** Mensaje legible de cualquier error (ErrorDiarco ya viene en español). */
export function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : "Algo salió mal. Inténtalo de nuevo.";
}
