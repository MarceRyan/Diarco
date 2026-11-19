"use client";

import {
  diaSemana,
  hitoAlcanzado,
  pendientesDeAyer,
  rachaTrasCumplirHoy,
  siguienteHito,
  sumarDias,
  UMBRAL_RACHA_GENERAL,
  type Habito,
} from "@diarco/shared";
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
import { Check, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Bienvenida } from "@/components/bienvenida";
import { ChipCategoria } from "@/components/categorias";
import { Chispa, estadoChispa } from "@/components/chispa";
import { Confeti } from "@/components/confeti";
import { InsigniaRacha } from "@/components/racha";
import { Boton } from "@/components/ui/boton";
import { Dialogo } from "@/components/ui/dialogo";
import { CargandoLista, claseTarjeta, Encabezado, Esqueleto, EstadoVacio, MensajeError } from "@/components/ui/estados";
import { fechaLarga, horaCorta } from "@/lib/formato";

/** Lo que se celebra: el día completo y/o hábitos que alcanzaron un hito (3, 7, 21, 30, 100). */
type Celebracion = {
  dia: { racha: number; hito: number | null } | null;
  hitos: { nombre: string; icono: string; dias: number }[];
};

export function PantallaHoy() {
  const hoy = useHoy();
  const perfil = usePerfil();
  const habitos = useHabitos();
  const nombre = perfil.data?.nombre || undefined;
  const [celebracion, setCelebracion] = useState<Celebracion | null>(null);

  // Sin hábitos: Chispa da la bienvenida y ayuda a crear los primeros.
  if (habitos.data && habitos.data.length === 0) {
    return (
      <>
        <Encabezado titulo={nombre ? `¡Hola, ${nombre}!` : "¡Hola!"} subtitulo={fechaLarga(hoy)} />
        <Bienvenida nombre={nombre} />
      </>
    );
  }

  return (
    <>
      <Encabezado titulo={nombre ? `¡Hola, ${nombre}!` : "¡Hola!"} subtitulo={fechaLarga(hoy)} />
      <div className="space-y-8">
        <TarjetaRacha />
        <AvisoAyer />
        <HabitosDeHoy onCelebrar={setCelebracion} />
        <SelectorAnimo />
        <AgendaDeHoy />
      </div>
      <PantallaCelebracion datos={celebracion} onCerrar={() => setCelebracion(null)} />
    </>
  );
}

