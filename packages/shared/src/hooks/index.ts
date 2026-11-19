/**
 * Hooks de datos (TanStack Query) compartidos por web y móvil.
 * Las pantallas solo llaman a estos hooks; no consultan Supabase directamente.
 */
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import * as api from "../api";
import { ZONA_HORARIA_POR_DEFECTO } from "../constantes";
import { fechaEnZona, fechaHoy, sumarDias } from "../logic/fechas";
import {
  calcularRachaGeneral,
  calcularRachaHabito,
  construirResumenDiario,
  type RachaGeneral,
  type RachaHabito,
} from "../logic/rachas";
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
import { claves, useObtenerCliente } from "./contexto";

export * from "./contexto";

/** Días de historia que se consultan para calcular rachas (límite de la RPC: 2 años). */
export const DIAS_HISTORIA_RACHAS = 730;

/** Mutación que, al terminar, invalida las claves indicadas. */
function useMutacion<V, R>(fn: (variables: V) => Promise<R>, invalidar: QueryKey[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => Promise.all(invalidar.map((queryKey) => qc.invalidateQueries({ queryKey }))),
  });
}

// -----------------------------------------------------------------------------
// Perfil y fecha de hoy
// -----------------------------------------------------------------------------
export function usePerfil() {
  const cliente = useObtenerCliente();
  return useQuery({ queryKey: claves.perfil, queryFn: () => api.obtenerPerfil(cliente()), staleTime: 5 * 60_000 });
}

export function useActualizarPerfil() {
  const cliente = useObtenerCliente();
  const { data: perfil } = usePerfil();
  return useMutacion(
    (cambios: PerfilActualizar) => {
      if (!perfil) throw new api.ErrorDiarco("Perfil no cargado.");
      return api.actualizarPerfil(cliente(), perfil.id, cambios);
    },
    [claves.perfil, claves.resumen],
  );
}

/** Zona horaria del usuario (America/Lima mientras carga el perfil). */
export function useZonaHoraria(): string {
  return usePerfil().data?.zona_horaria ?? ZONA_HORARIA_POR_DEFECTO;
}

/** Fecha de hoy en la zona del usuario. Se actualiza sola al cambiar el día. */
export function useHoy(): Fecha {
  const zona = useZonaHoraria();
  const [hoy, setHoy] = useState(() => fechaHoy(zona));
  useEffect(() => {
    const actualizar = () => setHoy(fechaHoy(zona));
    actualizar();
    const intervalo = setInterval(actualizar, 60_000);
    return () => clearInterval(intervalo);
  }, [zona]);
  return hoy;
}

// -----------------------------------------------------------------------------
// Hábitos
// -----------------------------------------------------------------------------
export function useHabitos() {
  const cliente = useObtenerCliente();
  return useQuery({ queryKey: claves.habitos, queryFn: () => api.listarHabitos(cliente()) });
}

const afectadosPorHabitos = [claves.habitos, claves.resumen, claves.completados];

export function useCrearHabito() {
  const cliente = useObtenerCliente();
  return useMutacion((habito: HabitoNuevo) => api.crearHabito(cliente(), habito), afectadosPorHabitos);
}

export function useActualizarHabito() {
  const cliente = useObtenerCliente();
  return useMutacion(
    ({ id, cambios }: { id: number; cambios: HabitoActualizar }) => api.actualizarHabito(cliente(), id, cambios),
    afectadosPorHabitos,
  );
}

export function useEliminarHabito() {
  const cliente = useObtenerCliente();
  return useMutacion((id: number) => api.eliminarHabito(cliente(), id), afectadosPorHabitos);
}

// -----------------------------------------------------------------------------
// Registros y rachas
// -----------------------------------------------------------------------------
type Completado = { habito_id: number; fecha: Fecha };

