/**
 * Esquemas Zod reutilizables. Sus límites replican los CHECK de la base de
 * datos para que los formularios fallen antes de llegar al servidor.
 */
import { z } from "zod";
import { esZonaHorariaValida } from "../logic/fechas";

/** Identificador numérico (bigint identity en Postgres). */
export const idSchema = z.number().int().positive();

/** UUID de usuario (auth.users.id). */
export const uuidSchema = z.uuid({ error: "Identificador de usuario inválido" });

/** Fecha de calendario `AAAA-MM-DD` que existe (rechaza 2026-02-30). */
export const fechaSchema = z.iso.date({ error: "Fecha inválida (formato AAAA-MM-DD)" });

/** Instante con zona (timestamptz), como lo devuelve Supabase. */
export const instanteSchema = z.iso.datetime({ offset: true, error: "Fecha y hora inválidas" });

/** Hora del día `HH:MM` o `HH:MM:SS` (Postgres devuelve segundos). */
export const horaSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, { error: "Hora inválida (formato HH:MM)" });

/** Color hexadecimal `#rrggbb`. */
export const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, { error: "Color inválido (formato #rrggbb)" });

/** Días de la semana: 0 = domingo … 6 = sábado, sin repetir, al menos uno. */
export const diasSemanaSchema = z
  .array(z.number().int().min(0).max(6), { error: "Días de la semana inválidos" })
  .min(1, { error: "Elige al menos un día" })
  .max(7)
  .refine((dias) => new Set(dias).size === dias.length, { error: "Hay días repetidos" });

/** Zona horaria IANA existente (ej. America/Lima). */
export const zonaHorariaSchema = z
  .string()
  .refine(esZonaHorariaValida, { error: "Zona horaria desconocida" });

/** Texto obligatorio, sin espacios sobrantes, con largo máximo. */
export const textoObligatorio = (max: number, campo: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `${campo} es obligatorio` })
    .max(max, { error: `${campo} admite hasta ${max} caracteres` });

/** Texto opcional: vacío se guarda como null. */
export const textoOpcional = (max: number, campo: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${campo} admite hasta ${max} caracteres` })
    .nullish()
    .transform((v) => (v ? v : null));
