/**
 * Esquemas Zod de las tablas de Diarco.
 *
 * Por cada tabla hay dos esquemas:
 *   - `xxxSchema`: una fila tal como la devuelve Supabase.
 *   - `xxxNuevoSchema` / `xxxNuevaSchema`: datos de un formulario para crearla
 *     (sin id, usuario_id ni creado_en, que pone la base de datos).
 * Para editar se usa `.partial()` del esquema de creación.
 */
import { z } from "zod";
import { ETIQUETAS_ANIMO, MAX_ETIQUETAS_ANIMO, type EtiquetaAnimo } from "../constantes";
import {
  colorSchema,
  diasSemanaSchema,
  fechaSchema,
  horaSchema,
  idSchema,
  instanteSchema,
  textoObligatorio,
  textoOpcional,
  uuidSchema,
  zonaHorariaSchema,
} from "./comunes";

export * from "./comunes";

// -----------------------------------------------------------------------------
// perfiles
// -----------------------------------------------------------------------------
export const perfilSchema = z.object({
  id: uuidSchema,
  nombre: z.string().max(80),
  zona_horaria: zonaHorariaSchema,
  protectores_semana: z.number().int().min(0).max(7),
  creado_en: instanteSchema,
});

export const perfilActualizarSchema = z
  .object({
    nombre: z.string().trim().max(80, { error: "El nombre admite hasta 80 caracteres" }),
    zona_horaria: zonaHorariaSchema,
    protectores_semana: z
      .number()
      .int()
      .min(0, { error: "Mínimo 0 protectores" })
      .max(7, { error: "Máximo 7 protectores" }),
  })
  .partial();

// -----------------------------------------------------------------------------
// categorias
// -----------------------------------------------------------------------------
export const categoriaSchema = z.object({
  id: idSchema,
  usuario_id: uuidSchema,
  nombre: z.string(),
  color: colorSchema,
  creado_en: instanteSchema,
});

export const categoriaNuevaSchema = z.object({
  nombre: textoObligatorio(40, "El nombre"),
  color: colorSchema.default("#6741d9"),
});

// -----------------------------------------------------------------------------
// habitos
// -----------------------------------------------------------------------------
export const habitoSchema = z.object({
  id: idSchema,
  usuario_id: uuidSchema,
  nombre: z.string(),
  icono: z.string(),
  color: colorSchema,
  dias_semana: diasSemanaSchema,
  meta: z.string().nullable(),
  activo: z.boolean(),
  creado_en: instanteSchema,
});

export const habitoNuevoSchema = z.object({
  nombre: textoObligatorio(60, "El nombre"),
  icono: z.string().trim().min(1, { error: "Elige un ícono" }).max(16).default("✓"),
  color: colorSchema.default("#ff6a2b"),
  dias_semana: diasSemanaSchema.default([0, 1, 2, 3, 4, 5, 6]),
  meta: textoOpcional(120, "La meta"),
  activo: z.boolean().default(true),
});

export const habitoActualizarSchema = habitoNuevoSchema.partial();

// -----------------------------------------------------------------------------
// habito_registros
// -----------------------------------------------------------------------------
export const habitoRegistroSchema = z.object({
  id: idSchema,
  habito_id: idSchema,
  usuario_id: uuidSchema,
  fecha: fechaSchema,
  completado: z.boolean(),
  nota: z.string().nullable(),
  creado_en: instanteSchema,
});

export const habitoRegistroNuevoSchema = z.object({
  habito_id: idSchema,
  fecha: fechaSchema,
  completado: z.boolean().default(true),
  nota: textoOpcional(280, "La nota"),
});

// -----------------------------------------------------------------------------
// actividades (bitácora)
// -----------------------------------------------------------------------------
export const actividadSchema = z.object({
  id: idSchema,
  usuario_id: uuidSchema,
  fecha: fechaSchema,
  hora: horaSchema.nullable(),
  descripcion: z.string(),
  categoria_id: idSchema.nullable(),
  minutos: z.number().int().nullable(),
  creado_en: instanteSchema,
});

export const actividadNuevaSchema = z.object({
  fecha: fechaSchema,
  hora: horaSchema.nullish().transform((v) => v ?? null),
  descripcion: textoObligatorio(500, "La descripción"),
  categoria_id: idSchema.nullish().transform((v) => v ?? null),
  minutos: z
    .number()
    .int({ error: "Los minutos deben ser un número entero" })
    .min(1, { error: "Mínimo 1 minuto" })
    .max(1440, { error: "Máximo 1440 minutos (24 h)" })
    .nullish()
    .transform((v) => v ?? null),
});

