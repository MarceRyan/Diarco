"use client";

import { diaSemana, siguienteHito, UMBRAL_RACHA_GENERAL, type Habito } from "@diarco/shared";
import {
  useAnimo,
  useBloques,
  useCategorias,
  useGuardarAnimo,
  useHabitos,
  useHoy,
  useMarcarHabito,
  usePerfil,
  useRachas,
} from "@diarco/shared/hooks";
import { Check, Coffee, Sparkles } from "lucide-react";
import Link from "next/link";
import { ChipCategoria } from "@/components/categorias";
import { InsigniaRacha } from "@/components/racha";
import { CargandoLista, Encabezado, Esqueleto, EstadoVacio, MensajeError } from "@/components/ui/estados";
import { fechaLarga, horaCorta } from "@/lib/formato";

export function PantallaHoy() {
  const hoy = useHoy();
  const perfil = usePerfil();
  const nombre = perfil.data?.nombre;

  return (
    <>
      <Encabezado titulo={nombre ? `Hola, ${nombre}` : "Hoy"} subtitulo={fechaLarga(hoy)} />
      <div className="space-y-8">
        <TarjetaRachaGeneral />
        <HabitosDeHoy />
        <SelectorAnimo />
        <AgendaDeHoy />
      </div>
    </>
  );
}

