"use client";

import {
  cumplimientoPorDiaSemana,
  cumplimientoPorHabito,
  minutosPorCategoria,
  nivelIntensidad,
  promedioAnimo,
  semanasCalendario,
  sumarDias,
  tasaCumplimiento,
} from "@diarco/shared";
import {
  useActividadesRango,
  useAnimoRango,
  useCategorias,
  useCumplimiento,
  useHabitos,
  useHoy,
  useRachas,
  useRango,
  useResumenRango,
} from "@diarco/shared/hooks";
import { ChartColumn, Clock, Flame, Smile, Target } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { DescubrimientosAnimo } from "@/components/descubrimientos";
import { BarrasHorizontales, GraficoArea, GraficoColumnas, MapaCalor, TarjetaGrafico } from "@/components/graficos";
import { claseBoton } from "@/components/ui/boton";
import { CargandoLista, claseTarjeta, Encabezado, Esqueleto, EstadoVacio, MensajeError } from "@/components/ui/estados";
import { duracion, fechaCorta, porcentaje } from "@/lib/formato";

const PERIODOS = [
  { dias: 7, etiqueta: "7 días" },
  { dias: 30, etiqueta: "30 días" },
  { dias: 90, etiqueta: "90 días" },
];

/** Semanas que muestra el mapa de calor (independiente del periodo elegido). */
const SEMANAS_MAPA = 17;

