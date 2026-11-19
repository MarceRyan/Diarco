"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CalendarDays, LogOut, NotebookPen, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { Logo } from "./logo";

const ENLACES: { href: string; etiqueta: string; Icono: LucideIcon }[] = [
  { href: "/hoy", etiqueta: "Hoy", Icono: CalendarDays },
  { href: "/habitos", etiqueta: "Hábitos", Icono: Sparkles },
  { href: "/horario", etiqueta: "Horario", Icono: CalendarClock },
  { href: "/bitacora", etiqueta: "Bitácora", Icono: NotebookPen },
];

function useCerrarSesion() {
  const router = useRouter();
  const qc = useQueryClient();
  return async () => {
    await crearClienteNavegador().auth.signOut();
    qc.clear(); // no dejar datos del usuario en memoria
    router.replace("/login");
    router.refresh();
  };
}

/** Barra lateral en escritorio y barra inferior en móvil. */
export function Navegacion() {
  const ruta = usePathname();
  const cerrarSesion = useCerrarSesion();
  const activo = (href: string) => ruta === href || ruta.startsWith(`${href}/`);

  return (
    <>
      {/* Escritorio */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-borde px-4 py-6 md:flex">
        <Link href="/hoy" className="mb-8 px-2" aria-label="Diarco, ir a Hoy">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="flex flex-1 flex-col gap-1">
          {ENLACES.map(({ href, etiqueta, Icono }) => (
            <Link
              key={href}
              href={href}
              aria-current={activo(href) ? "page" : undefined}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-texto-suave transition hover:bg-superficie hover:text-texto aria-[current=page]:bg-violeta-suave aria-[current=page]:text-violeta"
            >
              <Icono className="size-5" aria-hidden />
              {etiqueta}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={cerrarSesion}
          className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-texto-suave hover:bg-superficie hover:text-texto"
        >
          <LogOut className="size-5" aria-hidden />
          Cerrar sesión
        </button>
      </aside>

      {/* Móvil: cabecera superior */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-borde bg-fondo/90 px-4 py-2 backdrop-blur md:hidden">
        <Logo />
        <button
          type="button"
          onClick={cerrarSesion}
          aria-label="Cerrar sesión"
          className="flex size-11 items-center justify-center rounded-xl text-texto-suave hover:bg-superficie"
        >
          <LogOut className="size-5" aria-hidden />
        </button>
      </header>

      {/* Móvil: pestañas inferiores */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-borde bg-fondo/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {ENLACES.map(({ href, etiqueta, Icono }) => (
          <Link
            key={href}
            href={href}
            aria-current={activo(href) ? "page" : undefined}
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium text-texto-suave aria-[current=page]:text-violeta"
          >
            <Icono className="size-5" aria-hidden />
            {etiqueta}
          </Link>
        ))}
      </nav>
    </>
  );
}
