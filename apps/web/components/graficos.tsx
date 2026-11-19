"use client";

/**
 * Gráficos de Diarco. Reglas (skill dataviz):
 *  - Una serie por gráfico, color --grafico; sin leyenda (el título dice qué es).
 *  - Barras de máx. 24 px con 4 px de radio en el extremo; líneas de 2 px.
 *  - Cuadrícula de líneas finas sólidas; texto siempre en tokens de texto.
 *  - Tooltip al pasar el cursor y una tabla "Ver datos" como alternativa accesible.
 */
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fechaCorta } from "@/lib/formato";
import { claseTarjeta } from "./ui/estados";

// -----------------------------------------------------------------------------
// Contenedor con título y tabla de datos
// -----------------------------------------------------------------------------
export function TarjetaGrafico({
  titulo,
  descripcion,
  tabla,
  children,
}: {
  titulo: string;
  descripcion?: string;
  /** Filas [etiqueta, valor] para la vista de tabla. */
  tabla: [string, string][];
  children: ReactNode;
}) {
  return (
    <figure className={`${claseTarjeta} p-4 sm:p-5`}>
      <figcaption className="mb-4">
        <span className="block font-titulo text-xl font-bold">{titulo}</span>
        {descripcion && <span className="block text-texto-suave">{descripcion}</span>}
      </figcaption>
      {children}
      <details className="mt-3 text-sm">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-extrabold text-texto-suave hover:text-texto">
          Ver datos
        </summary>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-left">
            <tbody>
              {tabla.map(([etiqueta, valor]) => (
                <tr key={etiqueta} className="border-t border-borde">
                  <th scope="row" className="py-1.5 font-normal text-texto-suave">
                    {etiqueta}
                  </th>
                  <td className="py-1.5 text-right tabular-nums">{valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

// -----------------------------------------------------------------------------
// Tooltip común
// -----------------------------------------------------------------------------
type PropsTooltip = {
  active?: boolean;
  payload?: readonly { value?: unknown; payload?: { etiqueta?: string } }[];
  formato: (v: number) => string;
};

function ContenidoTooltip({ active, payload, formato }: PropsTooltip) {
  const punto = payload?.[0];
  if (!active || !punto) return null;
  const valor = typeof punto.value === "number" ? formato(punto.value) : "Sin hábitos";
  return (
    <div className="rounded-2xl border-2 border-b-4 border-borde bg-tarjeta px-3 py-2 text-sm">
      <p className="font-bold text-texto-suave">{punto.payload?.etiqueta}</p>
      <p className="font-titulo text-lg font-bold tabular-nums">{valor}</p>
    </div>
  );
}

const ejeComun = {
  stroke: "var(--borde)",
  tick: { fill: "var(--texto-suave)", fontSize: 12 },
  tickLine: false,
} as const;

// -----------------------------------------------------------------------------
// Área: evolución diaria (0..100 %)
// -----------------------------------------------------------------------------
export function GraficoArea({
  datos,
  formato,
  alto = 220,
}: {
  datos: { fecha: string; valor: number | null }[];
  formato: (v: number) => string;
  alto?: number;
}) {
  const puntos = datos.map((d) => ({ ...d, etiqueta: fechaCorta(d.fecha) }));
  return (
    <div style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={puntos} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--borde)" />
          <XAxis dataKey="etiqueta" {...ejeComun} interval="preserveStartEnd" minTickGap={24} />
          <YAxis {...ejeComun} axisLine={false} domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            content={(props) => <ContenidoTooltip {...props} formato={formato} />}
            cursor={{ stroke: "var(--texto-suave)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="valor"
            stroke="var(--grafico)"
            strokeWidth={2}
            fill="var(--grafico)"
            fillOpacity={0.1}
            connectNulls
            dot={false}
            activeDot={{ r: 5, fill: "var(--grafico)", stroke: "var(--fondo)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Columnas: comparación entre pocas categorías ordenadas (días de la semana)
// -----------------------------------------------------------------------------
export function GraficoColumnas({
  datos,
  formato,
  max,
  alto = 200,
}: {
  datos: { etiqueta: string; valor: number | null }[];
  formato: (v: number) => string;
  max?: number;
  alto?: number;
}) {
  return (
    <div style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--borde)" />
          <XAxis dataKey="etiqueta" {...ejeComun} />
          <YAxis
            {...ejeComun}
            axisLine={false}
            domain={[0, max ?? "auto"]}
            ticks={max === 100 ? [0, 50, 100] : undefined}
            tickFormatter={(v) => (max === 100 ? `${v}%` : String(v))}
          />
          <Tooltip
            content={(props) => <ContenidoTooltip {...props} formato={formato} />}
            cursor={{ fill: "var(--superficie)" }}
          />
          <Bar dataKey="valor" fill="var(--grafico)" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Barras horizontales (HTML): ranking con etiquetas largas que no se recortan
// -----------------------------------------------------------------------------
export function BarrasHorizontales({
  filas,
  max,
}: {
  filas: { id: string | number; etiqueta: ReactNode; valor: number; texto: string }[];
  max: number;
}) {
  return (
    <ul className="space-y-3">
      {filas.map((f) => (
        <li key={f.id} className="space-y-1" title={f.texto}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate font-bold">{f.etiqueta}</span>
            <span className="shrink-0 font-extrabold tabular-nums text-texto-suave">{f.texto}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-superficie" aria-hidden>
            <div
              className="h-full rounded-full bg-grafico"
              style={{ width: `${max > 0 ? Math.max(2, (f.valor / max) * 100) : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// -----------------------------------------------------------------------------
// Mapa de calor tipo calendario (HTML)
// -----------------------------------------------------------------------------
const COLOR_NIVEL = ["var(--superficie-2)", "var(--calor-1)", "var(--calor-2)", "var(--calor-3)", "var(--calor-4)"];

export function MapaCalor({
  semanas,
}: {
  /** Columnas de 7 días (lunes a domingo); null = fuera del rango. */
  semanas: ({ fecha: string; nivel: 0 | 1 | 2 | 3 | 4; texto: string } | null)[][];
}) {
  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1" role="img" aria-label="Mapa de calor del cumplimiento diario. Los valores están en la tabla Ver datos.">
        {semanas.map((semana, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {semana.map((dia, j) =>
              dia ? (
                <span
                  key={dia.fecha}
                  title={`${fechaCorta(dia.fecha)}: ${dia.texto}`}
                  className="size-3.5 rounded-[3px] sm:size-4"
                  style={{ backgroundColor: COLOR_NIVEL[dia.nivel] }}
                />
              ) : (
                <span key={`vacio-${j}`} className="size-3.5 sm:size-4" />
              ),
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-texto-suave" aria-hidden>
        Menos
        {COLOR_NIVEL.map((color) => (
          <span key={color} className="size-3 rounded-[3px]" style={{ backgroundColor: color }} />
        ))}
        Más
      </div>
    </div>
  );
}
