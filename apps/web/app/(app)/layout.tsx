import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { AvisoConfiguracion } from "@/components/aviso-configuracion";
import { Navegacion } from "@/components/navegacion";
import { CargandoLista, Esqueleto } from "@/components/ui/estados";
import { VigilanteLogros } from "@/components/vigilante-logros";
import { Proveedores } from "./proveedores";

/**
 * Las pantallas privadas dependen del usuario y de la fecha de hoy, así que
 * se renderizan en cada petición (connection) y no se prerenderizan.
 * La navegación sí es estática y aparece al instante.
 */
async function EnPeticion({ children }: { children: ReactNode }) {
  await connection();
  return children;
}

function CargandoPantalla() {
  return (
    <div className="space-y-6">
      <Esqueleto className="h-9 w-40" />
      <CargandoLista filas={4} />
    </div>
  );
}

export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <Proveedores>
      <div className="md:flex">
        <Navegacion />
        <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-10">
          <div className="mb-4">
            <AvisoConfiguracion />
          </div>
          <Suspense fallback={<CargandoPantalla />}>
            <EnPeticion>
              {children}
              <VigilanteLogros />
            </EnPeticion>
          </Suspense>
        </main>
      </div>
    </Proveedores>
  );
}
