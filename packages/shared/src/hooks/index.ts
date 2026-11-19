/**
 * Hooks de datos (TanStack Query) compartidos por web y móvil.
 * Las pantallas solo llaman a estos hooks; no consultan Supabase directamente.
 */
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { evaluarLogros, type CodigoLogro, type ContextoLogros } from "../logic/logros";
import { cosechasSemanales, diasSinLena, estacionDelAno, etapaChispa, lenaTotal } from "../logic/chispa";
import * as api from "../api";
import { ZONA_HORARIA_POR_DEFECTO } from "../constantes";
import { fechaEnZona, fechaHoy, sumarDias } from "../logic/fechas";
import {
  calcularRachaGeneral,
  calcularRachaHabito,
  construirResumenDiario,
  type DiaResumen,
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
    // Cualquier cambio puede acercar un logro: los totales siempre se recalculan.
    onSettled: () =>
      Promise.all([...invalidar, claves.totalesLogros].map((queryKey) => qc.invalidateQueries({ queryKey }))),
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

export function useCrearHabitos() {
  const cliente = useObtenerCliente();
  return useMutacion((habitos: HabitoNuevo[]) => api.crearHabitos(cliente(), habitos), afectadosPorHabitos);
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
      // Las listas por día (notas) solo se tocan si son de la fecha marcada.
      const filtro = {
        queryKey: claves.completados,
        predicate: (q: { queryKey: readonly unknown[] }) => q.queryKey[1] !== "dia" || q.queryKey[2] === fecha,
      };
      await qc.cancelQueries(filtro);
      const anteriores = qc.getQueriesData<Completado[]>(filtro);
      qc.setQueriesData<Completado[]>(filtro, (lista = []) => {
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
        qc.invalidateQueries({ queryKey: claves.totalesLogros }),
      ]),
  });
}

/** Notas de los hábitos cumplidos en una fecha, por id de hábito. */
export function useNotasDia(fecha: Fecha) {
  const cliente = useObtenerCliente();
  return useQuery({
    queryKey: claves.registrosDia(fecha),
    queryFn: () => api.listarRegistrosDia(cliente(), fecha),
    select: (registros) => new Map(registros.map((r) => [r.habito_id, r.nota])),
  });
}

type RegistroConNota = { habito_id: number; fecha: Fecha; nota: string | null };

/** Guarda la nota de un hábito cumplido; la interfaz la muestra al instante. */
export function useGuardarNota() {
  const cliente = useObtenerCliente();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ habitoId, fecha, nota }: { habitoId: number; fecha: Fecha; nota: string | null }) =>
      api.guardarNotaHabito(cliente(), habitoId, fecha, nota),
    onMutate: async ({ habitoId, fecha, nota }) => {
      const clave = claves.registrosDia(fecha);
      await qc.cancelQueries({ queryKey: clave });
      const anterior = qc.getQueryData<RegistroConNota[]>(clave);
      qc.setQueryData<RegistroConNota[]>(clave, (lista = []) => [
        ...lista.filter((r) => r.habito_id !== habitoId),
        { habito_id: habitoId, fecha, nota },
      ]);
      return { anterior, clave };
    },
    onError: (_e, _v, contexto) => {
      if (contexto) qc.setQueryData(contexto.clave, contexto.anterior);
    },
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: claves.completados }),
        qc.invalidateQueries({ queryKey: claves.totalesLogros }),
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
  /** Resumen por día de la historia consultada (base de la racha general). */
  dias: DiaResumen[];
  /** Total de registros completados en la historia consultada. */
  totalCompletados: number;
  /** Hábitos activos con su primer día y sus fechas cumplidas (para historial y correcciones). */
  activos: { id: number; diasSemana: readonly number[]; desde: Fecha; completados: Set<Fecha> }[];
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

    return {
      porHabito,
      general: calcularRachaGeneral({ dias, hoy }),
      completadosHoy,
      dias,
      totalCompletados: completados.data.length,
      activos: activos.map((h) => ({ ...h, completados: new Set(fechasPorHabito.get(h.id) ?? []) })),
    };
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