export function PantallaEstadisticas() {
  const [periodo, setPeriodo] = useState(30);
  const habitos = useHabitos();

  if (habitos.isPending) return <CargandoLista filas={4} alto="h-40" />;
  if (habitos.error) return <MensajeError error={habitos.error} onReintentar={() => habitos.refetch()} />;

  return (
    <>
      <Encabezado titulo="Tu progreso" subtitulo="Cómo vas con tus hábitos y en qué se va tu tiempo." />
      {habitos.data.length === 0 ? (
        <EstadoVacio
          icono={<ChartColumn className="size-7" strokeWidth={2.5} />}
          titulo="Aún no hay nada que medir"
          descripcion="Crea hábitos y márcalos unos días: aquí verás cómo vas creciendo."
          accion={
            <Link href="/habitos" className={claseBoton("primario")}>
              Crear un hábito
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">

          {/* Filtro de periodo: una fila sobre los gráficos */}
          <div role="group" aria-label="Periodo" className="inline-flex gap-1 rounded-2xl border-2 border-borde bg-tarjeta p-1">
            {PERIODOS.map((p) => (
              <button
                key={p.dias}
                type="button"
                aria-pressed={periodo === p.dias}
                onClick={() => setPeriodo(p.dias)}
                className="min-h-11 rounded-xl px-4 font-extrabold text-texto-suave transition-colors aria-pressed:bg-violeta aria-pressed:text-sobre-violeta"
              >
                {p.etiqueta}
              </button>
            ))}
          </div>
          <Contenido dias={periodo} />
        </div>
      )}
    </>
  );
}

function Contenido({ dias }: { dias: number }) {
  const { desde, hasta } = useRango(dias);
  const cumplimiento = useCumplimiento(desde, hasta);
  const resumen = useResumenRango(desde, hasta);
  const actividades = useActividadesRango(desde, hasta);
  const animo = useAnimoRango(desde, hasta);
  const { data: rachas } = useRachas();
  const { data: habitos = [] } = useHabitos();
  const { data: categorias = [] } = useCategorias();

  const error = cumplimiento.error ?? resumen.error ?? actividades.error ?? animo.error;
  if (error) return <MensajeError error={error} onReintentar={() => cumplimiento.refetch()} />;
  if (!cumplimiento.data || !resumen.data || !actividades.data || !animo.data || !rachas) {
    return (
      <div className="space-y-6">
        <Esqueleto className="h-56" />
        <Esqueleto className="h-72" />
      </div>
    );
  }

  const tasa = tasaCumplimiento(cumplimiento.data);
  const minutos = actividades.data.reduce((t, a) => t + (a.minutos ?? 0), 0);
  const animoMedio = promedioAnimo(animo.data);
  const porHabito = cumplimientoPorHabito(cumplimiento.data);
  const porDia = cumplimientoPorDiaSemana(cumplimiento.data);
  // Lunes primero, domingo al final.
  const porDiaOrdenado = [...porDia.slice(1), porDia[0]!];
  const porCategoria = minutosPorCategoria(actividades.data).filter((c) => c.minutos > 0);
  const nombreHabito = (id: number) => habitos.find((h) => h.id === id);
  const nombreCategoria = (id: number | null) => categorias.find((c) => c.id === id);

  return (
    <>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
        {/* Resumen del periodo en frases: lo que importa, dicho como lo diría un amigo */}
        <section aria-label="Resumen del periodo" className={`${claseTarjeta} divide-y-2 divide-borde`}>
          <Frase icono={<Target className="size-5" strokeWidth={2.5} />} color="bg-violeta text-white">
            {tasa === null ? (
              "No tuviste hábitos programados en este periodo."
            ) : (
              <>
                Cumpliste el <strong className="text-violeta-texto">{porcentaje(tasa)}</strong> de tus hábitos programados.
              </>
            )}
          </Frase>
          <Frase icono={<Flame className="size-5" strokeWidth={2.5} />} color="bg-mandarina text-white">
            Tu racha va en{" "}
            <strong className="text-mandarina-texto">
              {rachas.general.actual} {rachas.general.actual === 1 ? "día" : "días"}
            </strong>
            ; tu mejor marca es de {rachas.general.maxima}.
          </Frase>
          <Frase icono={<Clock className="size-5" strokeWidth={2.5} />} color="bg-cielo text-white">
            {minutos > 0 ? (
              <>
                Registraste <strong className="text-cielo-texto">{duracion(minutos)}</strong> en tu bitácora.
              </>
            ) : (
              "Aún no registras tiempo en la bitácora en este periodo."
            )}
          </Frase>
          <Frase icono={<Smile className="size-5" strokeWidth={2.5} />} color="bg-amarillo text-[#2a2342]">
            {animoMedio === null ? (
              "Cuéntanos cómo te sientes en Hoy para ver tu ánimo aquí."
            ) : (
              <>
                Tu ánimo promedio fue <strong className="text-amarillo-texto">{animoMedio} de 5</strong> ({animo.data.length}{" "}
                {animo.data.length === 1 ? "día" : "días"}).
              </>
            )}
          </Frase>
        </section>

        <TarjetaGrafico
          titulo="Cumplimiento diario"
          descripcion="Porcentaje de hábitos programados que cumpliste cada día."
          tabla={resumen.data.map((d) => [fechaCorta(d.fecha), d.porcentaje === null ? "Sin hábitos" : porcentaje(d.porcentaje)])}
        >
          <GraficoArea
            datos={resumen.data.map((d) => ({ fecha: d.fecha, valor: d.porcentaje === null ? null : Math.round(d.porcentaje * 100) }))}
            formato={(v) => `${v} %`}
          />
        </TarjetaGrafico>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TarjetaGrafico
          titulo="Por día de la semana"
          descripcion="Qué días te cuesta más."
          tabla={porDiaOrdenado.map((d) => [d.nombre, d.tasa === null ? "Sin hábitos" : porcentaje(d.tasa)])}
        >
          <GraficoColumnas
            datos={porDiaOrdenado.map((d) => ({ etiqueta: d.nombre, valor: d.tasa === null ? null : Math.round(d.tasa * 100) }))}
            formato={(v) => `${v} %`}
            max={100}
          />
        </TarjetaGrafico>

        <TarjetaGrafico
          titulo="Por hábito"
          descripcion="Cumplimiento de cada hábito en el periodo."
          tabla={porHabito.map((h) => [nombreHabito(h.habito_id)?.nombre ?? "Hábito", `${h.completados} de ${h.programados}`])}
        >
          {porHabito.length === 0 ? (
            <SinDatos>No hubo días programados en este periodo.</SinDatos>
          ) : (
            <BarrasHorizontales
              max={1}
              filas={[...porHabito]
                .sort((a, b) => (b.tasa ?? 0) - (a.tasa ?? 0))
                .map((h) => {
                  const habito = nombreHabito(h.habito_id);
                  return {
                    id: h.habito_id,
                    etiqueta: (
                      <>
                        <span aria-hidden>{habito?.icono}</span> {habito?.nombre ?? "Hábito"}
                      </>
                    ),
                    valor: h.tasa ?? 0,
                    texto: h.tasa === null ? "—" : porcentaje(h.tasa),
                  };
                })}
            />
          )}
        </TarjetaGrafico>
      </div>

      <DescubrimientosAnimo />

      <div className="grid gap-6 xl:grid-cols-2">
        <TarjetaGrafico
          titulo="Tiempo por categoría"
          descripcion="Minutos registrados en la bitácora."
          tabla={porCategoria.map((c) => [nombreCategoria(c.categoria_id)?.nombre ?? "Sin categoría", duracion(c.minutos)])}
        >
          {porCategoria.length === 0 ? (
            <SinDatos>
              Registra actividades con minutos en la <Link href="/bitacora" className="font-medium text-violeta-texto underline">Bitácora</Link> para ver en qué se va tu tiempo.
            </SinDatos>
          ) : (
            <BarrasHorizontales
              max={porCategoria[0]!.minutos}
              filas={porCategoria.map((c) => {
                const categoria = nombreCategoria(c.categoria_id);
                return {
                  id: c.categoria_id ?? "sin",
                  etiqueta: (
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: categoria?.color ?? "#868e96" }} aria-hidden />
                      {categoria?.nombre ?? "Sin categoría"}
                    </span>
                  ),
                  valor: c.minutos,
                  texto: duracion(c.minutos),
                };
              })}
            />
          )}
        </TarjetaGrafico>
        <MapaAnual />
      </div>
    </>
  );
}

