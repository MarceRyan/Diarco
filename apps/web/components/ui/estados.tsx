import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Chispa, type EstadoChispa } from "../chispa";

/** Contenedor base: tarjeta blanca con borde grueso y labio inferior. */
export const claseTarjeta = "rounded-[20px] border-2 border-b-4 border-borde bg-tarjeta";

/** Estado vacío con Chispa, un mensaje cercano y una acción para empezar. */
export function EstadoVacio({
  titulo,
  descripcion,
  accion,
  chispa = "feliz",
  icono,
}: {
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
  /** Gesto de Chispa; si se pasa `icono`, se muestra el ícono en su lugar. */
  chispa?: EstadoChispa;
  icono?: ReactNode;
}) {
  return (
    <div className={`${claseTarjeta} flex flex-col items-center gap-3 px-6 py-8 text-center`}>
      {icono ? (
        <div className="flex size-14 items-center justify-center rounded-2xl bg-violeta-suave text-violeta-texto" aria-hidden>
          {icono}
        </div>
      ) : (
        <Chispa estado={chispa} tamano={72} />
      )}
      <div className="space-y-1">
        <p className="font-titulo text-xl font-bold">{titulo}</p>
        <p className="mx-auto max-w-sm text-texto-suave">{descripcion}</p>
      </div>
      {accion && <div className="pt-1">{accion}</div>}
    </div>
  );
}

/** Bloque animado que ocupa el lugar del contenido mientras carga. */
export function Esqueleto({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[20px] bg-superficie-2 ${className}`} aria-hidden />;
}

/** Lista de esqueletos con texto accesible de carga. */
export function CargandoLista({ filas = 3, alto = "h-16" }: { filas?: number; alto?: string }) {
  return (
    <div role="status" className="flex flex-col gap-3">
      <span className="sr-only">Cargando…</span>
      {Array.from({ length: filas }, (_, i) => (
        <Esqueleto key={i} className={alto} />
      ))}
    </div>
  );
}

/** Error al cargar o guardar, con opción de reintentar. */
export function MensajeError({ error, onReintentar }: { error: unknown; onReintentar?: () => void }) {
  const mensaje = error instanceof Error ? error.message : "Algo salió mal.";
  return (
    <div role="alert" className="flex items-start gap-3 rounded-[20px] border-2 border-peligro/40 bg-peligro-suave p-4">
      <CircleAlert className="mt-0.5 size-5 shrink-0 text-peligro-texto" strokeWidth={2.5} aria-hidden />
      <div className="flex-1 space-y-1">
        <p className="font-bold">¡Uy! {mensaje}</p>
        {onReintentar && (
          <button type="button" onClick={onReintentar} className="min-h-11 font-extrabold text-peligro-texto underline underline-offset-4">
            Intentar de nuevo
          </button>
        )}
      </div>
    </div>
  );
}

/** Título de pantalla con frase de apoyo y acción opcional. */
export function Encabezado({ titulo, subtitulo, accion }: { titulo: string; subtitulo?: string; accion?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-titulo text-3xl leading-tight font-extrabold tracking-[-0.01em] text-balance sm:text-4xl">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-texto-suave first-letter:uppercase">{subtitulo}</p>}
      </div>
      {accion}
    </header>
  );
}
