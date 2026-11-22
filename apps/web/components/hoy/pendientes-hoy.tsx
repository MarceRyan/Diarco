"use client";

import { agruparPendientes, compararFechas } from "@diarco/shared";
import { useHoy, usePendientes } from "@diarco/shared/hooks";
import { ListTodo } from "lucide-react";
import Link from "next/link";
import { AgregarPendiente, cuandoToca, FilaPendiente } from "@/components/pendientes";
import { CargandoLista, claseTarjeta, MensajeError } from "@/components/ui/estados";

/** Cuántos próximos se adelantan en Hoy. */
const PROXIMOS_EN_HOY = 3;

/**
 * Pendientes en Hoy: lo atrasado y lo de hoy para marcar, lo que ya hiciste hoy
 * (tachado) y un adelanto de lo que viene.
 */
export function PendientesHoy() {
  const hoy = useHoy();
  const pendientes = usePendientes();

  const grupos = pendientes.data ? agruparPendientes(pendientes.data, hoy) : null;
  const paraHoy = grupos ? [...grupos.atrasados, ...grupos.hoy] : [];
  // Lo marcado hoy sigue visible (tachado) para poder deshacerlo.
  const hechosHoy =
    grupos?.hechos.filter((p) => p.hecho_en === hoy && (p.fecha === null || compararFechas(p.fecha, hoy) <= 0)) ?? [];
  const proximos = grupos ? [...grupos.manana, ...grupos.proximos.flatMap((d) => d.pendientes)].slice(0, PROXIMOS_EN_HOY) : [];

  return (
    <section aria-labelledby="titulo-pendientes" className={`${claseTarjeta} p-5`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="titulo-pendientes" className="flex items-center gap-2 font-titulo text-xl font-bold">
          <ListTodo className="size-5 text-cielo-texto" strokeWidth={2.5} aria-hidden />
          Pendientes
        </h2>
        <Link href="/pendientes" className="inline-flex min-h-11 items-center font-extrabold text-cielo-texto">
          Ver todos
        </Link>
      </div>

      <AgregarPendiente fecha={hoy} placeholder="¿Qué tienes que hacer hoy?" />

      {pendientes.isPending ? (
        <div className="mt-3">
          <CargandoLista filas={2} alto="h-11" />
        </div>
      ) : pendientes.error ? (
        <div className="mt-3">
          <MensajeError error={pendientes.error} onReintentar={() => pendientes.refetch()} />
        </div>
      ) : (
        <>
          {paraHoy.length === 0 && hechosHoy.length === 0 ? (
            <p className="mt-3 text-texto-suave">Nada pendiente para hoy. 🎉</p>
          ) : (
            <ul className="mt-2 divide-y-2 divide-borde" aria-label="Pendientes de hoy">
              {paraHoy.map((p) => (
                <FilaPendiente key={p.id} pendiente={p} hoy={hoy} mostrarCuando={p.fecha !== hoy} />
              ))}
              {hechosHoy.map((p) => (
                <FilaPendiente key={p.id} pendiente={p} hoy={hoy} mostrarCuando={false} />
              ))}
            </ul>
          )}

          {proximos.length > 0 && (
            <div className="mt-3 rounded-2xl bg-superficie p-3">
              <p className="mb-1 text-sm font-extrabold text-texto-suave">Próximos</p>
              <ul className="space-y-1">
                {proximos.map((p) => (
                  <li key={p.id} className="flex items-baseline gap-2 text-sm">
                    <span className="shrink-0 font-extrabold text-cielo-texto">{cuandoToca(p, hoy).texto}</span>
                    <span className="min-w-0 truncate font-semibold">{p.titulo}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
