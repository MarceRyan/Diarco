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
  logroSchema,
  perfilSchema,
  resumenDiaSchema,
  usuarioLogroSchema,
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

/** Crea varios hábitos en una sola petición (todos o ninguno). */
export async function crearHabitos(cliente: ClienteDiarco, habitos: HabitoNuevo[]) {
  return validar(await cliente.from("habitos").insert(habitos).select("*"), z.array(habitoSchema));
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

const registroConNotaSchema = habitoRegistroSchema.pick({ habito_id: true, fecha: true, nota: true });

/** Registros completados de un día, con su nota (opcional) de "qué hiciste". */
export async function listarRegistrosDia(cliente: ClienteDiarco, fecha: Fecha) {
  return validar(
    await cliente.from("habito_registros").select("habito_id, fecha, nota").eq("fecha", fecha).eq("completado", true),
    z.array(registroConNotaSchema),
  );
}

/**
 * Guarda (o borra, con null) la nota de un hábito cumplido en una fecha.
 * Usa upsert: si el registro no existiera aún, lo crea como cumplido.
 */
export async function guardarNotaHabito(cliente: ClienteDiarco, habitoId: number, fecha: Fecha, nota: string | null) {
  comprobar(
    await cliente
      .from("habito_registros")
      .upsert({ habito_id: habitoId, fecha, completado: true, nota }, { onConflict: "habito_id,fecha" }),
  );
}

/** Marca o desmarca un hábito en una fecha. Desmarcar borra el registro (y su nota). */
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

const actividadResumenSchema = actividadSchema.pick({
  id: true,
  fecha: true,
  hora: true,
  descripcion: true,
  categoria_id: true,
  minutos: true,
});

/** Actividades de un rango (lo que usan estadísticas, logros y la vista semanal del horario). */
export async function listarActividadesRango(cliente: ClienteDiarco, desde: Fecha, hasta: Fecha) {
  return obtenerTodo(
    (inicio, fin) =>
      cliente
        .from("actividades")
        .select("id, fecha, hora, descripcion, categoria_id, minutos")
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .order("fecha")
        .order("id")
        .range(inicio, fin),
    z.array(actividadResumenSchema),
  );
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

/** Estados de ánimo de un rango. */
export async function listarAnimoRango(cliente: ClienteDiarco, desde: Fecha, hasta: Fecha) {
  return validar(
    await cliente.from("estados_animo").select("*").gte("fecha", desde).lte("fecha", hasta).order("fecha"),
    z.array(estadoAnimoSchema),
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

// -----------------------------------------------------------------------------
// Logros
// -----------------------------------------------------------------------------
export async function listarLogros(cliente: ClienteDiarco) {
  return validar(await cliente.from("logros").select("*").order("id"), z.array(logroSchema));
}

const entero = z.coerce.number().int().min(0);
const totalesLogrosSchema = z.object({
  completados: entero,
  dias_activos: entero,
  actividades: entero,
  minutos_registrados: entero,
  actividades_madrugada: entero,
  actividades_noche: entero,
  animo_registros: entero,
  habitos_creados: entero,
  habitos_activos: entero,
  categorias: entero,
  bloques: entero,
  minutos_planificados: entero,
  notas: entero,
});

/** Conteos de toda la historia para evaluar logros (RPC totales_logros). */
export async function obtenerTotalesLogros(cliente: ClienteDiarco) {
  const filas = validar(await cliente.rpc("totales_logros"), z.array(totalesLogrosSchema).length(1));
  return filas[0]!;
}

export async function listarUsuarioLogros(cliente: ClienteDiarco) {
  return validar(await cliente.from("usuario_logros").select("*"), z.array(usuarioLogroSchema));
}

/** Registra logros obtenidos; ignora los que ya estaban (no falla por duplicados). */
export async function registrarLogros(cliente: ClienteDiarco, logroIds: number[]) {
  if (logroIds.length === 0) return;
  comprobar(
    await cliente
      .from("usuario_logros")
      .upsert(
        logroIds.map((logro_id) => ({ logro_id })),
        { onConflict: "usuario_id,logro_id", ignoreDuplicates: true },
      ),
  );
}