// -----------------------------------------------------------------------------
// bloques_horario
// -----------------------------------------------------------------------------
/** Convierte "HH:MM[:SS]" a minutos desde medianoche para comparar horas. */
export function horaAMinutos(hora: string): number {
  const [h = "0", m = "0"] = hora.split(":");
  return Number(h) * 60 + Number(m);
}

/** Minutos desde medianoche a "HH:MM" (da la vuelta al día: 1440 → "00:00", -5 → "23:55"). */
export function minutosAHora(minutos: number): string {
  const total = ((Math.round(minutos) % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Último minuto en que puede terminar un bloque (no cruza la medianoche). */
export const ULTIMO_MINUTO_DEL_DIA = 23 * 60 + 59;

export const bloqueHorarioSchema = z.object({
  id: idSchema,
  usuario_id: uuidSchema,
  dias_semana: diasSemanaSchema,
  inicio: horaSchema,
  fin: horaSchema,
  titulo: z.string(),
  categoria_id: idSchema.nullable(),
  creado_en: instanteSchema,
});

const bloqueHorarioCampos = z.object({
  dias_semana: diasSemanaSchema,
  inicio: horaSchema,
  fin: horaSchema,
  titulo: textoObligatorio(80, "El título"),
  categoria_id: idSchema.nullish().transform((v) => v ?? null),
});

export const bloqueHorarioNuevoSchema = bloqueHorarioCampos.refine(
  (b) => horaAMinutos(b.fin) > horaAMinutos(b.inicio),
  { error: "La hora de fin debe ser posterior a la de inicio", path: ["fin"] },
);

export const bloqueHorarioActualizarSchema = bloqueHorarioCampos.partial().refine(
  (b) => !b.inicio || !b.fin || horaAMinutos(b.fin) > horaAMinutos(b.inicio),
  { error: "La hora de fin debe ser posterior a la de inicio", path: ["fin"] },
);

// -----------------------------------------------------------------------------
// estados_animo
// -----------------------------------------------------------------------------
export const nivelAnimoSchema = z
  .number()
  .int()
  .min(1, { error: "El ánimo va de 1 a 5" })
  .max(5, { error: "El ánimo va de 1 a 5" });

const etiquetaAnimoSchema = z.enum(ETIQUETAS_ANIMO.map((e) => e.id) as [EtiquetaAnimo, ...EtiquetaAnimo[]]);

export const estadoAnimoSchema = z.object({
  usuario_id: uuidSchema,
  fecha: fechaSchema,
  nivel: nivelAnimoSchema,
  nota: z.string().nullable(),
  // Si la base aún no tiene la columna (migración pendiente), se asume vacía.
  etiquetas: z.array(etiquetaAnimoSchema).default([]),
});

export const estadoAnimoNuevoSchema = z.object({
  fecha: fechaSchema,
  nivel: nivelAnimoSchema,
  nota: textoOpcional(280, "La nota"),
  /** Si se omite, al guardar se conservan las etiquetas que ya tenía el día. */
  etiquetas: z
    .array(etiquetaAnimoSchema)
    .max(MAX_ETIQUETAS_ANIMO, { error: `Elige hasta ${MAX_ETIQUETAS_ANIMO}` })
    .refine((l) => new Set(l).size === l.length, { error: "Hay etiquetas repetidas" })
    .optional(),
});

// -----------------------------------------------------------------------------
// logros
// -----------------------------------------------------------------------------
export const logroSchema = z.object({
  id: idSchema,
  codigo: z.string(),
  nombre: z.string(),
  descripcion: z.string(),
});

export const usuarioLogroSchema = z.object({
  usuario_id: uuidSchema,
  logro_id: idSchema,
  obtenido_en: instanteSchema,
});

// -----------------------------------------------------------------------------
// Respuestas de las funciones RPC (supabase.rpc)
// -----------------------------------------------------------------------------
/** Fila de cumplimiento_habitos(desde, hasta). */
export const cumplimientoHabitoSchema = z.object({
  habito_id: idSchema,
  fecha: fechaSchema,
  completado: z.boolean(),
});

/** Fila de resumen_diario(desde, hasta). porcentaje es 0..1, o null si no había hábitos. */
export const resumenDiaSchema = z.object({
  fecha: fechaSchema,
  programados: z.number().int().min(0),
  completados: z.number().int().min(0),
  porcentaje: z.coerce.number().min(0).max(1).nullable(),
});
