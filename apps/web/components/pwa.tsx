"use client";

/**
 * Diarco como app instalable (PWA): registra el service worker y ofrece
 * instalarla. En Android/Chrome/Edge el navegador avisa con "beforeinstallprompt"
 * y se instala con un toque; en iPhone se explica cómo agregarla desde Safari.
 */
import { CheckCircle2, Download, Share, SquarePlus } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { Boton } from "@/components/ui/boton";

interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// --- Aviso de instalación (llega una vez, a veces antes de abrir Ajustes) ------
let eventoInstalar: EventoInstalar | null = null;
let recienInstalada = false;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // lo mostramos nosotros con el botón
    eventoInstalar = e as EventoInstalar;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    eventoInstalar = null;
    recienInstalada = true;
    avisar();
  });
}

function suscribir(f: () => void) {
  oyentes.add(f);
  const consulta = window.matchMedia("(display-mode: standalone)");
  consulta.addEventListener("change", f);
  return () => {
    oyentes.delete(f);
    consulta.removeEventListener("change", f);
  };
}

type Instalacion = "instalada" | "disponible" | "ios" | "manual";

function leerInstalacion(): Instalacion {
  const nav = navigator as Navigator & { standalone?: boolean };
  if (recienInstalada || window.matchMedia("(display-mode: standalone)").matches || nav.standalone) return "instalada";
  if (eventoInstalar) return "disponible";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "manual";
}

export function useInstalacion() {
  const estado = useSyncExternalStore(suscribir, leerInstalacion, () => "manual" as Instalacion);
  async function instalar() {
    if (!eventoInstalar) return;
    await eventoInstalar.prompt();
    await eventoInstalar.userChoice;
    eventoInstalar = null; // el aviso solo se puede usar una vez
    avisar();
  }
  return { estado, instalar };
}

/** Registra el service worker (solo en producción: en desarrollo cachear molesta). */
export function RegistrarPWA() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sin service worker la web funciona igual.
    });
  }, []);
  return null;
}

/** Contenido de la tarjeta "App en tu celular" de Ajustes. */
export function InstalarApp() {
  const { estado, instalar } = useInstalacion();

  if (estado === "instalada") {
    return (
      <p className="flex items-center gap-2 font-bold text-verde-texto">
        <CheckCircle2 className="size-5 shrink-0" strokeWidth={2.5} aria-hidden />
        Ya tienes Diarco instalada. Ábrela desde tu pantalla de inicio.
      </p>
    );
  }

  if (estado === "disponible") {
    return (
      <div className="space-y-2">
        <Boton onClick={instalar} className="w-full sm:w-auto">
          <Download className="size-5" strokeWidth={2.5} aria-hidden />
          Instalar Diarco
        </Boton>
        <p className="text-sm text-texto-suave">Se agrega a tu pantalla de inicio y se abre como una app.</p>
      </div>
    );
  }

  if (estado === "ios") {
    return (
      <ol className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violeta-suave font-extrabold text-violeta-texto">1</span>
          <span>
            Abre <strong>diarco.vercel.app</strong> en <strong>Safari</strong>.
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violeta-suave font-extrabold text-violeta-texto">2</span>
          <span>
            Toca <Share className="inline size-4 align-[-2px]" strokeWidth={2.5} aria-hidden /> <strong>Compartir</strong>.
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violeta-suave font-extrabold text-violeta-texto">3</span>
          <span>
            Elige <SquarePlus className="inline size-4 align-[-2px]" strokeWidth={2.5} aria-hidden /> <strong>Agregar a inicio</strong>.
          </span>
        </li>
      </ol>
    );
  }

  return (
    <p className="text-sm text-texto-suave">
      En <strong>Chrome</strong> o <strong>Edge</strong>, abre el menú del navegador y elige <strong>Instalar Diarco</strong> (o
      «Agregar a la pantalla de inicio»). En iPhone, usa <strong>Safari</strong> → Compartir → Agregar a inicio.
    </p>
  );
}