// -----------------------------------------------------------------------------
// Tarjeta principal: Chispa + racha general + progreso del día + protector
// -----------------------------------------------------------------------------
function TarjetaRacha() {
  const { data: rachas, isPending } = useRachas();
  const { data: habitos } = useHabitos();
  const { data: perfil } = usePerfil();
  const hoy = useHoy();
  if (isPending || !rachas || !habitos) return <Esqueleto className="h-60" />;

  const dia = diaSemana(hoy);
  const deHoy = habitos.filter((h) => h.activo && h.dias_semana.includes(dia));
  const hechos = deHoy.filter((h) => rachas.completadosHoy.has(h.id)).length;
  const total = deHoy.length;
  const { actual, cumpleHoy } = rachas.general;
  const faltan = Math.max(0, Math.ceil(total * UMBRAL_RACHA_GENERAL) - hechos);
  const diaCompleto = total > 0 && hechos === total;
  const proximo = siguienteHito(actual);
  const porcentaje = total > 0 ? Math.round((hechos / total) * 100) : 0;

  const titulo = actual === 0 ? "¡Enciende tu racha hoy!" : `¡${actual} ${actual === 1 ? "día" : "días"} seguidos!`;
  const mensaje =
    total === 0
      ? "Hoy es día libre: tu racha está a salvo 😌"
      : diaCompleto
        ? "¡Día perfecto! Cumpliste todo 🎉"
        : cumpleHoy
          ? "¡Este día ya suma a tu racha! Ve por el resto 💪"
          : `Te ${faltan === 1 ? "falta 1 hábito" : `faltan ${faltan} hábitos`} para sumar el día.`;

  // Protector: qué hábitos se salvaron esta semana gracias a él.
  const protectores = perfil?.protectores_semana ?? 1;
  const salvados = habitos.filter((h) => rachas.porHabito.get(h.id)?.salvadaEstaSemana);
  const lineaProtector =
    protectores === 0
      ? "Modo estricto: sin protectores esta semana."
      : salvados.length > 0
        ? `¡Tu protector salvó la racha de ${listaNatural(salvados.map((h) => h.nombre))} esta semana!`
        : `Tienes ${protectores} ${protectores === 1 ? "protector" : "protectores"} por hábito esta semana: un tropiezo no rompe tu racha.`;

  return (
    <section aria-labelledby="titulo-racha" className={`${claseTarjeta} overflow-hidden`}>
      <div className="flex items-center gap-4 bg-mandarina-suave px-5 pt-5 pb-4 sm:gap-6 sm:px-6">
        <Chispa
          estado={estadoChispa(actual, { enRiesgo: actual > 0 && total > 0 && !cumpleHoy, diaCompleto })}
          tamano={88}
          className="shrink-0"
        />
        <div className="min-w-0">
          <h2 id="titulo-racha" className="font-titulo text-3xl leading-tight font-extrabold text-mandarina-texto sm:text-4xl">
            {titulo}
          </h2>
          <p className="mt-1 font-bold">{mensaje}</p>
        </div>
      </div>

      <div className="space-y-4 px-5 pt-4 pb-5 sm:px-6">
        {total > 0 && (
          <div>
            <div className="mb-2 flex items-baseline justify-between text-sm font-extrabold">
              <span>
                {hechos} de {total} {total === 1 ? "hábito" : "hábitos"}
              </span>
              {proximo && <span className="text-texto-suave">Próxima meta: {proximo} días</span>}
            </div>
            <div
              className="relative h-5 overflow-hidden rounded-full bg-superficie-2"
              role="progressbar"
              aria-valuenow={porcentaje}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Hábitos cumplidos hoy"
            >
              <div
                className="h-full rounded-full bg-violeta transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(porcentaje, hechos > 0 ? 8 : 0)}%` }}
              >
                {/* Brillo superior que le da volumen a la barra */}
                <div className="mx-2 mt-1 h-1.5 rounded-full bg-white/35" />
              </div>
              {/* Marca del 70 %: desde aquí el día cuenta para la racha */}
              <span className="absolute top-0 h-full w-0.5 bg-texto/25" style={{ left: `${Math.round(UMBRAL_RACHA_GENERAL * 100)}%` }} aria-hidden />
            </div>
          </div>
        )}
        <p className={`flex items-start gap-2 font-bold ${salvados.length > 0 ? "text-verde-texto" : "text-texto-suave"}`}>
          <ShieldCheck className="mt-0.5 size-5 shrink-0" strokeWidth={2.5} aria-hidden />
          {lineaProtector}
        </p>
      </div>
    </section>
  );
}

/** ["Leer", "Agua", "Meditar"] → "Leer, Agua y Meditar" */
function listaNatural(nombres: string[]): string {
  if (nombres.length <= 1) return nombres[0] ?? "";
  return `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`;
}

// -----------------------------------------------------------------------------
// Aviso: ayer quedaron hábitos sin marcar
// -----------------------------------------------------------------------------
function AvisoAyer() {
  const hoy = useHoy();
  const { data: rachas } = useRachas();
  const { data: habitos } = useHabitos();
  const marcar = useMarcarHabito();
  const [descartado, setDescartado] = useState(false);
  if (!rachas || !habitos || descartado) return null;

  const ayer = sumarDias(hoy, -1);
  const ids = pendientesDeAyer(rachas.activos, hoy);
  if (ids.length === 0) return null;
  const pendientes = habitos.filter((h) => ids.includes(h.id));

  return (
    <section aria-labelledby="titulo-ayer" className={`${claseTarjeta} flex flex-col gap-3 bg-cielo-suave p-4 sm:flex-row sm:items-center`}>
      <Chispa estado="preocupada" tamano={52} animada={false} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <h2 id="titulo-ayer" className="font-titulo text-xl font-bold">
          ¿Olvidaste marcar algo ayer?
        </h2>
        <p className="text-texto-suave">Si lo hiciste, tócalo y tu racha queda al día.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {pendientes.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => marcar.mutate({ habitoId: h.id, fecha: ayer, completado: true })}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-b-4 border-borde-fuerte bg-tarjeta px-4 font-bold transition-transform duration-100 active:translate-y-[2px] active:border-b-2"
            >
              <span aria-hidden>{h.icono}</span>
              Sí, hice {h.nombre}
            </button>
          ))}
        </div>
      </div>
      <Boton variante="fantasma" onClick={() => setDescartado(true)} className="self-end sm:self-center">
        No, lo salté
      </Boton>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Hábitos de hoy
