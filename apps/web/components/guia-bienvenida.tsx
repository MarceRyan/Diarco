"use client";

/**
 * Guía de bienvenida: Chispa explica en pocos pasos cómo usar Diarco, con
 * palabras sencillas. Aparece la primera vez (por usuario y por navegador),
 * se puede omitir en cualquier momento y se vuelve a ver desde Ajustes.
 */
import { usePerfil } from "@diarco/shared/hooks";
import {
  Award,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Flame,
  ListTodo,
  NotebookPen,
  Sprout,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Chispa } from "@/components/chispa";
import { ChispaFase } from "@/components/chispa-fases";
import { Boton } from "@/components/ui/boton";
import { Dialogo } from "@/components/ui/dialogo";

// --- ¿Ya la vio? (en este navegador, por usuario) ------------------------------
const clave = (usuario: string) => `diarco-guia-vista-${usuario}`;
const oyentes = new Set<() => void>();
let abiertaAMano = false; // "Ver la guía de nuevo" desde Ajustes

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}
const avisar = () => oyentes.forEach((f) => f());

function vista(usuario: string): boolean {
  try {
    return localStorage.getItem(clave(usuario)) === "si";
  } catch {
    return true; // sin almacenamiento, mejor no insistir en cada visita
  }
}
function marcarVista(usuario: string) {
  try {
    localStorage.setItem(clave(usuario), "si");
  } catch {
    // Sin almacenamiento: no pasa nada.
  }
  abiertaAMano = false;
  avisar();
}

/** Abre la guía otra vez (botón de Ajustes). */
export function abrirGuia() {
  abiertaAMano = true;
  avisar();
}

// --- Los pasos -------------------------------------------------------------------
interface Paso {
  titulo: string;
  texto: ReactNode;
  dibujo: ReactNode;
}

type PropsBaldosa = { Icono: LucideIcon; fondo: string; color: string };

/** Baldosa con el ícono de una sección. */
function Baldosa({ Icono, fondo, color }: PropsBaldosa) {
  return (
    <div className={`flex size-24 items-center justify-center rounded-[24px] border-b-4 border-black/10 ${fondo}`}>
      <Icono className={`size-12 ${color}`} strokeWidth={2.2} aria-hidden />
    </div>
  );
}

/** Baldosa de la sección con Chispa asomándose al lado. */
function Ilustracion(props: PropsBaldosa) {
  return (
    <div className="relative mx-auto flex h-36 w-full max-w-xs items-center justify-center">
      <Baldosa {...props} />
      <div className="absolute right-8 bottom-0">
        <Chispa tamano={58} />
      </div>
    </div>
  );
}

const PASOS: Paso[] = [
  {
    titulo: "¡Hola! Soy Chispa 👋",
    texto: (
      <>
        Te voy a mostrar cómo funciona Diarco en menos de un minuto. Si ya lo conoces, puedes <strong>omitir</strong> la guía cuando
        quieras.
      </>
    ),
    dibujo: (
      <div className="flex justify-center">
        <Chispa estado="emocionada" tamano={130} />
      </div>
    ),
  },
  {
    titulo: "Tu día en una sola pantalla",
    texto: (
      <>
        En <strong>Hoy</strong> ves todo lo que te toca: tus hábitos, tu rutina, tus pendientes y tu agenda. Cuando hagas algo,{" "}
        <strong>solo tócalo</strong> para marcarlo.
      </>
    ),
    dibujo: <Ilustracion Icono={Flame} fondo="bg-mandarina-suave" color="text-mandarina-texto" />,
  },
  {
    titulo: "Hábitos y racha",
    texto: (
      <>
        Los <strong>hábitos</strong> son lo que quieres repetir, como tomar agua o leer. Tú eliges qué días tocan. Cada día que cumples
        suma a tu <strong>racha</strong> 🔥: los días seguidos que vas cumpliendo. Y si un día fallas, cada hábito tiene un{" "}
        <strong>protector</strong> por semana que cuida tu racha.
      </>
    ),
    dibujo: <Ilustracion Icono={Sprout} fondo="bg-verde-suave" color="text-verde-texto" />,
  },
  {
    titulo: "Rutina y pendientes",
    texto: (
      <>
        La <strong>rutina</strong> son tareas de cada día sin presión, como tender la cama. Los <strong>pendientes</strong> son cosas de
        una sola vez, como pagar la luz o una cita. Si se te pasa la fecha, te lo recordamos en Hoy.
      </>
    ),
    dibujo: <Ilustracion Icono={ListTodo} fondo="bg-cielo-suave" color="text-cielo-texto" />,
  },
  {
    titulo: "Tu semana y tu diario",
    texto: (
      <>
        En <strong>Horario</strong> armas tu semana: trabajo, clases, ejercicio. En la <strong>Bitácora</strong> anotas lo que hiciste
        cada día, como un diario. Desde Hoy también puedes anotar rápido.
      </>
    ),
    dibujo: (
      <div className="flex h-36 items-center justify-center gap-4">
        <Baldosa Icono={CalendarClock} fondo="bg-cielo-suave" color="text-cielo-texto" />
        <Chispa tamano={56} />
        <Baldosa Icono={NotebookPen} fondo="bg-violeta-suave" color="text-violeta-texto" />
      </div>
    ),
  },
  {
    titulo: "Concéntrate conmigo",
    texto: (
      <>
        ¿Tienes que estudiar o trabajar? Usa el <strong>modo enfoque</strong> en Hoy: me convierto en una vela que se va derritiendo
        mientras te concentras, y al final te doy un descanso.
      </>
    ),
    dibujo: (
      <div className="flex items-center justify-center gap-2">
        <ChispaFase fase={3} tamano={130} />
        <Timer className="size-10 text-violeta-texto" strokeWidth={2.2} aria-hidden />
      </div>
    ),
  },
  {
    titulo: "Crezco contigo",
    texto: (
      <>
        Cada día que cumples, gano calor y voy creciendo: de una chispita hasta un sol ☀️. Y no te preocupes: <strong>nunca me encojo</strong>,
        aunque falles un día. Mírame en <strong>Mi Chispa</strong>.
      </>
    ),
    dibujo: (
      <div className="flex items-end justify-center">
        <ChispaFase fase={1} tamano={78} />
        <ChispaFase fase={6} tamano={104} />
        <ChispaFase fase={14} tamano={118} />
      </div>
    ),
  },
  {
    titulo: "Mira cómo vas",
    texto: (
      <>
        En <strong>Progreso</strong> ves tus avances en gráficos y en <strong>Logros</strong> ganas medallas por tu constancia. ¡Hay más
        de cien por descubrir!
      </>
    ),
    dibujo: <Ilustracion Icono={Award} fondo="bg-amarillo-suave" color="text-amarillo-texto" />,
  },
  {
    titulo: "Llévame en tu celular",
    texto: (
      <>
        Puedes instalar Diarco como una app, sin tiendas y gratis. Busca <strong>«App en tu celular»</strong> en Ajustes y sigue los
        pasos.
      </>
    ),
    dibujo: <Ilustracion Icono={Download} fondo="bg-violeta-suave" color="text-violeta-texto" />,
  },
  {
    titulo: "¡Listo para empezar! 🎉",
    texto: (
      <>
        Empieza creando tu primer hábito, algo pequeño. Lo importante no es hacerlo perfecto, sino <strong>un día a la vez</strong>. ¡Yo
        te acompaño!
      </>
    ),
    dibujo: (
      <div className="flex justify-center">
        <Chispa estado="celebrando" tamano={130} />
      </div>
    ),
  },
];

