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
import { ChartColumn } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BarrasHorizontales, GraficoArea, GraficoColumnas, MapaCalor, TarjetaGrafico } from "@/components/graficos";
import { CargandoLista, Encabezado, Esqueleto, EstadoVacio, MensajeError } from "@/components/ui/estados";
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
      <Encabezado titulo="Estadísticas" subtitulo="Cómo vas con tus hábitos y en qué se va tu tiempo." />
      {habitos.data.length === 0 ? (
        <EstadoVacio
          icono={<ChartColumn className="size-6" />}
          titulo="Aún no hay nada que medir"
          descripcion="Crea hábitos y márcalos durante algunos días: aquí verás tu progreso."
          accion={
            <Link href="/habitos" className="inline-flex min-h-11 items-center rounded-xl bg-violeta px-4 text-sm font-semibold text-sobre-violeta">
              Crear hábito
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Filtro de periodo: una fila sobre los gráficos */}
          <div role="group" aria-label="Periodo" className="inline-flex rounded-xl border border-borde p-1">
            {PERIODOS.map((p) => (
              <button
                key={p.dias}
                type="button"
                aria-pressed={periodo === p.dias}
                onClick={() => setPeriodo(p.dias)}
                className="min-h-11 rounded-lg px-4 text-sm font-medium text-texto-suave aria-pressed:bg-violeta-suave aria-pressed:text-violeta"
              >
                {p.etiqueta}
              </button>
            ))}
          </div>
          <Contenido dias={periodo} />
          <MapaAnual />
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
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Esqueleto key={i} className="h-24" />
          ))}
        </div>
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Dato etiqueta="Cumplimiento" valor={tasa === null ? "—" : porcentaje(tasa)} detalle="de los días programados" />
        <Dato
          etiqueta="Racha general"
          valor={`${rachas.general.actual} ${rachas.general.actual === 1 ? "día" : "días"}`}
          detalle={`Mejor: ${rachas.general.maxima}`}
        />
        <Dato etiqueta="Tiempo registrado" valor={minutos > 0 ? duracion(minutos) : "—"} detalle="en la bitácora" />
        <Dato etiqueta="Ánimo promedio" valor={animoMedio === null ? "—" : `${animoMedio} / 5`} detalle={`${animo.data.length} días registrados`} />
      </div>

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

      <TarjetaGrafico
        titulo="Tiempo por categoría"
        descripcion="Minutos registrados en la bitácora."
        tabla={porCategoria.map((c) => [nombreCategoria(c.categoria_id)?.nombre ?? "Sin categoría", duracion(c.minutos)])}
      >
        {porCategoria.length === 0 ? (
          <SinDatos>
            Registra actividades con minutos en la <Link href="/bitacora" className="font-medium text-violeta underline">Bitácora</Link> para ver en qué se va tu tiempo.
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

function Dato({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle: string }) {
  return (
    <div className="rounded-2xl border border-borde p-4">
      <p className="text-sm text-texto-suave">{etiqueta}</p>
      <p className="mt-1 font-titulo text-2xl font-semibold">{valor}</p>
      <p className="text-xs text-texto-suave">{detalle}</p>
    </div>
  );
}

function SinDatos({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-borde p-4 text-sm text-texto-suave">{children}</p>;
}