function TarjetaRachaGeneral() {
  const { data: rachas, isPending } = useRachas();
  if (isPending || !rachas) return <Esqueleto className="h-36" />;

  const { actual, porcentajeHoy, cumpleHoy } = rachas.general;
  const porcentaje = Math.round((porcentajeHoy ?? 0) * 100);
  const proximo = siguienteHito(actual);
  const umbral = Math.round(UMBRAL_RACHA_GENERAL * 100);

  return (
    <section aria-labelledby="titulo-racha" className="rounded-3xl bg-mandarina-suave p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="titulo-racha" className="text-sm font-medium text-texto-suave">
            Racha general
          </h2>
          <InsigniaRacha dias={actual} grande />
          <p className="mt-1 text-sm text-texto-suave">
            {proximo ? `${proximo - actual} ${proximo - actual === 1 ? "día" : "días"} para llegar a ${proximo}` : "¡Superaste todos los hitos!"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-titulo text-3xl font-bold tabular-nums text-violeta">{porcentaje}%</p>
          <p className="text-xs text-texto-suave">de hoy</p>
        </div>
      </div>
      <div
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-fondo"
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Hábitos cumplidos hoy"
      >
        <div className="h-full rounded-full bg-violeta transition-[width] duration-500" style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="mt-2 text-xs text-texto-suave">
        {porcentajeHoy === null
          ? "Hoy no tienes hábitos programados: tu racha está a salvo."
          : cumpleHoy
            ? "¡Hoy ya cuenta para tu racha!"
            : `Cumple al menos el ${umbral}% de tus hábitos para sumar el día.`}
      </p>
    </section>
  );
}

function HabitosDeHoy() {
  const hoy = useHoy();
  const habitos = useHabitos();
  const { data: rachas } = useRachas();
  const marcar = useMarcarHabito();

  const dia = diaSemana(hoy);
  const deHoy = habitos.data?.filter((h) => h.activo && h.dias_semana.includes(dia)) ?? [];

  return (
    <section aria-labelledby="titulo-habitos">
      <h2 id="titulo-habitos" className="mb-3 font-titulo text-lg font-semibold">
        Hábitos de hoy
      </h2>
      {marcar.error && (
        <div className="mb-3">
          <MensajeError error={marcar.error} />
        </div>
      )}
      {habitos.isPending || !rachas ? (
        <CargandoLista filas={3} />
      ) : habitos.error ? (
        <MensajeError error={habitos.error} onReintentar={() => habitos.refetch()} />
      ) : habitos.data.length === 0 ? (
        <EstadoVacio
          icono={<Sparkles className="size-6" />}
          titulo="Aún no tienes hábitos"
          descripcion="Crea tu primer hábito y empieza a construir tu racha."
          accion={
            <Link href="/habitos" className="inline-flex min-h-11 items-center rounded-xl bg-violeta px-4 text-sm font-semibold text-sobre-violeta">
              Crear hábito
            </Link>
          }
        />
      ) : deHoy.length === 0 ? (
        <EstadoVacio
          icono={<Coffee className="size-6" />}
          titulo="Hoy descansas"
          descripcion="Ningún hábito está programado para hoy. Los días de descanso no rompen tus rachas."
        />
      ) : (
        <ul className="space-y-2">
          {deHoy.map((habito) => (
            <FilaHabito
              key={habito.id}
              habito={habito}
              completado={rachas.completadosHoy.has(habito.id)}
              racha={rachas.porHabito.get(habito.id)?.actual ?? 0}
              onAlternar={(completado) => marcar.mutate({ habitoId: habito.id, fecha: hoy, completado })}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function FilaHabito({
  habito,
  completado,
  racha,
  onAlternar,
}: {
  habito: Habito;
  completado: boolean;
  racha: number;
  onAlternar: (completado: boolean) => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={completado}
        onClick={() => onAlternar(!completado)}
        className="flex w-full items-center gap-4 rounded-2xl border border-borde bg-superficie p-3 text-left transition hover:border-violeta/50 aria-pressed:border-transparent aria-pressed:bg-violeta-suave"
      >
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition ${
            completado ? "border-violeta bg-violeta text-sobre-violeta" : "border-borde"
          }`}
          aria-hidden
        >
          {completado ? <Check className="size-5" strokeWidth={3} /> : <span className="text-xl">{habito.icono}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-semibold ${completado ? "text-texto-suave line-through" : ""}`}>
            {habito.nombre}
          </span>
          {habito.meta && <span className="block truncate text-sm text-texto-suave">{habito.meta}</span>}
        </span>
        <InsigniaRacha dias={racha} />
        <span className="sr-only">{completado ? "Completado. Pulsa para desmarcar." : "Pendiente. Pulsa para marcar."}</span>
      </button>
    </li>
  );
}

const NIVELES = [
  { nivel: 1, emoji: "😞", nombre: "Muy mal" },
  { nivel: 2, emoji: "🙁", nombre: "Mal" },
  { nivel: 3, emoji: "😐", nombre: "Normal" },
  { nivel: 4, emoji: "🙂", nombre: "Bien" },
  { nivel: 5, emoji: "😄", nombre: "Muy bien" },
];

function SelectorAnimo() {
  const hoy = useHoy();
  const animo = useAnimo(hoy);
  const guardar = useGuardarAnimo();
  const actual = guardar.isPending ? guardar.variables?.nivel : animo.data?.nivel;

  return (
    <section aria-labelledby="titulo-animo">
      <h2 id="titulo-animo" className="mb-3 font-titulo text-lg font-semibold">
        ¿Cómo te sientes?
      </h2>
      {guardar.error && <MensajeError error={guardar.error} />}
      <div className="grid grid-cols-5 gap-2" role="group" aria-labelledby="titulo-animo">
        {NIVELES.map(({ nivel, emoji, nombre }) => (
          <button
            key={nivel}
            type="button"
            aria-pressed={actual === nivel}
            aria-label={nombre}
            disabled={animo.isPending}
            onClick={() => guardar.mutate({ fecha: hoy, nivel, nota: null })}
            className="flex min-h-14 flex-col items-center justify-center rounded-2xl border border-borde bg-superficie text-2xl transition hover:border-violeta/50 disabled:opacity-50 aria-pressed:border-violeta aria-pressed:bg-violeta-suave"
          >
            <span aria-hidden>{emoji}</span>
            <span className="text-[11px] text-texto-suave">{nombre}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function AgendaDeHoy() {
  const hoy = useHoy();
  const bloques = useBloques();
  const { data: categorias = [] } = useCategorias();
  const dia = diaSemana(hoy);
  const deHoy = bloques.data?.filter((b) => b.dias_semana.includes(dia)) ?? [];

  return (
    <section aria-labelledby="titulo-agenda">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="titulo-agenda" className="font-titulo text-lg font-semibold">
          Agenda de hoy
        </h2>
        <Link href="/horario" className="inline-flex min-h-11 items-center text-sm font-medium text-violeta">
          Ver horario
        </Link>
      </div>
      {bloques.isPending ? (
        <CargandoLista filas={2} alto="h-14" />
      ) : bloques.error ? (
        <MensajeError error={bloques.error} onReintentar={() => bloques.refetch()} />
      ) : deHoy.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-borde p-4 text-sm text-texto-suave">
          No tienes bloques en tu horario para hoy.
        </p>
      ) : (
        <ol className="space-y-2">
          {deHoy.map((b) => {
            const categoria = categorias.find((c) => c.id === b.categoria_id);
            return (
              <li key={b.id} className="flex items-center gap-4 rounded-2xl border border-borde p-3">
                <span className="w-24 shrink-0 text-sm font-medium tabular-nums text-texto-suave">
                  {horaCorta(b.inicio)}–{horaCorta(b.fin)}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{b.titulo}</span>
                {categoria && <ChipCategoria categoria={categoria} />}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