// --- Componente -------------------------------------------------------------------
export function GuiaBienvenida() {
  const { data: perfil } = usePerfil();
  const usuario = perfil?.id ?? null;
  // Se lee del navegador; en el servidor (y mientras carga el perfil) no se muestra.
  const abierta = useSyncExternalStore(
    suscribir,
    () => usuario !== null && (abiertaAMano || !vista(usuario)),
    () => false,
  );
  const [paso, setPaso] = useState(0);

  if (!usuario) return null;
  const actual = PASOS[paso]!;
  const ultimo = paso === PASOS.length - 1;

  function cerrar() {
    marcarVista(usuario!);
    setPaso(0);
  }

  return (
    <Dialogo abierto={abierta} onCerrar={cerrar} titulo={actual.titulo}>
      <div
        className="space-y-5"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" && !ultimo) setPaso((p) => p + 1);
          if (e.key === "ArrowLeft" && paso > 0) setPaso((p) => p - 1);
        }}
      >
        <div key={paso} className="animate-entrar space-y-4">
          <div className="min-h-36">{actual.dibujo}</div>
          <p className="text-lg leading-relaxed" aria-live="polite">
            {actual.texto}
          </p>
        </div>

        {/* Progreso */}
        <div className="flex items-center justify-center gap-1.5" aria-label={`Paso ${paso + 1} de ${PASOS.length}`}>
          {PASOS.map((_, i) => (
            <span key={i} className={`block rounded-full transition-all ${i === paso ? "h-2.5 w-6 bg-mandarina" : i < paso ? "size-2.5 bg-mandarina/40" : "size-2.5 bg-superficie-2"}`} />
          ))}
        </div>

        {/* Botones */}
        {paso === 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Boton grande className="flex-1" onClick={() => setPaso(1)} autoFocus>
              Ver la guía
              <ChevronRight className="size-5" strokeWidth={2.5} aria-hidden />
            </Boton>
            <Boton grande variante="secundario" className="flex-1" onClick={cerrar}>
              Omitir
            </Boton>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Boton variante="fantasma" onClick={cerrar}>
              Omitir
            </Boton>
            <div className="ml-auto flex gap-2">
              <Boton variante="secundario" icono aria-label="Paso anterior" onClick={() => setPaso((p) => p - 1)}>
                <ChevronLeft className="size-5" strokeWidth={2.5} aria-hidden />
              </Boton>
              {ultimo ? (
                <Boton variante="exito" onClick={cerrar} autoFocus>
                  <Check className="size-5" strokeWidth={3} aria-hidden />
                  ¡Vamos!
                </Boton>
              ) : (
                <Boton onClick={() => setPaso((p) => p + 1)} autoFocus>
                  Siguiente
                  <ChevronRight className="size-5" strokeWidth={2.5} aria-hidden />
                </Boton>
              )}
            </div>
          </div>
        )}
      </div>
    </Dialogo>
  );
}