// -----------------------------------------------------------------------------
function HabitosDeHoy({ onCelebrar }: { onCelebrar: (c: Celebracion) => void }) {
  const hoy = useHoy();
  const habitos = useHabitos();
  const { data: rachas } = useRachas();
  const marcar = useMarcarHabito();

  const dia = diaSemana(hoy);
  const deHoy = habitos.data?.filter((h) => h.activo && h.dias_semana.includes(dia)) ?? [];

  function alternar(habito: Habito, completado: boolean) {
    marcar.mutate({ habitoId: habito.id, fecha: hoy, completado });
    if (!completado || !rachas) return;

    // ¿Este hábito llega a un hito?
    const racha = rachas.porHabito.get(habito.id);
    const hitos: Celebracion["hitos"] = [];
    if (racha) {
      const hito = hitoAlcanzado(racha.actual, rachaTrasCumplirHoy(racha));
      if (hito) hitos.push({ nombre: habito.nombre, icono: habito.icono, dias: hito });
    }

    // ¿Con este check se completa el día?
    const hechos = deHoy.filter((h) => rachas.completadosHoy.has(h.id)).length + 1;
    let diaCelebrado: Celebracion["dia"] = null;
    if (hechos === deHoy.length) {
      const antes = rachas.general.actual;
      const despues = rachas.general.cumpleHoy ? antes : antes + 1;
      diaCelebrado = { racha: despues, hito: hitoAlcanzado(antes, despues) };
    }

    if (diaCelebrado || hitos.length > 0) onCelebrar({ dia: diaCelebrado, hitos });
  }

  return (
    <section aria-labelledby="titulo-habitos">
      <h2 id="titulo-habitos" className="mb-3 font-titulo text-2xl font-bold">
        Tus hábitos de hoy
      </h2>
      {marcar.error && (
        <div className="mb-3">
          <MensajeError error={marcar.error} />
        </div>
      )}
      {habitos.isPending || !rachas ? (
        <CargandoLista filas={3} alto="h-20" />
      ) : habitos.error ? (
        <MensajeError error={habitos.error} onReintentar={() => habitos.refetch()} />
      ) : deHoy.length === 0 ? (
        <EstadoVacio
          chispa="dormida"
          titulo="Hoy descansas"
          descripcion="Ningún hábito toca hoy. Los días libres no rompen tus rachas, así que disfruta."
        />
      ) : (
        <ul className="space-y-3">
          {deHoy.map((habito) => {
            const racha = rachas.porHabito.get(habito.id);
            return (
              <FilaHabito
                key={habito.id}
                habito={habito}
                completado={rachas.completadosHoy.has(habito.id)}
                racha={racha?.actual ?? 0}
                salvada={racha?.salvadaEstaSemana ?? false}
                onAlternar={(completado) => alternar(habito, completado)}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}

function FilaHabito({
  habito,
  completado,
  racha,
  salvada,
  onAlternar,
}: {
  habito: Habito;
  completado: boolean;
  racha: number;
  salvada: boolean;
  onAlternar: (completado: boolean) => void;
}) {
  // Cuenta de marcados en esta visita: cambia la key del confeti para relanzarlo.
  const [rafaga, setRafaga] = useState(0);

  return (
    <li>
      <button
        type="button"
        aria-pressed={completado}
        onClick={() => {
          if (!completado) setRafaga((n) => n + 1);
          onAlternar(!completado);
        }}
        className={`${claseTarjeta} flex w-full items-center gap-4 p-3 text-left transition-[transform,background-color,border-color] duration-100 active:translate-y-[2px] active:border-b-2 sm:p-4 ${
          completado ? "border-verde/40 bg-verde-suave" : "hover:border-borde-fuerte"
        }`}
      >
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
          style={{ backgroundColor: `${habito.color}26` }}
          aria-hidden
        >
          {habito.icono}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-titulo text-xl font-bold ${completado ? "text-verde-texto" : ""}`}>
            {habito.nombre}
          </span>
          <span className="mt-0.5 flex items-center gap-2">
            <InsigniaRacha dias={racha} />
            {salvada && (
              <span className="inline-flex items-center gap-1 rounded-full bg-verde-suave px-2 py-1 text-xs font-extrabold text-verde-texto">
                <ShieldCheck className="size-3.5" strokeWidth={2.5} aria-hidden />
                Salvada
              </span>
            )}
            {habito.meta && <span className="truncate text-sm text-texto-suave">{habito.meta}</span>}
          </span>
        </span>
        <span className="relative shrink-0" aria-hidden>
          <span
            key={completado ? `si-${rafaga}` : "no"}
            className={`flex size-12 items-center justify-center rounded-full border-2 border-b-4 ${
              completado ? "animate-pop border-verde-labio bg-verde text-white" : "border-borde-fuerte bg-tarjeta"
            }`}
          >
            {completado && <Check className="size-7" strokeWidth={3.5} />}
          </span>
          {completado && rafaga > 0 && <Confeti key={rafaga} />}
        </span>
        <span className="sr-only">
          {completado ? "Hecho. Toca para desmarcar." : "Pendiente. Toca para marcarlo como hecho."}
          {salvada ? " Un protector salvó esta racha esta semana." : ""}
        </span>
      </button>
    </li>
  );
}

// -----------------------------------------------------------------------------
// Celebración: día completo y/o hitos de hábitos
// -----------------------------------------------------------------------------
function PantallaCelebracion({ datos, onCerrar }: { datos: Celebracion | null; onCerrar: () => void }) {
  const hitoDia = datos?.dia?.hito ?? null;
  const unicoHito = datos && !datos.dia && datos.hitos.length === 1 ? datos.hitos[0] : null;

  const titulo = !datos ? "" : datos.dia ? "¡Día completo!" : "¡Nueva meta!";

  return (
    <Dialogo abierto={datos !== null} onCerrar={onCerrar} titulo={titulo}>
      {datos && (
        <div className="flex flex-col items-center gap-4 pb-2 text-center">
          <div className="relative">
            <Chispa estado="celebrando" tamano={128} />
            <Confeti piezas={24} alcance={110} />
          </div>

          {datos.dia ? (
            <>
              <p className="font-titulo text-4xl font-extrabold text-mandarina-texto">
                {hitoDia ? `¡${hitoDia} días seguidos! 🔥` : `${datos.dia.racha} ${datos.dia.racha === 1 ? "día" : "días"} de racha 🔥`}
              </p>
              <p className="max-w-xs text-lg text-texto-suave">
                {hitoDia ? "¡Llegaste a una nueva meta! Chispa está orgullosísima de ti." : "Cumpliste todos tus hábitos de hoy. ¡Así se hace!"}
              </p>
            </>
          ) : unicoHito ? (
            <>
              <p className="font-titulo text-4xl font-extrabold text-mandarina-texto">
                <span aria-hidden>{unicoHito.icono}</span> ¡{unicoHito.dias} días seguidos!
              </p>
              <p className="max-w-xs text-lg text-texto-suave">
                Llevas {unicoHito.dias} días con «{unicoHito.nombre}». ¡Eso ya es costumbre!
              </p>
            </>
          ) : null}

          {/* Hitos de hábitos que acompañan al día completo (o varios a la vez) */}
          {datos.hitos.length > 0 && !unicoHito && (
            <ul className="w-full space-y-2">
              {datos.hitos.map((h) => (
                <li key={h.nombre} className="flex items-center gap-3 rounded-2xl bg-mandarina-suave px-4 py-2 text-left font-bold">
                  <span className="text-2xl" aria-hidden>
                    {h.icono}
                  </span>
                  <span className="flex-1">{h.nombre}</span>
                  <span className="font-titulo text-xl text-mandarina-texto">{h.dias} días 🔥</span>
                </li>
              ))}
            </ul>
          )}

          <Boton grande onClick={onCerrar} className="w-full" autoFocus>
            ¡Sigamos así!
          </Boton>
        </div>
      )}
    </Dialogo>
  );
}

// -----------------------------------------------------------------------------
// Ánimo
// -----------------------------------------------------------------------------
const NIVELES = [
  { nivel: 1, emoji: "😞", nombre: "Mal" },
  { nivel: 2, emoji: "🙁", nombre: "Regular" },
  { nivel: 3, emoji: "😐", nombre: "Normal" },
  { nivel: 4, emoji: "🙂", nombre: "Bien" },
  { nivel: 5, emoji: "😄", nombre: "¡Genial!" },
];

function SelectorAnimo() {
  const hoy = useHoy();
  const animo = useAnimo(hoy);
  const guardar = useGuardarAnimo();
  const actual = guardar.isPending ? guardar.variables?.nivel : animo.data?.nivel;

  return (
    <section aria-labelledby="titulo-animo">
      <h2 id="titulo-animo" className="mb-3 font-titulo text-2xl font-bold">
        ¿Cómo te sientes hoy?
      </h2>
      {guardar.error && (
        <div className="mb-3">
          <MensajeError error={guardar.error} />
        </div>
      )}
      <div className="grid grid-cols-5 gap-2" role="group" aria-labelledby="titulo-animo">
        {NIVELES.map(({ nivel, emoji, nombre }) => (
          <button
            key={nivel}
            type="button"
            aria-pressed={actual === nivel}
            aria-label={nombre}
            disabled={animo.isPending}
            onClick={() => guardar.mutate({ fecha: hoy, nivel, nota: null })}
            className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-[20px] border-2 border-b-4 border-borde bg-tarjeta transition-transform duration-100 active:translate-y-[2px] active:border-b-2 disabled:opacity-50 aria-pressed:border-violeta aria-pressed:bg-violeta-suave"
          >
            <span aria-hidden className={`text-3xl transition-transform ${actual === nivel ? "scale-125" : ""}`}>
              {emoji}
            </span>
            <span className="text-xs font-extrabold text-texto-suave">{nombre}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Agenda del día
// -----------------------------------------------------------------------------
function AgendaDeHoy() {
  const hoy = useHoy();
  const bloques = useBloques();
  const { data: categorias = [] } = useCategorias();
  const dia = diaSemana(hoy);
  const deHoy = bloques.data?.filter((b) => b.dias_semana.includes(dia)) ?? [];

  return (
    <section aria-labelledby="titulo-agenda">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="titulo-agenda" className="font-titulo text-2xl font-bold">
          Tu agenda
        </h2>
        <Link href="/horario" className="inline-flex min-h-11 items-center font-extrabold text-cielo-texto">
          Ver semana
        </Link>
      </div>
      {bloques.isPending ? (
        <CargandoLista filas={2} alto="h-16" />
      ) : bloques.error ? (
        <MensajeError error={bloques.error} onReintentar={() => bloques.refetch()} />
      ) : deHoy.length === 0 ? (
        <div className={`${claseTarjeta} flex items-center gap-3 p-4 text-texto-suave`}>
          <Clock className="size-5 shrink-0 text-cielo-texto" strokeWidth={2.5} aria-hidden />
          <p>
            Nada agendado para hoy.{" "}
            <Link href="/horario" className="font-extrabold text-cielo-texto underline underline-offset-4">
              Arma tu semana
            </Link>
          </p>
        </div>
      ) : (
        <ol className={`${claseTarjeta} divide-y-2 divide-borde`}>
          {deHoy.map((b) => {
            const categoria = categorias.find((c) => c.id === b.categoria_id);
            return (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                <span className="shrink-0 rounded-xl bg-cielo-suave px-2.5 py-1 text-sm font-extrabold text-cielo-texto tabular-nums">
                  {horaCorta(b.inicio)}–{horaCorta(b.fin)}
                </span>
                <span className="min-w-0 flex-1 truncate font-bold">{b.titulo}</span>
                {categoria && <ChipCategoria categoria={categoria} />}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