// -----------------------------------------------------------------------------
// Estadísticas (rangos)
// -----------------------------------------------------------------------------

/** Rango [hoy - (dias - 1), hoy]: los últimos `dias` días incluyendo hoy. */
export function useRango(dias: number): { desde: Fecha; hasta: Fecha } {
  const hoy = useHoy();
  return { desde: sumarDias(hoy, -(dias - 1)), hasta: hoy };
}

/** Días programados de cada hábito en el rango, con su cumplimiento (RPC). */
export function useCumplimiento(desde: Fecha, hasta: Fecha) {
  const cliente = useObtenerCliente();
  return useQuery({
    queryKey: claves.cumplimientoRango(desde, hasta),
    queryFn: () => api.obtenerCumplimiento(cliente(), desde, hasta),
  });
}

/** Resumen por día (RPC) de un rango explícito. */
export function useResumenRango(desde: Fecha, hasta: Fecha) {
  const cliente = useObtenerCliente();
  return useQuery({
    queryKey: claves.resumenRango(desde, hasta),
    queryFn: () => api.obtenerResumenDiario(cliente(), desde, hasta),
  });
}

export function useActividadesRango(desde: Fecha, hasta: Fecha) {
  const cliente = useObtenerCliente();
  return useQuery({
    queryKey: claves.actividadesRango(desde, hasta),
    queryFn: () => api.listarActividadesRango(cliente(), desde, hasta),
  });
}

export function useAnimoRango(desde: Fecha, hasta: Fecha) {
  const cliente = useObtenerCliente();
  return useQuery({
    queryKey: claves.animoRango(desde, hasta),
    queryFn: () => api.listarAnimoRango(cliente(), desde, hasta),
  });
}

// -----------------------------------------------------------------------------
// Logros
// -----------------------------------------------------------------------------

/** Días hacia atrás que se revisan para rachas de bitácora, ánimo y variedad semanal. */
export const DIAS_REVISION_LOGROS = 365;

/** Conteos de toda la historia para los logros (RPC totales_logros). */
export function useTotalesLogros() {
  const cliente = useObtenerCliente();
  return useQuery({ queryKey: claves.totalesLogros, queryFn: () => api.obtenerTotalesLogros(cliente()) });
}

/** Catálogo de logros con la fecha en que el usuario obtuvo cada uno (o null). */
export function useLogros() {
  const cliente = useObtenerCliente();
  const catalogo = useQuery({
    queryKey: claves.logros,
    queryFn: () => api.listarLogros(cliente()),
    staleTime: Infinity, // el catálogo casi nunca cambia
  });
  const obtenidos = useQuery({ queryKey: claves.usuarioLogros, queryFn: () => api.listarUsuarioLogros(cliente()) });

  const data = useMemo(() => {
    if (!catalogo.data || !obtenidos.data) return undefined;
    const fechas = new Map(obtenidos.data.map((u) => [u.logro_id, u.obtenido_en]));
    return catalogo.data.map((logro) => ({ ...logro, obtenido_en: fechas.get(logro.id) ?? null }));
  }, [catalogo.data, obtenidos.data]);

  return {
    data,
    isPending: catalogo.isPending || obtenidos.isPending,
    error: catalogo.error ?? obtenidos.error,
    refetch: () => Promise.all([catalogo.refetch(), obtenidos.refetch()]),
  };
}

/**
 * Todo lo que necesitan las reglas de logros, reunido en un solo objeto.
 * Lo usan el vigilante (para otorgar) y la pantalla de Logros (para el progreso).
 */
