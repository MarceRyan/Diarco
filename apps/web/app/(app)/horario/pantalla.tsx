"use client";

import { diaSemana, type BloqueHorario, type Categoria } from "@diarco/shared";
import { useBloques, useCategorias, useHoy } from "@diarco/shared/hooks";
import { CalendarClock, Plus } from "lucide-react";
import { useState } from "react";
import { Boton } from "@/components/ui/boton";
import { Dialogo } from "@/components/ui/dialogo";
import { CargandoLista, Encabezado, EstadoVacio, MensajeError } from "@/components/ui/estados";
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

  const delDia = (dia: number) => bloques.data?.filter((b) => b.dias_semana.includes(dia)) ?? [];
  const colorDe = (b: BloqueHorario) => categorias.find((c) => c.id === b.categoria_id);

  const botonNuevo = (
    <Boton onClick={() => setEdicion({ dia: diaMovil })}>
      <Plus className="size-4" aria-hidden />
      Bloque
    </Boton>
  );

  return (
    <>
      <Encabezado titulo="Horario" subtitulo="Tu semana tipo, bloque por bloque." accion={botonNuevo} />

      {bloques.isPending ? (
        <CargandoLista filas={4} alto="h-14" />
      ) : bloques.error ? (
        <MensajeError error={bloques.error} onReintentar={() => bloques.refetch()} />
      ) : bloques.data.length === 0 ? (
        <EstadoVacio
          icono={<CalendarClock className="size-6" />}
          titulo="Arma tu semana"
          descripcion="Agrega bloques como trabajo, clases o ejercicio. Se repiten cada semana en los días que elijas."
          accion={botonNuevo}
        />
      ) : (
        <>
          {/* Móvil: un día a la vez */}
          <div className="md:hidden">
            <div role="group" aria-label="Día de la semana" className="mb-4 grid grid-cols-7 gap-1">
              {DIAS.map((d) => (
                <button
                  key={d.valor}
                  type="button"
                  aria-pressed={diaMovil === d.valor}
                  aria-label={d.largo}
                  onClick={() => setDiaMovil(d.valor)}
                  className="min-h-11 rounded-xl text-sm font-medium text-texto-suave aria-pressed:bg-violeta aria-pressed:text-sobre-violeta"
                >
                  {d.corto}
                </button>
              ))}
            </div>
            <ListaDia
              bloques={delDia(diaMovil)}
              colorDe={colorDe}
              onEditar={(bloque) => setEdicion({ bloque, dia: diaMovil })}
            />
          </div>

          {/* Escritorio: la semana completa */}
          <div className="hidden grid-cols-7 gap-2 md:grid">
            {DIAS.map((d) => (
              <section key={d.valor} aria-label={d.largo} className="min-w-0">
                <h2
                  className={`mb-2 rounded-lg py-1 text-center text-sm font-semibold ${
                    d.valor === diaSemana(hoy) ? "bg-violeta-suave text-violeta" : "text-texto-suave"
                  }`}
                >
                  {d.corto}
                </h2>
                <ListaDia
                  compacta
                  bloques={delDia(d.valor)}
                  colorDe={colorDe}
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
  colorDe,
  onEditar,
  compacta = false,
}: {
  bloques: BloqueHorario[];
  colorDe: (b: BloqueHorario) => Categoria | undefined;
  onEditar: (b: BloqueHorario) => void;
  compacta?: boolean;
}) {
  if (bloques.length === 0) {
    return <p className="py-4 text-center text-sm text-texto-suave">{compacta ? "—" : "Día libre"}</p>;
  }
  return (
    <ol className="space-y-2">
      {bloques.map((b) => {
        const categoria = colorDe(b);
        return (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => onEditar(b)}
              aria-label={`${b.titulo}, de ${horaCorta(b.inicio)} a ${horaCorta(b.fin)}. Editar`}
              className="w-full rounded-xl border-l-4 bg-superficie p-3 text-left transition hover:bg-superficie-2"
              style={{ borderLeftColor: categoria?.color ?? "var(--borde)" }}
            >
              <span className="block text-xs font-medium tabular-nums text-texto-suave">
                {horaCorta(b.inicio)}–{horaCorta(b.fin)}
              </span>
              <span className={`block font-medium ${compacta ? "text-sm break-words" : ""}`}>{b.titulo}</span>
              {categoria && !compacta && <span className="text-xs text-texto-suave">{categoria.nombre}</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
