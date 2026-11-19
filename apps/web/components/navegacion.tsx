"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Ellipsis, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PRINCIPALES, SECUNDARIOS } from "@/lib/secciones";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { Logo } from "./logo";

export function useCerrarSesion() {
  const router = useRouter();
  const qc = useQueryClient();
  return async () => {
    await crearClienteNavegador().auth.signOut();
    qc.clear(); // no dejar datos del usuario en memoria
    router.replace("/login");
    router.refresh();
  };
}

const claseEnlaceLateral =
  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-texto-suave transition hover:bg-superficie hover:text-texto aria-[current=page]:bg-violeta-suave aria-[current=page]:text-violeta";

/** Barra lateral en escritorio; cabecera y pestañas inferiores en móvil. */
export function Navegacion() {
  const ruta = usePathname();
  const cerrarSesion = useCerrarSesion();
  const activo = (href: string) => ruta === href || ruta.startsWith(`${href}/`);
  const enMas = activo("/mas") || SECUNDARIOS.some((e) => activo(e.href));

  return (
    <>
      {/* Escritorio */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-borde px-4 py-6 md:flex">
        <Link href="/hoy" className="mb-8 px-2" aria-label="Diarco, ir a Hoy">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="flex flex-1 flex-col gap-1">
          {[...PRINCIPALES, ...SECUNDARIOS].map(({ href, etiqueta, Icono }, i) => (
            <Link
              key={href}
              href={href}
              aria-current={activo(href) ? "page" : undefined}
              className={`${claseEnlaceLateral} ${i === PRINCIPALES.length ? "mt-4" : ""}`}
            >
              <Icono className="size-5" aria-hidden />
              {etiqueta}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={cerrarSesion} className={claseEnlaceLateral}>
          <LogOut className="size-5" aria-hidden />
          Cerrar sesión
        </button>
      </aside>

      {/* Móvil: cabecera */}
      <header className="sticky top-0 z-10 flex min-h-14 items-center border-b border-borde bg-fondo/90 px-4 backdrop-blur md:hidden">
        <Link href="/hoy" aria-label="Diarco, ir a Hoy">
          <Logo />
        </Link>
      </header>

      {/* Móvil: pestañas inferiores */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-borde bg-fondo/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {[...PRINCIPALES, { href: "/mas", etiqueta: "Más", Icono: Ellipsis }].map(({ href, etiqueta, Icono }) => {
          const actual = href === "/mas" ? enMas : activo(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={actual ? "page" : undefined}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium text-texto-suave aria-[current=page]:text-violeta"
            >
              <Icono className="size-5" aria-hidden />
              {etiqueta}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
