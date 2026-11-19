"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Ellipsis, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CLASES_COLOR, PRINCIPALES, SECUNDARIOS, type Seccion } from "@/lib/secciones";
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

const MAS: Seccion = { href: "/mas", etiqueta: "Más", descripcion: "", Icono: Ellipsis, color: "neutro" };

/** Barra lateral en escritorio; cabecera y pestañas inferiores en móvil. */
export function Navegacion() {
  const ruta = usePathname();
  const cerrarSesion = useCerrarSesion();
  const activo = (href: string) => ruta === href || ruta.startsWith(`${href}/`);
  const enMas = activo("/mas") || SECUNDARIOS.some((e) => activo(e.href));

  return (
    <>
      {/* Escritorio */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r-2 border-borde bg-tarjeta px-4 py-6 md:flex">
        <Link href="/hoy" className="mb-8 px-3" aria-label="Diarco, ir a Hoy">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="flex flex-1 flex-col gap-1.5">
          {[...PRINCIPALES, ...SECUNDARIOS].map((s, i) => {
            const actual = activo(s.href);
            const c = CLASES_COLOR[s.color];
            return (
              <Link
                key={s.href}
                href={s.href}
                aria-current={actual ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-2xl border-2 px-2.5 text-[15px] font-extrabold transition-colors ${
                  actual ? c.activo : "border-transparent text-texto-suave hover:bg-superficie hover:text-texto"
                } ${i === PRINCIPALES.length ? "mt-5" : ""}`}
              >
                <span className={`flex size-8 items-center justify-center rounded-xl ${c.icono}`} aria-hidden>
                  <s.Icono className="size-[18px]" strokeWidth={2.5} />
                </span>
                {s.etiqueta}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={cerrarSesion}
          className="flex min-h-12 items-center gap-3 rounded-2xl px-2.5 text-[15px] font-extrabold text-texto-suave hover:bg-superficie hover:text-texto"
        >
          <span className="flex size-8 items-center justify-center" aria-hidden>
            <LogOut className="size-[18px]" strokeWidth={2.5} />
          </span>
          Cerrar sesión
        </button>
      </aside>

      {/* Móvil: cabecera */}
      <header className="sticky top-0 z-10 flex min-h-14 items-center border-b-2 border-borde bg-fondo/90 px-4 backdrop-blur-md md:hidden">
        <Link href="/hoy" aria-label="Diarco, ir a Hoy">
          <Logo />
        </Link>
      </header>

      {/* Móvil: pestañas inferiores */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 gap-1 border-t-2 border-borde bg-tarjeta px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden"
      >
        {[...PRINCIPALES, MAS].map((s) => {
          const actual = s.href === "/mas" ? enMas : activo(s.href);
          const c = CLASES_COLOR[s.color];
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={actual ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 text-[11px] font-extrabold transition-colors ${
                actual ? c.activo : "border-transparent text-texto-suave"
              }`}
            >
              <s.Icono className="size-6" strokeWidth={2.5} aria-hidden />
              {s.etiqueta}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