export function useContextoLogros(): ContextoLogros | undefined {
  const hoy = useHoy();
  const { data: rachas } = useRachas();
  const desde = sumarDias(hoy, -(DIAS_REVISION_LOGROS - 1));
  const actividades = useActividadesRango(desde, hoy);
  const animo = useAnimoRango(desde, hoy);
  const totales = useTotalesLogros();

  return useMemo(() => {
    if (!rachas || !actividades.data || !animo.data || !totales.data) return undefined;
    return {
      hoy,
      mejorRacha: Math.max(0, ...[...rachas.porHabito.values()].map((r) => r.maxima)),
      mejorRachaGeneral: rachas.general.maxima,
      resumenDiario: rachas.dias,
      actividades: actividades.data,
      fechasAnimo: animo.data.map((a) => a.fecha),
      totales: totales.data,
    };
  }, [hoy, rachas, actividades.data, animo.data, totales.data]);
}

/**
 * Evalúa el historial del usuario y registra los logros nuevos.
 * Se monta una vez en la app; `onNuevos` recibe los logros recién obtenidos
 * (para mostrar un aviso). La regla de cada logro vive en logic/logros.ts.
 */
export function useVigilanteLogros(onNuevos: (logros: { codigo: CodigoLogro; nombre: string }[]) => void) {
  const cliente = useObtenerCliente();
  const qc = useQueryClient();
  const contexto = useContextoLogros();
  const logros = useLogros();
  // Códigos ya enviados en esta sesión: evita registrar dos veces mientras llega la respuesta.
  const enviados = useRef(new Set<string>());
  const avisar = useRef(onNuevos);
  useEffect(() => {
    avisar.current = onNuevos;
  });

  useEffect(() => {
    if (!contexto || !logros.data) return;
    const cumplidos = new Set<string>(evaluarLogros(contexto));

    const nuevos = logros.data.filter(
      (l) => l.obtenido_en === null && cumplidos.has(l.codigo) && !enviados.current.has(l.codigo),
    );
    if (nuevos.length === 0) return;

    nuevos.forEach((l) => enviados.current.add(l.codigo));
    api
      .registrarLogros(cliente(), nuevos.map((l) => l.id))
      .then(() => {
        avisar.current(nuevos.map((l) => ({ codigo: l.codigo as CodigoLogro, nombre: l.nombre })));
        return qc.invalidateQueries({ queryKey: claves.usuarioLogros });
      })
      .catch(() => {
        // Se reintentará en la próxima evaluación.
        nuevos.forEach((l) => enviados.current.delete(l.codigo));
      });
  }, [contexto, logros.data, cliente, qc]);
}

// -----------------------------------------------------------------------------
// Chispa que crece (leña, etapa, estación y cosecha semanal)
// -----------------------------------------------------------------------------

/** Semanas que muestra el álbum de cosechas. */
export const SEMANAS_COSECHA = 8;

/** Todo lo necesario para dibujar a Chispa en su etapa y el álbum de cosechas. */
export function useEvolucionChispa() {
  const hoy = useHoy();
  const zona = useZonaHoraria();
  const totales = useTotalesLogros();
  const { data: rachas } = useRachas();
  const desde = sumarDias(hoy, -(DIAS_REVISION_LOGROS - 1));
  const actividades = useActividadesRango(desde, hoy);
  const animo = useAnimoRango(desde, hoy);

  const data = useMemo(() => {
    if (!totales.data || !rachas || !actividades.data || !animo.data) return undefined;
    const lena = lenaTotal(totales.data);
    const fechasAnimo = animo.data.map((a) => a.fecha);
    const fechasConLena = [
      ...rachas.activos.flatMap((h) => [...h.completados]),
      ...fechasAnimo,
      ...actividades.data.map((a) => a.fecha),
    ];
    return {
      lena,
      etapa: etapaChispa(lena),
      diasSinLena: diasSinLena(fechasConLena, hoy),
      estacion: estacionDelAno(hoy, zona),
      cosechas: cosechasSemanales({
        dias: rachas.dias,
        fechasAnimo,
        actividades: actividades.data,
        hoy,
        semanas: SEMANAS_COSECHA,
      }),
    };
  }, [totales.data, rachas, actividades.data, animo.data, hoy, zona]);

  return {
    data,
    error: totales.error ?? actividades.error ?? animo.error,
    refetch: () => Promise.all([totales.refetch(), actividades.refetch(), animo.refetch()]),
  };
}
