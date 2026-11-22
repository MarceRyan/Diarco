"use client";

import { agruparPendientes, type Fecha, type Pendiente } from "@diarco/shared";
import { DIAS_PENDIENTES_HECHOS, useHoy, usePendientes } from "@diarco/shared/hooks";
import { ListTodo, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AgregarPendiente, FilaPendiente } from "@/components/pendientes";
import { Boton } from "@/components/ui/boton";
import { Dialogo } from "@/components/ui/dialogo";
import { CargandoLista, claseTarjeta, Encabezado, EstadoVacio, MensajeError } from "@/components/ui/estados";
import { fechaLarga } from "@/lib/formato";
import { FormularioPendiente } from "./formulario-pendiente";

type Edicion = { modo: "nuevo" } | { modo: "editar"; pendiente: Pendiente } | null;

/** Un grupo con título y sus filas (no se muestra si está vacío). */
function Grupo({
  id,
  titulo,
  tono = "",
  lista,
  hoy,
  onEditar,
  mostrarCuando = false,
}: {
  id: string;
  titulo: ReactNode;
  tono?: string;
  lista: Pendiente[];
  hoy: Fecha;
  onEditar: (p: Pendiente) => void;
  mostrarCuando?: boolean;
}) {
  if (lista.length === 0) return null;
  return (
    <section aria-labelledby={id} className={`${claseTarjeta} px-4 pt-3 pb-1`}>
      <h2 id={id} className={`flex items-center gap-2 font-titulo text-lg font-bold first-letter:uppercase ${tono}`}>
        {titulo}
        <span className="rounded-full bg-superficie px-2 text-sm font-extrabold text-texto-suave">{lista.length}</span>
      </h2>
      <ul className="divide-y-2 divide-borde">
        {lista.map((p) => (
          <FilaPendiente key={p.id} pendiente={p} hoy={hoy} onEditar={() => onEditar(p)} mostrarCuando={mostrarCuando} />
        ))}
      </ul>
    </section>
  );
}

export function PantallaPendientes() {
  const hoy = useHoy();
  const pendientes = usePendientes();
  const [edicion, setEdicion] = useState<Edicion>(null);

  const botonNuevo = (
    <Boton onClick={() => setEdicion({ modo: "nuevo" })}>
      <Plus className="size-5" strokeWidth={3} aria-hidden />
      Nuevo pendiente
    </Boton>
  );

  const grupos = pendientes.data ? agruparPendientes(pendientes.data, hoy) : null;
  const abiertos = grupos
    ? grupos.atrasados.length + grupos.hoy.length + grupos.manana.length + grupos.proximos.length + grupos.algunDia.length
    : 0;
  const comunes = { hoy, onEditar: (p: Pendiente) => setEdicion({ modo: "editar", pendiente: p }) };

  return (
    <>
      <Encabezado
        titulo="Pendientes"
        subtitulo="Lo que tienes que hacer una sola vez: tareas y eventos, con o sin fecha."
        accion={botonNuevo}
      />

      {pendientes.isPending ? (
        <CargandoLista filas={4} alto="h-20" />
      ) : pendientes.error ? (
        <MensajeError error={pendientes.error} onReintentar={() => pendientes.refetch()} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-4">
            {abiertos === 0 && (
              <EstadoVacio
                icono={<ListTodo className="size-7" strokeWidth={2.5} />}
                titulo="Nada pendiente"
                descripcion="Anota lo que tengas que hacer una vez, como pagar la luz o una cita. Si se pasa la fecha, te lo recordamos en Hoy."
                accion={botonNuevo}
              />
            )}
            <Grupo {...comunes} id="g-atrasados" titulo="Atrasados" tono="text-peligro-texto" lista={grupos!.atrasados} mostrarCuando />
            <Grupo {...comunes} id="g-hoy" titulo="Hoy" lista={grupos!.hoy} />
            <Grupo {...comunes} id="g-manana" titulo="Mañana" lista={grupos!.manana} />
            {grupos!.proximos.map((d) => (
              <Grupo {...comunes} key={d.fecha} id={`g-${d.fecha}`} titulo={fechaLarga(d.fecha)} lista={d.pendientes} />
            ))}
            <Grupo {...comunes} id="g-algun-dia" titulo="Algún día" tono="text-texto-suave" lista={grupos!.algunDia} />

            {grupos!.hechos.length > 0 && (
              <details className={`${claseTarjeta} group px-4 py-3`}>
                <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-titulo text-lg font-bold text-texto-suave">
                  Hechos en los últimos {DIAS_PENDIENTES_HECHOS} días
                  <span className="rounded-full bg-superficie px-2 text-sm font-extrabold">{grupos!.hechos.length}</span>
                </summary>
                <ul className="divide-y-2 divide-borde">
                  {grupos!.hechos.map((p) => (
                    <FilaPendiente key={p.id} pendiente={p} hoy={hoy} onEditar={() => comunes.onEditar(p)} />
                  ))}
                </ul>
              </details>
            )}
          </div>

          <aside className={`${claseTarjeta} space-y-3 p-4 lg:sticky lg:top-10`} aria-label="Anotar rápido">
            <p className="font-titulo text-lg font-bold">Anotar rápido</p>
            <div className="space-y-1.5">
              <p className="text-sm font-extrabold text-texto-suave">Para hoy</p>
              <AgregarPendiente fecha={hoy} placeholder="Ej. Comprar pan" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-extrabold text-texto-suave">Para algún día</p>
              <AgregarPendiente fecha={null} placeholder="Ej. Leer ese libro" />
            </div>
            <p className="text-sm text-texto-suave">Para otra fecha o con hora, usa «Nuevo pendiente».</p>
          </aside>
        </div>
      )}

      <Dialogo
        abierto={edicion !== null}
        onCerrar={() => setEdicion(null)}
        titulo={edicion?.modo === "editar" ? "Editar pendiente" : "Nuevo pendiente"}
      >
        {edicion && (
          <FormularioPendiente
            key={edicion.modo === "editar" ? edicion.pendiente.id : "nuevo"}
            pendiente={edicion.modo === "editar" ? edicion.pendiente : undefined}
            onListo={() => setEdicion(null)}
          />
        )}
      </Dialogo>
    </>
  );
}
