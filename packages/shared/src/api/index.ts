/**
 * Consultas a Supabase compartidas por web y móvil.
 * Cada función recibe el cliente, valida la respuesta con Zod y lanza
 * `ErrorDiarco` con un mensaje en español si algo falla.
 * La seguridad la garantiza RLS: el cliente solo ve las filas del usuario.
 */
import { z } from "zod";
import {
  actividadSchema,
  bloqueHorarioSchema,
  categoriaSchema,
  cumplimientoHabitoSchema,
  estadoAnimoSchema,
  habitoRegistroSchema,
  habitoSchema,
  perfilSchema,
  resumenDiaSchema,
} from "../schemas";
import type {
  ActividadNueva,
  BloqueHorarioNuevo,
  CategoriaNueva,
  EstadoAnimoNuevo,
  Fecha,
  HabitoActualizar,
  HabitoNuevo,
  PerfilActualizar,
} from "../types";
import { comprobar, obtenerTodo, validar, type ClienteDiarco } from "./base";

export * from "./base";

// -----------------------------------------------------------------------------
// Perfil
// -----------------------------------------------------------------------------
export async function obtenerPerfil(cliente: ClienteDiarco) {
  return validar(await cliente.from("perfiles").select("*").single(), perfilSchema);
}

export async function actualizarPerfil(cliente: ClienteDiarco, id: string, cambios: PerfilActualizar) {
  return validar(
    await cliente.from("perfiles").update(cambios).eq("id", id).select("*").single(),
    perfilSchema,
  );
}

// -----------------------------------------------------------------------------
// Hábitos
// -----------------------------------------------------------------------------
export async function listarHabitos(cliente: ClienteDiarco) {
  return validar(
    await cliente.from("habitos").select("*").order("activo", { ascending: false }).order("creado_en"),
    z.array(habitoSchema),
  );
}

export async function crearHabito(cliente: ClienteDiarco, habito: HabitoNuevo) {
  return validar(await cliente.from("habitos").insert(habito).select("*").single(), habitoSchema);
}

export async function actualizarHabito(cliente: ClienteDiarco, id: number, cambios: HabitoActualizar) {
  return validar(
    await cliente.from("habitos").update(cambios).eq("id", id).select("*").single(),
    habitoSchema,
  );
}

export async function eliminarHabito(cliente: ClienteDiarco, id: number) {
  comprobar(await cliente.from("habitos").delete().eq("id", id));
}

// -----------------------------------------------------------------------------
// Registros de hábitos
// -----------------------------------------------------------------------------
const registroMinimoSchema = habitoRegistroSchema.pick({ habito_id: true, fecha: true });

/** Fechas completadas de todos los hábitos en el rango (pagina si hace falta). */
export async function listarCompletados(cliente: ClienteDiarco, desde: Fecha, hasta: Fecha) {
  return obtenerTodo(
    (inicio, fin) =>
      cliente
        .from("habito_registros")
        .select("habito_id, fecha")
        .eq("completado", true)
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .order("fecha")
        .order("habito_id")
        .range(inicio, fin),
    z.array(registroMinimoSchema),
  );
}

/** Marca o desmarca un hábito en una fecha. Desmarcar borra el registro. */
export async function marcarHabito(
  cliente: ClienteDiarco,
  habitoId: number,
  fecha: Fecha,
  completado: boolean,
) {
  if (completado) {
    comprobar(
      await cliente
        .from("habito_registros")
        .upsert({ habito_id: habitoId, fecha, completado: true }, { onConflict: "habito_id,fecha" }),
    );
  } else {
    comprobar(
      await cliente.from("habito_registros").delete().eq("habito_id", habitoId).eq("fecha", fecha),
    );
  }
}

// -----------------------------------------------------------------------------
// Funciones RPC
// -----------------------------------------------------------------------------
export async function obtenerCumplimiento(cliente: ClienteDiarco, desde: Fecha, hasta: Fecha) {
  return validar(
    await cliente.rpc("cumplimiento_habitos", { p_desde: desde, p_hasta: hasta }),
    z.array(cumplimientoHabitoSchema),
  );
}

export async function obtenerResumenDiario(cliente: ClienteDiarco, desde: Fecha, hasta: Fecha) {
  return validar(
    await cliente.rpc("resumen_diario", { p_desde: desde, p_hasta: hasta }),
    z.array(resumenDiaSchema),
  );
}

// -----------------------------------------------------------------------------
// Categorías
// -----------------------------------------------------------------------------
export async function listarCategorias(cliente: ClienteDiarco) {
  return validar(await cliente.from("categorias").select("*").order("nombre"), z.array(categoriaSchema));
}

export async function crearCategoria(cliente: ClienteDiarco, categoria: CategoriaNueva) {
  return validar(await cliente.from("categorias").insert(categoria).select("*").single(), categoriaSchema);
}

export async function eliminarCategoria(cliente: ClienteDiarco, id: number) {
  comprobar(await cliente.from("categorias").delete().eq("id", id));
}

// -----------------------------------------------------------------------------
// Actividades (bitácora)
// -----------------------------------------------------------------------------
export async function listarActividades(cliente: ClienteDiarco, fecha: Fecha) {
  return validar(
    await cliente
      .from("actividades")
      .select("*")
      .eq("fecha", fecha)
      .order("hora", { ascending: true, nullsFirst: false })
      .order("creado_en"),
    z.array(actividadSchema),
  );
}

export async function crearActividad(cliente: ClienteDiarco, actividad: ActividadNueva) {
  return validar(await cliente.from("actividades").insert(actividad).select("*").single(), actividadSchema);
}

export async function actualizarActividad(
  cliente: ClienteDiarco,
  id: number,
  cambios: Partial<ActividadNueva>,
) {
  return validar(
    await cliente.from("actividades").update(cambios).eq("id", id).select("*").single(),
    actividadSchema,
  );
}

export async function eliminarActividad(cliente: ClienteDiarco, id: number) {
  comprobar(await cliente.from("actividades").delete().eq("id", id));
}

// -----------------------------------------------------------------------------
// Horario
// -----------------------------------------------------------------------------
export async function listarBloques(cliente: ClienteDiarco) {
  return validar(
    await cliente.from("bloques_horario").select("*").order("inicio"),
    z.array(bloqueHorarioSchema),
  );
}

export async function crearBloque(cliente: ClienteDiarco, bloque: BloqueHorarioNuevo) {
  return validar(
    await cliente.from("bloques_horario").insert(bloque).select("*").single(),
    bloqueHorarioSchema,
  );
}

export async function actualizarBloque(
  cliente: ClienteDiarco,
  id: number,
  cambios: Partial<BloqueHorarioNuevo>,
) {
  return validar(
    await cliente.from("bloques_horario").update(cambios).eq("id", id).select("*").single(),
    bloqueHorarioSchema,
  );
}

export async function eliminarBloque(cliente: ClienteDiarco, id: number) {
  comprobar(await cliente.from("bloques_horario").delete().eq("id", id));
}

// -----------------------------------------------------------------------------
// Estado de ánimo
// -----------------------------------------------------------------------------
export async function obtenerAnimo(cliente: ClienteDiarco, fecha: Fecha) {
  return validar(
    await cliente.from("estados_animo").select("*").eq("fecha", fecha).maybeSingle(),
    estadoAnimoSchema.nullable(),
  );
}

export async function guardarAnimo(cliente: ClienteDiarco, animo: EstadoAnimoNuevo) {
  return validar(
    await cliente
      .from("estados_animo")
      .upsert(animo, { onConflict: "usuario_id,fecha" })
      .select("*")
      .single(),
    estadoAnimoSchema,
  );
}