function MapaAnual() {
  const hoy = useHoy();
  // Desde el lunes de hace SEMANAS_MAPA semanas hasta hoy.
  const desde = sumarDias(hoy, -(SEMANAS_MAPA * 7 - 1));
  const resumen = useResumenRango(desde, hoy);

  if (resumen.error) return <MensajeError error={resumen.error} onReintentar={() => resumen.refetch()} />;
  if (!resumen.data) return <Esqueleto className="h-48" />;

  const porFecha = new Map(resumen.data.map((d) => [d.fecha, d]));
  const semanas = semanasCalendario(desde, hoy).map((semana) =>
    semana.map((fecha) => {
      if (!fecha) return null;
      const dia = porFecha.get(fecha);
      const p = dia?.porcentaje ?? null;
      return { fecha, nivel: nivelIntensidad(p), texto: p === null ? "sin hábitos" : porcentaje(p) };
    }),
  );

  return (
    <TarjetaGrafico
      titulo={`Últimas ${SEMANAS_MAPA} semanas`}
      descripcion="Cada cuadro es un día; más oscuro, más hábitos cumplidos."
      tabla={resumen.data
        .filter((d) => d.programados > 0)
        .map((d) => [fechaCorta(d.fecha), porcentaje(d.porcentaje ?? 0)])}
    >
      <MapaCalor semanas={semanas} />
    </TarjetaGrafico>
  );
}

/** Una línea del resumen: burbuja de color con ícono + frase. */
function Frase({ icono, color, children }: { icono: ReactNode; color: string; children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 px-4 py-3.5 text-lg font-semibold">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${color}`} aria-hidden>
        {icono}
      </span>
      <span>{children}</span>
    </p>
  );
}

function SinDatos({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border-2 border-dashed border-borde-fuerte p-4 text-texto-suave">{children}</p>;
}
