/**
 * Contexto con el cliente de Supabase y claves de caché de TanStack Query.
 * Web y móvil envuelven su app en <ProveedorDiarco crearCliente={...}>.
 *
 * El cliente se crea de forma perezosa (la primera vez que una consulta lo
 * pide), así el render en el servidor o en el build nunca lo instancia.
 */
import { createContext, use, useCallback, useRef, type ReactNode } from "react";
import type { ClienteDiarco } from "../api/base";
import type { Fecha } from "../types";

type ObtenerCliente = () => ClienteDiarco;

const ContextoCliente = createContext<ObtenerCliente | null>(null);

export function ProveedorDiarco({
  crearCliente,
  children,
}: {
  crearCliente: () => ClienteDiarco;
  children: ReactNode;
}) {
  const cliente = useRef<ClienteDiarco | null>(null);
  const obtener = useCallback(() => (cliente.current ??= crearCliente()), [crearCliente]);
  return <ContextoCliente value={obtener}>{children}</ContextoCliente>;
}

/** Devuelve una función que entrega el cliente de Supabase (llamarla solo dentro de consultas o mutaciones). */
export function useObtenerCliente(): ObtenerCliente {
  const obtener = use(ContextoCliente);
  if (!obtener) throw new Error("useObtenerCliente debe usarse dentro de <ProveedorDiarco>");
  return obtener;
}

/** Claves de caché. Invalidar una raíz (ej. claves.habitos) refresca todo lo que cuelga de ella. */
export const claves = {
  perfil: ["perfil"] as const,
  habitos: ["habitos"] as const,
  completados: ["completados"] as const,
  completadosRango: (desde: Fecha, hasta: Fecha) => ["completados", desde, hasta] as const,
  // Cuelga de "completados": marcar o desmarcar un hábito también lo refresca.
  registrosDia: (fecha: Fecha) => ["completados", "dia", fecha] as const,
  resumen: ["resumen"] as const,
  resumenRango: (desde: Fecha, hasta: Fecha) => ["resumen", desde, hasta] as const,
  // Cuelga de "resumen": marcar un hábito también lo invalida.
  cumplimientoRango: (desde: Fecha, hasta: Fecha) => ["resumen", "cumplimiento", desde, hasta] as const,
  actividadesRango: (desde: Fecha, hasta: Fecha) => ["actividades", "rango", desde, hasta] as const,
  animoRango: (desde: Fecha, hasta: Fecha) => ["animo", "rango", desde, hasta] as const,
  logros: ["logros"] as const,
  totalesLogros: ["totales_logros"] as const,
  usuarioLogros: ["usuario_logros"] as const,
  categorias: ["categorias"] as const,
  actividades: ["actividades"] as const,
  actividadesDia: (fecha: Fecha) => ["actividades", fecha] as const,
  bloques: ["bloques"] as const,
  animo: ["animo"] as const,
  animoDia: (fecha: Fecha) => ["animo", fecha] as const,
  rutinas: ["rutinas"] as const,
  rutinaHechas: ["rutina_registros"] as const,
  rutinaHechasDia: (fecha: Fecha) => ["rutina_registros", fecha] as const,
  rutinaHechasRango: (desde: Fecha, hasta: Fecha) => ["rutina_registros", "rango", desde, hasta] as const,
  pendientes: ["pendientes"] as const,
};