/** Fechas completadas de los últimos DIAS_HISTORIA_RACHAS días. */
export function useCompletados() {
  const cliente = useObtenerCliente();
  const hoy = useHoy();
  const desde = sumarDias(hoy, -DIAS_HISTORIA_RACHAS);
  return useQuery({
    queryKey: claves.completadosRango(desde, hoy),
    queryFn: () => api.listarCompletados(cliente(), desde, hoy),
  });
}

/**
 * Marca o desmarca un hábito con actualización optimista: la interfaz cambia
 * al instante y se revierte si el servidor falla.
 */
export function useMarcarHabito() {
  const cliente = useObtenerCliente();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ habitoId, fecha, completado }: { habitoId: number; fecha: Fecha; completado: boolean }) =>
      api.marcarHabito(cliente(), habitoId, fecha, completado),
    onMutate: async ({ habitoId, fecha, completado }) => {
      await qc.cancelQueries({ queryKey: claves.completados });
      const anteriores = qc.getQueriesData<Completado[]>({ queryKey: claves.completados });
      qc.setQueriesData<Completado[]>({ queryKey: claves.completados }, (lista = []) => {
        const sin = lista.filter((r) => !(r.habito_id === habitoId && r.fecha === fecha));
        return completado ? [...sin, { habito_id: habitoId, fecha }] : sin;
      });
      return { anteriores };
    },
    onError: (_error, _variables, contexto) => {
      contexto?.anteriores.forEach(([queryKey, datos]) => qc.setQueryData(queryKey, datos));
    },
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: claves.completados }),
        qc.invalidateQueries({ queryKey: claves.resumen }),
      ]),
  });
}

/** Resumen diario (RPC) de los últimos `dias` días hasta hoy. */
export function useResumenDiario(dias = DIAS_HISTORIA_RACHAS) {
  const cliente = useObtenerCliente();
  const hoy = useHoy();
  const desde = sumarDias(hoy, -dias);
  return useQuery({
    queryKey: claves.resumenRango(desde, hoy),
    queryFn: () => api.obtenerResumenDiario(cliente(), desde, hoy),
  });
}

export interface Rachas {
  /** Racha por id de hábito (solo hábitos activos). */
  porHabito: Map<number, RachaHabito>;
  /** Racha general, calculada con los mismos registros. */
  general: RachaGeneral;
  /** Ids de hábitos con registro completado hoy. */
  completadosHoy: Set<number>;
}

/**
 * Rachas de todos los hábitos y racha general.
 * Se calculan en el cliente con la lógica de @diarco/shared, así se
 * actualizan al instante al marcar un hábito (actualización optimista).
 */
export function useRachas() {
  const hoy = useHoy();
  const zona = useZonaHoraria();
  const perfil = usePerfil();
  const habitos = useHabitos();
  const completados = useCompletados();

  const datos = useMemo<Rachas | undefined>(() => {
    if (!habitos.data || !completados.data || !perfil.data) return undefined;

    const desdeHistoria = sumarDias(hoy, -DIAS_HISTORIA_RACHAS);
    // Primer día de cada hábito activo: su creación (en la zona del usuario),
    // sin ir más atrás que la historia consultada.
    const activos = habitos.data
      .filter((h) => h.activo)
      .map((h) => {
        const creado = fechaEnZona(new Date(h.creado_en), zona);
        return { id: h.id, diasSemana: h.dias_semana, desde: creado > desdeHistoria ? creado : desdeHistoria };
      });

    const fechasPorHabito = new Map<number, Fecha[]>();
    const completadosHoy = new Set<number>();
    for (const r of completados.data) {
      const fechas = fechasPorHabito.get(r.habito_id);
      if (fechas) fechas.push(r.fecha);
      else fechasPorHabito.set(r.habito_id, [r.fecha]);
      if (r.fecha === hoy) completadosHoy.add(r.habito_id);
    }

    const porHabito = new Map<number, RachaHabito>();
    for (const habito of activos) {
      porHabito.set(
        habito.id,
        calcularRachaHabito({
          ...habito,
          completados: fechasPorHabito.get(habito.id) ?? [],
          hoy,
          protectoresPorSemana: perfil.data.protectores_semana,
        }),
      );
    }

    const dias = construirResumenDiario({
      habitos: activos,
      completados: completados.data,
      desde: desdeHistoria,
      hasta: hoy,
    });

    return { porHabito, general: calcularRachaGeneral({ dias, hoy }), completadosHoy };
  }, [habitos.data, completados.data, perfil.data, hoy, zona]);

  return {
    data: datos,
    isPending: habitos.isPending || completados.isPending || perfil.isPending,
    error: habitos.error ?? completados.error ?? perfil.error,
  };
}

