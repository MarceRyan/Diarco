"use client";

import type { Habito } from "@diarco/shared";
import { useHabitos, useRachas } from "@diarco/shared/hooks";
import { Pencil, Plus, Trophy } from "lucide-react";
import { useState } from "react";
import { InsigniaRacha } from "@/components/racha";
import { Boton } from "@/components/ui/boton";
import { Dialogo } from "@/components/ui/dialogo";
import { CargandoLista, claseTarjeta, Encabezado, EstadoVacio, MensajeError } from "@/components/ui/estados";
import { FormularioHabito } from "./formulario-habito";

type Edicion = { modo: "nuevo" } | { modo: "editar"; habito: Habito } | null;

/** Lunes a domingo, para la fila de días de cada tarjeta. */
const SEMANA = [
  { valor: 1, letra: "L", nombre: "lunes" },
  { valor: 2, letra: "M", nombre: "martes" },
  { valor: 3, letra: "X", nombre: "miércoles" },
  { valor: 4, letra: "J", nombre: "jueves" },
  { valor: 5, letra: "V", nombre: "viernes" },
  { valor: 6, letra: "S", nombre: "sábado" },
  { valor: 0, letra: "D", nombre: "domingo" },
];

export function PantallaHabitos() {
  const habitos = useHabitos();
  const { data: rachas } = useRachas();
  const [edicion, setEdicion] = useState<Edicion>(null);

  const botonNuevo = (
    <Boton variante="exito" onClick={() => setEdicion({ modo: "nuevo" })}>
      <Plus className="size-5" strokeWidth={3} aria-hidden />
      Nuevo hábito
    </Boton>
  );

  const activos = habitos.data?.filter((h) => h.activo) ?? [];
  const pausados = habitos.data?.filter((h) => !h.activo) ?? [];

  return (
    <>
      <Encabezado titulo="Tus hábitos" subtitulo="Las pequeñas cosas que quieres repetir." accion={botonNuevo} />

      {habitos.isPending ? (
        <CargandoLista filas={4} alto="h-28" />
      ) : habitos.error ? (
        <MensajeError error={habitos.error} onReintentar={() => habitos.refetch()} />
      ) : habitos.data.length === 0 ? (
        <EstadoVacio
          titulo="Tu primer hábito te espera"
          descripcion="Elige algo pequeño: tomar agua, leer 10 páginas, caminar un rato. Cada día que lo cumplas suma a tu racha."
          accion={botonNuevo}
        />
      ) : (
        <div className="space-y-8">
          <ul className="grid gap-3 sm:grid-cols-2">
            {activos.map((h) => (
              <TarjetaHabito
                key={h.id}
                habito={h}
                racha={rachas?.porHabito.get(h.id)?.actual}
                mejor={rachas?.porHabito.get(h.id)?.maxima}
                onEditar={() => setEdicion({ modo: "editar", habito: h })}
              />
            ))}
          </ul>

          {pausados.length > 0 && (
            <section aria-labelledby="titulo-pausados">
              <h2 id="titulo-pausados" className="mb-3 font-titulo text-xl font-bold text-texto-suave">
                En pausa
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {pausados.map((h) => (
                  <TarjetaHabito key={h.id} habito={h} onEditar={() => setEdicion({ modo: "editar", habito: h })} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <Dialogo
        abierto={edicion !== null}
        onCerrar={() => setEdicion(null)}
        titulo={edicion?.modo === "editar" ? "Editar hábito" : "Nuevo hábito"}
      >
        {edicion && (
          <FormularioHabito
            key={edicion.modo === "editar" ? edicion.habito.id : "nuevo"}
            habito={edicion.modo === "editar" ? edicion.habito : undefined}
            onListo={() => setEdicion(null)}
          />
        )}
      </Dialogo>
    </>
  );
}

function TarjetaHabito({
  habito,
  racha,
  mejor,
  onEditar,
}: {
  habito: Habito;
  racha?: number;
  mejor?: number;
  onEditar: () => void;
}) {
  const dias = new Set(habito.dias_semana);
  return (
    <li className={`${claseTarjeta} flex flex-col gap-3 p-4 ${habito.activo ? "" : "opacity-70"}`}>
      <div className="flex items-start gap-3">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
          style={{ backgroundColor: `${habito.color}26` }}
          aria-hidden
        >
          {habito.icono}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-titulo text-xl font-bold">{habito.nombre}</p>
          <p className="truncate text-sm text-texto-suave">{habito.meta ?? (habito.activo ? "Sin meta definida" : "En pausa")}</p>
        </div>
        <Boton variante="fantasma" icono aria-label={`Editar ${habito.nombre}`} onClick={onEditar}>
          <Pencil className="size-5" strokeWidth={2.5} aria-hidden />
        </Boton>
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Días programados: punto relleno con el color del hábito */}
        <ul className="flex gap-1" aria-label={`Días: ${SEMANA.filter((d) => dias.has(d.valor)).map((d) => d.nombre).join(", ")}`}>
          {SEMANA.map((d) => (
            <li
              key={d.valor}
              aria-hidden
              className="flex size-7 items-center justify-center rounded-lg text-[11px] font-extrabold"
              style={
                dias.has(d.valor)
                  ? { backgroundColor: habito.color, color: "#fff" }
                  : { backgroundColor: "var(--superficie)", color: "var(--texto-suave)" }
              }
            >
              {d.letra}
            </li>
          ))}
        </ul>
        {habito.activo && racha !== undefined && (
          <div className="flex items-center gap-2">
            <InsigniaRacha dias={racha} />
            <span
              className="inline-flex items-center gap-1 rounded-full bg-amarillo-suave px-2 py-1 text-sm font-extrabold text-amarillo-texto"
              title="Tu mejor racha"
            >
              <Trophy className="size-3.5" strokeWidth={2.5} aria-hidden />
              <span className="sr-only">Mejor racha:</span>
              {mejor ?? 0}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}
