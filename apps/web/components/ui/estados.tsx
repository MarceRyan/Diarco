import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

/** Mensaje cuando no hay datos, con una acción para empezar. */
export function EstadoVacio({
  icono,
  titulo,
  descripcion,
  accion,
}: {
  icono: ReactNode;
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-borde px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-violeta-suave text-violeta" aria-hidden>
        {icono}
      </div>
      <div className="space-y-1">
        <p className="font-titulo font-semibold">{titulo}</p>
        <p className="max-w-sm text-sm text-texto-suave">{descripcion}</p>
      </div>
      {accion}
    </div>
  );
}

/** Bloque gris animado que ocupa el lugar del contenido mientras carga. */
export function Esqueleto({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-superficie-2 ${className}`} aria-hidden />;
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

/** Error al cargar datos, con opción de reintentar. */
export function MensajeError({ error, onReintentar }: { error: unknown; onReintentar?: () => void }) {
  const mensaje = error instanceof Error ? error.message : "Algo salió mal.";
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-peligro/30 bg-peligro/5 p-4 text-sm">
      <CircleAlert className="mt-0.5 size-5 shrink-0 text-peligro" aria-hidden />
      <div className="flex-1 space-y-2">
        <p>{mensaje}</p>
        {onReintentar && (
          <button type="button" onClick={onReintentar} className="min-h-11 font-semibold text-violeta underline">
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

/** Título de pantalla con subtítulo y acción opcional. */
export function Encabezado({ titulo, subtitulo, accion }: { titulo: string; subtitulo?: string; accion?: ReactNode }) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="font-titulo text-2xl font-bold tracking-tight sm:text-3xl">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-texto-suave first-letter:uppercase">{subtitulo}</p>}
      </div>
      {accion}
    </header>
  );
}