// -----------------------------------------------------------------------------
// Categorías
// -----------------------------------------------------------------------------
export function useCategorias() {
  const cliente = useObtenerCliente();
  return useQuery({ queryKey: claves.categorias, queryFn: () => api.listarCategorias(cliente()) });
}

export function useCrearCategoria() {
  const cliente = useObtenerCliente();
  return useMutacion((categoria: CategoriaNueva) => api.crearCategoria(cliente(), categoria), [claves.categorias]);
}

export function useEliminarCategoria() {
  const cliente = useObtenerCliente();
  return useMutacion((id: number) => api.eliminarCategoria(cliente(), id), [
    claves.categorias,
    claves.actividades,
    claves.bloques,
  ]);
}

// -----------------------------------------------------------------------------
// Bitácora
// -----------------------------------------------------------------------------
export function useActividades(fecha: Fecha) {
  const cliente = useObtenerCliente();
  return useQuery({ queryKey: claves.actividadesDia(fecha), queryFn: () => api.listarActividades(cliente(), fecha) });
}

export function useCrearActividad() {
  const cliente = useObtenerCliente();
  return useMutacion((actividad: ActividadNueva) => api.crearActividad(cliente(), actividad), [claves.actividades]);
}

export function useActualizarActividad() {
  const cliente = useObtenerCliente();
  return useMutacion(
    ({ id, cambios }: { id: number; cambios: Partial<ActividadNueva> }) =>
      api.actualizarActividad(cliente(), id, cambios),
    [claves.actividades],
  );
}

export function useEliminarActividad() {
  const cliente = useObtenerCliente();
  return useMutacion((id: number) => api.eliminarActividad(cliente(), id), [claves.actividades]);
}

// -----------------------------------------------------------------------------
// Horario
// -----------------------------------------------------------------------------
export function useBloques() {
  const cliente = useObtenerCliente();
  return useQuery({ queryKey: claves.bloques, queryFn: () => api.listarBloques(cliente()) });
}

export function useCrearBloque() {
  const cliente = useObtenerCliente();
  return useMutacion((bloque: BloqueHorarioNuevo) => api.crearBloque(cliente(), bloque), [claves.bloques]);
}

export function useActualizarBloque() {
  const cliente = useObtenerCliente();
  return useMutacion(
    ({ id, cambios }: { id: number; cambios: Partial<BloqueHorarioNuevo> }) => api.actualizarBloque(cliente(), id, cambios),
    [claves.bloques],
  );
}

export function useEliminarBloque() {
  const cliente = useObtenerCliente();
  return useMutacion((id: number) => api.eliminarBloque(cliente(), id), [claves.bloques]);
}

// -----------------------------------------------------------------------------
// Estado de ánimo
// -----------------------------------------------------------------------------
export function useAnimo(fecha: Fecha) {
  const cliente = useObtenerCliente();
  return useQuery({ queryKey: claves.animoDia(fecha), queryFn: () => api.obtenerAnimo(cliente(), fecha) });
}

export function useGuardarAnimo() {
  const cliente = useObtenerCliente();
  return useMutacion((animo: EstadoAnimoNuevo) => api.guardarAnimo(cliente(), animo), [claves.animo]);
}
