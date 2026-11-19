/**
 * Tipos del dominio de Diarco.
 * Los de las tablas se derivan de los esquemas Zod (una sola fuente de verdad).
 */
import type { z } from "zod";
import type {
  actividadNuevaSchema,
  actividadSchema,
  bloqueHorarioNuevoSchema,
  bloqueHorarioSchema,
  categoriaNuevaSchema,
  categoriaSchema,
  cumplimientoHabitoSchema,
  estadoAnimoNuevoSchema,
  estadoAnimoSchema,
  habitoActualizarSchema,
  habitoNuevoSchema,
  habitoRegistroNuevoSchema,
  habitoRegistroSchema,
  habitoSchema,
  logroSchema,
  perfilActualizarSchema,
  perfilSchema,
  resumenDiaSchema,
  usuarioLogroSchema,
} from "../schemas";

/** Fecha de calendario en formato ISO `AAAA-MM-DD`, en la zona horaria del usuario. */
export type Fecha = string;

/** Día de la semana: 0 = domingo … 6 = sábado. */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Filas de la base de datos (lo que devuelve Supabase)
export type Perfil = z.infer<typeof perfilSchema>;
export type Categoria = z.infer<typeof categoriaSchema>;
export type Habito = z.infer<typeof habitoSchema>;
export type HabitoRegistro = z.infer<typeof habitoRegistroSchema>;
export type Actividad = z.infer<typeof actividadSchema>;
export type BloqueHorario = z.infer<typeof bloqueHorarioSchema>;
export type EstadoAnimo = z.infer<typeof estadoAnimoSchema>;
export type Logro = z.infer<typeof logroSchema>;
export type UsuarioLogro = z.infer<typeof usuarioLogroSchema>;

// Respuestas de funciones RPC
export type CumplimientoHabito = z.infer<typeof cumplimientoHabitoSchema>;
export type ResumenDia = z.infer<typeof resumenDiaSchema>;

// Datos de formularios (entrada ya validada)
export type PerfilActualizar = z.infer<typeof perfilActualizarSchema>;
export type CategoriaNueva = z.infer<typeof categoriaNuevaSchema>;
export type HabitoNuevo = z.infer<typeof habitoNuevoSchema>;
export type HabitoActualizar = z.infer<typeof habitoActualizarSchema>;
export type HabitoRegistroNuevo = z.infer<typeof habitoRegistroNuevoSchema>;
export type ActividadNueva = z.infer<typeof actividadNuevaSchema>;
export type BloqueHorarioNuevo = z.infer<typeof bloqueHorarioNuevoSchema>;
export type EstadoAnimoNuevo = z.infer<typeof estadoAnimoNuevoSchema>;
