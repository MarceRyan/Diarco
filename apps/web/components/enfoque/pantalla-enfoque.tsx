"use client";

import { horaActual, type Fecha } from "@diarco/shared";
import { useCrearActividad, useHoy, useZonaHoraria } from "@diarco/shared/hooks";
import { CloudRain, Coffee, Expand, Flame, Minimize2, Pause, Play, Square, VolumeX } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Chispa, type EstadoChispa } from "@/components/chispa";
import { Confeti } from "@/components/confeti";
import {
  esLibre,
  estadoActual,
  guardarAmbiente,
  guardarEstado,
  LIMITE_LIBRE,
  minutosDescanso,
  MINUTOS_VELA_LIBRE,
  restante,
  SESIONES_POR_DESCANSO_LARGO,
  tiempoVisible,
  transcurrido,
  useAmbiente,
  useEstadoEnfoque,
  type Ambiente,
  type EnCurso,
  type EstadoEnfoque,
  type Plan,
} from "./estado";
import {
  activarAudio,
  entrarPantallaCompleta,
  iniciarAmbiente,
  mantenerPantallaEncendida,
  notificar,
  pedirPermisoNotificaciones,
  salirPantallaCompleta,
  tocarCampana,
} from "./navegador";

/** Segundos que espera la celebración antes de empezar sola el descanso. */
const ESPERA_DESCANSO = 15;

const FRASES = [
  "Una cosa a la vez.",
  "Yo cuido la llama, tú concéntrate.",
  "Respira. Sigue.",
  "El teléfono puede esperar.",
  "Vas muy bien. 🔥",
  "Pequeños pasos, grandes rachas.",
  "Ya falta menos.",
];

// -----------------------------------------------------------------------------
// Acciones (se llaman desde clics: ahí se activan audio, permisos y pantalla completa)
// -----------------------------------------------------------------------------
function nuevaFase(fase: "enfoque" | "descanso", plan: Plan, ciclo: number, fecha: Fecha, zona: string): EnCurso {
  const minutos = fase === "descanso" ? minutosDescanso(ciclo) : plan.libre ? LIMITE_LIBRE : plan.minutos;
  return {
    fase,
    plan,
    ciclo,
    minimizada: false,
    minutos,
    fecha,
    horaInicio: horaActual(zona),
    fin: Date.now() + minutos * 60_000,
    pausadoRestante: null,
    distracciones: 0,
  };
}

/** Empieza una sesión de enfoque en pantalla completa. */
export function empezarEnfoque(plan: Plan, fecha: Fecha, zona: string, ciclo = 0) {
  activarAudio();
  pedirPermisoNotificaciones();
  entrarPantallaCompleta();
  guardarEstado(nuevaFase("enfoque", plan, ciclo, fecha, zona));
}

/** Vuelve a abrir la pantalla completa si estaba minimizada. */
export function abrirEnfoque() {
  const e = estadoActual();
  if (!e) return;
  activarAudio();
  entrarPantallaCompleta();
  guardarEstado({ ...e, minimizada: false });
}

function salir() {
  guardarEstado(null);
  salirPantallaCompleta();
}

