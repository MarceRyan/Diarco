"use client";

import { diaSemana, type BloqueHorario, type Categoria } from "@diarco/shared";
import { useBloques, useCategorias, useHoy } from "@diarco/shared/hooks";
import { CalendarClock, Plus } from "lucide-react";
import { useState } from "react";
import { Boton } from "@/components/ui/boton";
import { Dialogo } from "@/components/ui/dialogo";
import { CargandoLista, claseTarjeta, Encabezado, EstadoVacio, MensajeError } from "@/components/ui/estados";
import { horaCorta } from "@/lib/formato";
import { FormularioBloque } from "./formulario-bloque";

/** Lunes a domingo (valor 0 = domingo). */
const DIAS = [
  { valor: 1, corto: "Lun", largo: "Lunes" },
  { valor: 2, corto: "Mar", largo: "Martes" },
  { valor: 3, corto: "Mié", largo: "Miércoles" },
  { valor: 4, corto: "Jue", largo: "Jueves" },
  { valor: 5, corto: "Vie", largo: "Viernes" },
  { valor: 6, corto: "Sáb", largo: "Sábado" },
  { valor: 0, corto: "Dom", largo: "Domingo" },
];

type Edicion = { bloque?: BloqueHorario; dia: number } | null;

export function PantallaHorario() {
  const hoy = useHoy();
  const bloques = useBloques();
  const { data: categorias = [] } = useCategorias();
  const [diaMovil, setDiaMovil] = useState<number>(() => diaSemana(hoy));
  const [edicion, setEdicion] = useState<Edicion>(null);
  const diaHoy = diaSemana(hoy);

  const delDia = (dia: number) => bloques.data?.filter((b) => b.dias_semana.includes(dia)) ?? [];
  const categoriaDe = (b: BloqueHorario) => categorias.find((c) => c.id === b.categoria_id);

  const botonNuevo = (
    <Boton onClick={() => setEdicion({ dia: diaMovil })}>
      <Plus className="size-5" strokeWidth={3} aria-hidden />
      Agregar bloque
    </Boton>
  );

  return (
    <>
      <Encabezado titulo="Tu semana" subtitulo="Organiza tu horario bloque por bloque." accion={botonNuevo} />

      {bloques.isPending ? (
        <CargandoLista filas={4} alto="h-16" />
      ) : bloques.error ? (
        <MensajeError error={bloques.error} onReintentar={() => bloques.refetch()} />
      ) : bloques.data.length === 0 ? (
        <EstadoVacio
          icono={<CalendarClock className="size-7" strokeWidth={2.5} />}
          titulo="Arma tu semana"
          descripcion="Agrega bloques como trabajo, clases o ejercicio. Se repiten cada semana en los días que elijas."
          accion={botonNuevo}
        />
      ) : (
        <>
          {/* Móvil: un día a la vez */}
          <div className="md:hidden">
            <div role="group" aria-label="Día de la semana" className="mb-4 grid grid-cols-7 gap-1.5">
              {DIAS.map((d) => (
                <button
                  key={d.valor}
                  type="button"
                  aria-pressed={diaMovil === d.valor}
                  aria-label={d.largo}
                  onClick={() => setDiaMovil(d.valor)}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 border-b-4 text-sm font-extrabold transition-transform duration-100 active:translate-y-[2px] active:border-b-2 aria-pressed:border-cielo-labio aria-pressed:bg-cielo aria-pressed:text-white ${
                    d.valor === diaHoy ? "border-cielo/50 bg-cielo-suave text-cielo-texto" : "border-borde bg-tarjeta text-texto-suave"
                  }`}
                >
                  {d.corto}
                  {d.valor === diaHoy && <span className="text-[10px] leading-none">hoy</span>}
                </button>
              ))}
            </div>
            <ListaDia
              bloques={delDia(diaMovil)}
              categoriaDe={categoriaDe}
              onEditar={(bloque) => setEdicion({ bloque, dia: diaMovil })}
            />
          </div>

          {/* Escritorio: la semana completa */}
          <div className="hidden grid-cols-7 gap-2 md:grid">
            {DIAS.map((d) => (
              <section key={d.valor} aria-label={d.largo} className="min-w-0">
                <h2
                  className={`mb-2 rounded-xl py-1.5 text-center font-extrabold ${
                    d.valor === diaHoy ? "bg-cielo text-white" : "text-texto-suave"
                  }`}
                >
                  {d.corto}
                </h2>
                <ListaDia
                  compacta
                  bloques={delDia(d.valor)}
                  categoriaDe={categoriaDe}
                  onEditar={(bloque) => setEdicion({ bloque, dia: d.valor })}
                />
              </section>
            ))}
          </div>
        </>
      )}

      <Dialogo
        abierto={edicion !== null}
        onCerrar={() => setEdicion(null)}
        titulo={edicion?.bloque ? "Editar bloque" : "Nuevo bloque"}
      >
        {edicion && (
          <FormularioBloque
            key={edicion.bloque?.id ?? "nuevo"}
            bloque={edicion.bloque}
            diaInicial={edicion.dia}
            onListo={() => setEdicion(null)}
          />
        )}
      </Dialogo>
    </>
  );
}

function ListaDia({
  bloques,
  categoriaDe,
  onEditar,
  compacta = false,
}: {
  bloques: BloqueHorario[];
  categoriaDe: (b: BloqueHorario) => Categoria | undefined;
  onEditar: (b: BloqueHorario) => void;
  compacta?: boolean;
}) {
  if (bloques.length === 0) {
    return compacta ? (
      <p className="py-4 text-center text-texto-suave" aria-label="Sin bloques">
        —
      </p>
    ) : (
      <p className={`${claseTarjeta} p-5 text-center text-texto-suave`}>Día libre. ¡Disfrútalo! 🌤️</p>
    );
  }
  return (
    <ol className="space-y-2">
      {bloques.map((b) => {
        const categoria = categoriaDe(b);
        return (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => onEditar(b)}
              aria-label={`${b.titulo}, de ${horaCorta(b.inicio)} a ${horaCorta(b.fin)}. Editar`}
              className={`${claseTarjeta} w-full text-left transition-transform duration-100 hover:border-borde-fuerte active:translate-y-[2px] active:border-b-2 ${
                compacta ? "p-2.5" : "flex items-center gap-3 p-3"
              }`}
            >
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg bg-cielo-suave font-extrabold text-cielo-texto tabular-nums ${
                  compacta ? "px-1.5 py-0.5 text-[11px]" : "shrink-0 px-2.5 py-1 text-sm"
                }`}
              >
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: categoria?.color ?? "var(--cielo)" }} aria-hidden />
                {horaCorta(b.inicio)}
                {!compacta && `–${horaCorta(b.fin)}`}
              </span>
              <span className={`block font-bold ${compacta ? "mt-1 text-sm break-words" : "min-w-0 flex-1 truncate"}`}>{b.titulo}</span>
              {categoria && !compacta && <span className="shrink-0 text-sm text-texto-suave">{categoria.nombre}</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