// -----------------------------------------------------------------------------
// Componente global: corre el reloj y muestra la pantalla completa o la burbuja
// -----------------------------------------------------------------------------
export function EnfoqueGlobal() {
  const estado = useEstadoEnfoque();
  const hoy = useHoy();
  const zona = useZonaHoraria();
  const crear = useCrearActividad();
  const ambiente = useAmbiente();
  const [ahora, setAhora] = useState(() => Date.now());
  const [distraccionVisible, setDistraccionVisible] = useState(false);
  const completado = useRef<number | null>(null);
  const tituloOriginal = useRef<string | null>(null);

  const enCurso = estado && (estado.fase === "enfoque" || estado.fase === "descanso") ? estado : null;
  const corriendo = enCurso !== null && enCurso.pausadoRestante === null;
  const clave = estado ? `${estado.fase}-${"fin" in estado ? estado.fin : estado.terminoEn}` : "";

  /** Cierra la fase en curso: guarda en la bitácora (si es enfoque), avisa y pasa a la celebración. */
  function completar(fase: EnCurso, minutosHechos: number) {
    if (completado.current === fase.fin) return; // ya se cerró (evita duplicados)
    completado.current = fase.fin;
    // Lo más reciente (p. ej. distracciones contadas después de armar el temporizador).
    const guardado = estadoActual();
    const e =
      guardado && (guardado.fase === "enfoque" || guardado.fase === "descanso") && guardado.fin === fase.fin ? guardado : fase;
    if (e.fase === "enfoque") {
      if (minutosHechos >= 1) {
        crear.mutate({
          fecha: e.fecha,
          hora: e.horaInicio,
          descripcion: e.plan.descripcion,
          minutos: minutosHechos,
          categoria_id: e.plan.categoria_id,
        });
      }
      guardarEstado({
        fase: "fin_enfoque",
        plan: e.plan,
        ciclo: e.ciclo + 1,
        minimizada: e.minimizada,
        minutosHechos,
        distracciones: e.distracciones,
        terminoEn: Math.min(Date.now(), e.fin),
      });
      tocarCampana(true);
      notificar("¡Sesión terminada! 🔥", `${minutosHechos} min de «${e.plan.descripcion}». Toca para tu descanso.`);
    } else {
      guardarEstado({ fase: "fin_descanso", plan: e.plan, ciclo: e.ciclo, minimizada: e.minimizada, terminoEn: Math.min(Date.now(), e.fin) });
      tocarCampana(false);
      notificar("Descanso terminado", e.plan.libre ? "¿Otra sesión?" : `¿Otra sesión de ${e.plan.minutos} min?`);
    }
  }

  // Reloj de pantalla (4 veces por segundo mientras haya algo que mostrar).
  useEffect(() => {
    if (!estado || (enCurso && !corriendo)) return;
    const intervalo = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(intervalo);
  }, [clave, corriendo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fin exacto con un temporizador propio (los intervalos se frenan en pestañas ocultas).
  useEffect(() => {
    if (!enCurso || !corriendo) return;
    const t = setTimeout(() => completar(enCurso, enCurso.minutos), Math.max(0, enCurso.fin - Date.now()));
    return () => clearTimeout(t);
    // completar usa la mutación y setters estables; se re-arma cuando cambia la fase.
  }, [clave, corriendo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Título de la pestaña con el tiempo.
  useEffect(() => {
    if (!enCurso) {
      if (tituloOriginal.current !== null) document.title = tituloOriginal.current;
      tituloOriginal.current = null;
      return;
    }
    tituloOriginal.current ??= document.title;
    document.title = `${enCurso.fase === "enfoque" ? "⏱" : "☕"} ${tiempoVisible(enCurso, ahora)} · Diarco`;
  }, [enCurso, ahora]);

  // Distracciones: salir de la pestaña durante el enfoque se cuenta y Chispa lo comenta al volver.
  useEffect(() => {
    let salio = false;
    function alCambiar() {
      const e = estadoActual();
      if (!e || e.fase !== "enfoque" || e.pausadoRestante !== null) return;
      if (document.hidden) {
        salio = true;
        guardarEstado({ ...e, distracciones: e.distracciones + 1 });
      } else if (salio) {
        salio = false;
        setDistraccionVisible(true);
        setTimeout(() => setDistraccionVisible(false), 4500);
      }
    }
    document.addEventListener("visibilitychange", alCambiar);
    return () => document.removeEventListener("visibilitychange", alCambiar);
  }, []);

  // Pantalla encendida mientras corre (se vuelve a pedir al regresar a la pestaña).
  useEffect(() => {
    if (!corriendo) return;
    let liberar = () => {};
    let activo = true;
    const pedir = () =>
      void mantenerPantallaEncendida().then((l) => {
        if (activo) liberar = l;
        else l();
      });
    pedir();
    const alVolver = () => document.visibilityState === "visible" && pedir();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      activo = false;
      liberar();
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [corriendo, clave]);

  // Sonido ambiente mientras corre.
  useEffect(() => {
    if (!corriendo || ambiente === "apagado") return;
    return iniciarAmbiente(ambiente);
  }, [corriendo, ambiente, clave]);

  // Sin scroll de fondo con la pantalla completa abierta.
  const abierta = estado !== null && !estado.minimizada;
  useEffect(() => {
    if (!abierta) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = antes;
    };
  }, [abierta]);

  // La celebración arranca sola el descanso tras unos segundos, solo si se vio terminar
  // (si vuelves mucho después, eliges tú).
  const esperaDescanso =
    estado?.fase === "fin_enfoque" && ahora - estado.terminoEn <= (ESPERA_DESCANSO + 5) * 1000
      ? ESPERA_DESCANSO - Math.floor((ahora - estado.terminoEn) / 1000)
      : null;
  useEffect(() => {
    if (estado?.fase !== "fin_enfoque" || esperaDescanso === null || esperaDescanso > 0) return;
    guardarEstado({ ...nuevaFase("descanso", estado.plan, estado.ciclo, hoy, zona), minimizada: estado.minimizada });
  }, [esperaDescanso]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!estado) return null;

  if (estado.minimizada) return createPortal(<Burbuja estado={estado} ahora={ahora} />, document.body);

  return createPortal(
    <PantallaCompleta
      estado={estado}
      ahora={ahora}
      distraccion={distraccionVisible && estado.fase === "enfoque"}
      esperaDescanso={esperaDescanso}
      ambiente={ambiente}
      onCompletar={completar}
      onDescanso={() => estado.fase === "fin_enfoque" && guardarEstado(nuevaFase("descanso", estado.plan, estado.ciclo, hoy, zona))}
      onOtra={() => empezarEnfoque(estado.plan, hoy, zona, estado.ciclo)}
    />,
    document.body,
  );
}

// -----------------------------------------------------------------------------
// Burbuja (minimizada)
// -----------------------------------------------------------------------------
function Burbuja({ estado, ahora }: { estado: EstadoEnfoque; ahora: number }) {
  const texto =
    estado.fase === "enfoque" || estado.fase === "descanso"
      ? `${estado.pausadoRestante !== null ? "⏸ " : ""}${tiempoVisible(estado, ahora)}`
      : estado.fase === "fin_enfoque"
        ? "¡Terminó!"
        : "Descanso listo";
  return (
    <button
      type="button"
      onClick={abrirEnfoque}
      aria-label={`Volver al modo enfoque: ${texto}`}
      className="fixed right-4 bottom-24 z-[90] flex min-h-12 animate-entrar items-center gap-2 rounded-full border-2 border-b-4 border-[#4b3a85] bg-[#1d1538] py-1 pr-5 pl-2 font-titulo text-lg font-extrabold text-white shadow-lg tabular-nums md:bottom-6"
    >
      <Chispa estado={estado.fase === "descanso" ? "feliz" : estado.fase === "fin_enfoque" ? "celebrando" : "feliz"} tamano={34} animada={false} />
      {estado.fase === "descanso" && <Coffee className="size-4" strokeWidth={2.5} aria-hidden />}
      {texto}
    </button>
  );
}

// -----------------------------------------------------------------------------
// Pantalla completa
// -----------------------------------------------------------------------------
const AMBIENTES: { valor: Ambiente; etiqueta: string; Icono: typeof Flame }[] = [
  { valor: "apagado", etiqueta: "Sin sonido", Icono: VolumeX },
  { valor: "fogata", etiqueta: "Chimenea", Icono: Flame },
  { valor: "lluvia", etiqueta: "Lluvia en la ventana", Icono: CloudRain },
];

const claseIcono =
  "flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-extrabold text-white/80 transition-colors hover:bg-white/10 hover:text-white";

function PantallaCompleta({
  estado,
  ahora,
  distraccion,
  esperaDescanso,
  ambiente,
  onCompletar,
  onDescanso,
  onOtra,
}: {
  estado: EstadoEnfoque;
  ahora: number;
  distraccion: boolean;
  esperaDescanso: number | null;
  ambiente: Ambiente;
  onCompletar: (e: EnCurso, minutos: number) => void;
  onDescanso: () => void;
  onOtra: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const descanso = estado.fase === "descanso" || estado.fase === "fin_descanso";
  const ambienteActual = AMBIENTES.find((a) => a.valor === ambiente)!;
  const siguienteAmbiente = AMBIENTES[(AMBIENTES.indexOf(ambienteActual) + 1) % AMBIENTES.length]!;

  // Escape minimiza (no termina la sesión).
  useEffect(() => {
    const alTeclear = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      const e = estadoActual();
      if (e) guardarEstado({ ...e, minimizada: true });
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modo-enfoque"
      className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto text-white ${
        descanso
          ? "bg-[radial-gradient(ellipse_at_50%_35%,#1f5a55_0%,#123634_55%,#0a1f1e_100%)]"
          : "bg-[radial-gradient(ellipse_at_50%_35%,#3b2a6b_0%,#1d1538_55%,#0e0a1f_100%)]"
      }`}
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-2 p-3 sm:p-5">
        <p id="titulo-modo-enfoque" className="rounded-full bg-white/10 px-4 py-2 text-sm font-extrabold">
          {descanso ? "☕ Descanso" : `🔥 Enfoque · sesión ${estado.fase === "fin_enfoque" ? estado.ciclo : estado.ciclo + 1}`}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={claseIcono}
            onClick={() => {
              activarAudio();
              guardarAmbiente(siguienteAmbiente.valor);
            }}
            aria-label={`Sonido ambiente: ${ambienteActual.etiqueta}. Cambiar a ${siguienteAmbiente.etiqueta}`}
          >
            <ambienteActual.Icono className="size-5" strokeWidth={2.5} aria-hidden />
            <span className="hidden sm:inline">{ambienteActual.etiqueta}</span>
          </button>
          <button type="button" className={claseIcono} onClick={entrarPantallaCompleta} aria-label="Pantalla completa">
            <Expand className="size-5" strokeWidth={2.5} aria-hidden />
          </button>
          <button
            type="button"
            className={claseIcono}
            onClick={() => {
              salirPantallaCompleta();
              guardarEstado({ ...estado, minimizada: true });
            }}
            aria-label="Minimizar (la sesión sigue)"
          >
            <Minimize2 className="size-5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-10 text-center">
        {estado.fase === "enfoque" || estado.fase === "descanso" ? (
          <EnCursoVista
            estado={estado}
            ahora={ahora}
            distraccion={distraccion}
            confirmando={confirmando}
            setConfirmando={setConfirmando}
            onCompletar={onCompletar}
          />
        ) : estado.fase === "fin_enfoque" ? (
          <div className="flex animate-entrar flex-col items-center gap-4" role="status">
            <div className="relative">
              <Chispa estado="celebrando" tamano={150} />
              <Confeti piezas={28} alcance={140} />
            </div>
            <p className="font-titulo text-4xl font-extrabold sm:text-5xl">¡{estado.minutosHechos} min de enfoque!</p>
            <p className="text-lg text-white/80">
              {estado.distracciones === 0
                ? "Sin distracciones. ¡Impecable! 🏆"
                : `${estado.distracciones} ${estado.distracciones === 1 ? "distracción" : "distracciones"}. La próxima, menos. 💪`}
            </p>
            {estado.minutosHechos >= 1 && (
              <p className="text-sm text-white/70">
                Lo anoté en tu{" "}
                <Link href="/bitacora" onClick={salir} className="font-extrabold text-white underline underline-offset-4">
                  bitácora
                </Link>
                .
              </p>
            )}
            <Ciclo hechas={estado.ciclo} />
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <BotonClaro principal onClick={onDescanso} autoFocus>
                <Coffee className="size-5" strokeWidth={2.5} aria-hidden />
                Descanso de {minutosDescanso(estado.ciclo)} min
                {esperaDescanso !== null && esperaDescanso > 0 && <span className="text-white/80 tabular-nums">({esperaDescanso} s)</span>}
              </BotonClaro>
              <BotonClaro onClick={onOtra}>Otra sesión sin descanso</BotonClaro>
              <BotonClaro onClick={salir}>Salir</BotonClaro>
            </div>
            {esperaDescanso !== null && esperaDescanso > 0 && (
              <p className="text-sm text-white/60">El descanso empieza solo en {esperaDescanso} s.</p>
            )}
          </div>
        ) : (
          <div className="flex animate-entrar flex-col items-center gap-4" role="status">
            <Chispa estado="emocionada" tamano={140} />
            <p className="font-titulo text-4xl font-extrabold">¡Descanso terminado!</p>
            <p className="max-w-md text-lg text-white/80">
              ¿Otra sesión {estado.plan.libre ? "libre" : `de ${estado.plan.minutos} min`} en «{estado.plan.descripcion}»?
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <BotonClaro principal onClick={onOtra} autoFocus>
                <Play className="size-5" strokeWidth={2.5} aria-hidden />
                ¡Vamos!
              </BotonClaro>
              <BotonClaro onClick={salir}>Terminar por hoy</BotonClaro>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Fase en curso: la vela (enfoque) o la respiración (descanso), el reloj y los controles. */
function EnCursoVista({
  estado,
  ahora,
  distraccion,
  confirmando,
  setConfirmando,
  onCompletar,
}: {
  estado: EnCurso;
  ahora: number;
  distraccion: boolean;
  confirmando: boolean;
  setConfirmando: (v: boolean) => void;
  onCompletar: (e: EnCurso, minutos: number) => void;
}) {
  const total = estado.minutos * 60_000;
  const queda = restante(estado, ahora);
  const hecho = transcurrido(estado, ahora);
  const libre = esLibre(estado);
  // En modo libre la vela se consume en MINUTOS_VELA_LIBRE y queda un cabito encendido.
  const avance = libre ? Math.min(0.92, hecho / (MINUTOS_VELA_LIBRE * 60_000)) : Math.min(1, Math.max(0, 1 - queda / total));
  const pausada = estado.pausadoRestante !== null;
  const minutosHechos = Math.floor(hecho / 60_000);
  const enfoque = estado.fase === "enfoque";

  // Frase: cambia cada 3 minutos; en el último minuto, ánimo final.
  const frase = !enfoque
    ? Math.floor(ahora / 4000) % 2 === 0
      ? "Inhala…"
      : "Exhala…"
    : distraccion
      ? "¿Te distrajiste? Volvamos a lo nuestro. 💪"
      : pausada
        ? "En pausa. Te espero."
        : !libre && queda <= 60_000
          ? "¡Último minuto! 🔥"
          : FRASES[Math.floor(hecho / 180_000) % FRASES.length];
  const gesto: EstadoChispa = distraccion ? "preocupada" : pausada ? "dormida" : enfoque ? "feliz" : "feliz";

  return (
    <>
      {/* Bocadillo de Chispa */}
      <p
        key={frase}
        className="min-h-12 max-w-sm animate-entrar rounded-3xl bg-white/10 px-5 py-3 font-titulo text-xl font-bold"
        aria-live="polite"
      >
        {frase}
      </p>

      {enfoque ? <Vela avance={avance} gesto={gesto} viva={!pausada} /> : <Respiracion ahora={ahora} pausada={pausada} />}

      <div className="w-full max-w-md space-y-3">
        <p className="truncate text-lg font-bold text-white/80">{enfoque ? estado.plan.descripcion : "Estírate, toma agua, mira lejos."}</p>
        <p className="font-titulo text-7xl leading-none font-extrabold tabular-nums sm:text-8xl" role="timer" aria-live="off">
          {tiempoVisible(estado, ahora)}
        </p>
        {libre ? (
          <p className="text-sm text-white/60">Cronómetro libre: cuando termines, pulsa «Terminar» y guardo lo que llevas.</p>
        ) : (
          <div
            className="h-3 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-valuenow={Math.round(avance * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Avance de la sesión"
          >
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${enfoque ? "bg-[#ffb340]" : "bg-[#5fd3b8]"}`}
              style={{ width: `${avance * 100}%` }}
            />
          </div>
        )}
        {enfoque && estado.distracciones > 0 && (
          <p className="text-sm text-white/60">
            {estado.distracciones} {estado.distracciones === 1 ? "distracción" : "distracciones"} en esta sesión
          </p>
        )}
      </div>

      {confirmando ? (
        <div className="w-full max-w-md space-y-3 rounded-3xl bg-white/10 p-4">
          <p className="font-bold">
            {!enfoque
              ? "¿Terminar el descanso ya?"
              : minutosHechos >= 1
                ? `Llevas ${minutosHechos} min. ¿Los guardo en tu bitácora?`
                : "Aún no llegas a un minuto."}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {!enfoque ? (
              <BotonClaro principal onClick={() => onCompletar(estado, 0)}>
                Sí, terminar
              </BotonClaro>
            ) : (
              minutosHechos >= 1 && (
                <BotonClaro principal onClick={() => onCompletar(estado, minutosHechos)}>
                  Guardar {minutosHechos} min
                </BotonClaro>
              )
            )}
            {enfoque && <BotonClaro onClick={salir}>Descartar</BotonClaro>}
            <BotonClaro onClick={() => setConfirmando(false)} autoFocus>
              Seguir
            </BotonClaro>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {pausada ? (
            <BotonClaro
              principal
              autoFocus
              onClick={() => {
                activarAudio();
                guardarEstado({ ...estado, fin: Date.now() + (estado.pausadoRestante ?? 0), pausadoRestante: null });
              }}
            >
              <Play className="size-5" strokeWidth={2.5} aria-hidden />
              Seguir
            </BotonClaro>
          ) : (
            <BotonClaro autoFocus onClick={() => guardarEstado({ ...estado, pausadoRestante: Math.max(0, estado.fin - Date.now()) })}>
              <Pause className="size-5" strokeWidth={2.5} aria-hidden />
              Pausar
            </BotonClaro>
          )}
          <BotonClaro onClick={() => setConfirmando(true)}>
            <Square className="size-4" strokeWidth={2.5} aria-hidden />
            Terminar
          </BotonClaro>
        </div>
      )}
      {enfoque && !confirmando && <p className="text-xs text-white/50">Si sales de esta pestaña, Chispa lo nota. 👀</p>}
    </>
  );
}

/**
 * Chorreones de cera: bajan desde el borde y se alargan con el tiempo.
 * x: posición desde la izquierda de la vela (72 px); los de los costados sobresalen.
 */
const CHORREONES = [
  { x: -4, ancho: 10, base: 12, crece: 70 },
  { x: 13, ancho: 7, base: 5, crece: 30 },
  { x: 33, ancho: 9, base: 8, crece: 48 },
  { x: 50, ancho: 6, base: 4, crece: 24 },
  { x: 65, ancho: 11, base: 14, crece: 80 },
];

/** Chispa es la llama de una vela que se derrite a medida que pasa el tiempo. */
function Vela({ avance, gesto, viva }: { avance: number; gesto: EstadoChispa; viva: boolean }) {
  const alto = Math.round(30 + (1 - avance) * 150); // de 180 px a 30 px
  const charco = Math.round(80 + avance * 90); // el charco de la base crece
  return (
    // Alto fijo: la vela baja sin mover el reloj de abajo.
    <div className="relative flex h-[330px] flex-col items-center justify-end" aria-hidden>
      {/* Resplandor */}
      <div
        className="absolute size-56 rounded-full bg-[#ffb340]/25 blur-3xl transition-[bottom] duration-1000 ease-linear motion-safe:animate-pulse"
        style={{ bottom: alto - 40 }}
      />

      <div className="relative z-10 -mb-4">
        <Chispa estado={gesto} tamano={118} animada={viva} />
      </div>

      {/* Cuerpo de la vela */}
      <div
        className="relative w-[72px] rounded-t-[14px] bg-gradient-to-r from-[#eccf95] via-[#fff6e0] to-[#e2bf7d] transition-[height] duration-1000 ease-linear"
        style={{ height: alto }}
      >
        {/* Borde derretido con un charquito de cera alrededor de la llama */}
        <span className="absolute -top-2 -right-1.5 -left-1.5 h-5 rounded-[50%] bg-[#fffdf6] shadow-[0_2px_0_rgb(176_124_52/0.3)]" />
        <span className="absolute -top-1 right-3 left-3 h-2.5 rounded-[50%] bg-[#f6d48e] shadow-[inset_0_1px_3px_#c9933b]" />

        {/* Chorreones que se alargan */}
        {CHORREONES.map((c) => (
          <span
            key={c.x}
            className="absolute top-0 rounded-b-full bg-gradient-to-b from-[#fffdf6] to-[#fbefd2] shadow-[2px_2px_0_rgb(176_124_52/0.35)] transition-[height] duration-1000 ease-linear"
            style={{ left: c.x, width: c.ancho, height: Math.min(alto - 8, Math.round(c.base + c.crece * avance)) }}
          >
            {/* Gota gorda en la punta del chorreón */}
            <span
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[#fbefd2] shadow-[2px_2px_0_rgb(176_124_52/0.35)]"
              style={{ width: c.ancho + 4, height: c.ancho + 5 }}
            />
          </span>
        ))}

        {/* Gotas que resbalan de vez en cuando */}
        {viva && (
          <>
            <span
              className="vela-gota absolute -left-[3px] top-3 h-3 w-2 rounded-full bg-[#fff3d6]"
              style={{ "--caida": `${alto - 10}px`, "--dur": "4.5s", "--retraso": "1s" } as React.CSSProperties}
            />
            <span
              className="vela-gota absolute -right-[3px] top-4 h-3.5 w-2 rounded-full bg-[#fff3d6]"
              style={{ "--caida": `${alto - 10}px`, "--dur": "6s", "--retraso": "3.5s" } as React.CSSProperties}
            />
          </>
        )}
      </div>

      {/* Charco de cera en la base */}
      <div className="relative -mt-2 flex justify-center">
        <span
          className="block h-4 rounded-[50%] bg-gradient-to-b from-[#fff3d6] to-[#e8cd94] transition-[width] duration-1000 ease-linear"
          style={{ width: charco }}
        />
      </div>
      {/* Platito */}
      <div className="-mt-1.5 h-4 w-44 rounded-full bg-white/20" />
    </div>
  );
}

/** Descanso: un círculo que crece y se encoge para respirar al ritmo (4 s y 4 s). */
function Respiracion({ ahora, pausada }: { ahora: number; pausada: boolean }) {
  const inhalando = Math.floor(ahora / 4000) % 2 === 0;
  return (
    <div className="relative flex size-60 items-center justify-center" aria-hidden>
      <div
        className="absolute inset-0 rounded-full bg-[#5fd3b8]/20 transition-transform duration-[4000ms] ease-in-out motion-reduce:transition-none"
        style={{ transform: `scale(${pausada ? 0.8 : inhalando ? 1 : 0.65})` }}
      />
      <div
        className="absolute inset-8 rounded-full bg-[#5fd3b8]/25 transition-transform duration-[4000ms] ease-in-out motion-reduce:transition-none"
        style={{ transform: `scale(${pausada ? 0.8 : inhalando ? 1 : 0.7})` }}
      />
      <Chispa estado={pausada ? "dormida" : "feliz"} tamano={110} animada={!pausada} />
    </div>
  );
}

/** Puntos del ciclo hacia el descanso largo. */
function Ciclo({ hechas }: { hechas: number }) {
  const enCiclo = hechas % SESIONES_POR_DESCANSO_LARGO || SESIONES_POR_DESCANSO_LARGO;
  return (
    <div className="flex items-center gap-2" aria-label={`${enCiclo} de ${SESIONES_POR_DESCANSO_LARGO} sesiones hacia el descanso largo`}>
      {Array.from({ length: SESIONES_POR_DESCANSO_LARGO }, (_, i) => (
        <span key={i} className={`size-3 rounded-full ${i < enCiclo ? "bg-[#ffb340]" : "bg-white/20"}`} />
      ))}
    </div>
  );
}

function BotonClaro({
  principal = false,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { principal?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-b-4 px-5 font-extrabold transition-transform duration-100 active:translate-y-[2px] active:border-b-2 ${
        principal ? "border-[#c97a12] bg-[#ffb340] text-[#2a1a05]" : "border-white/10 bg-white/15 text-white hover:bg-white/25"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
