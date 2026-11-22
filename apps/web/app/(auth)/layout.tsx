import { AvisoConfiguracion } from "@/components/aviso-configuracion";
import { Chispa } from "@/components/chispa";
import { claseTarjeta } from "@/components/ui/estados";

export default function LayoutAcceso({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Chispa tamano={104} />
          <p className="mt-3 font-titulo text-4xl font-extrabold tracking-[-0.01em] text-mandarina-texto">Diarco</p>
          <p className="mt-1 max-w-xs text-texto-suave">Tus hábitos, tu horario y tu día. Cada avance cuenta y se celebra.</p>
        </div>
        <div className="mb-4">
          <AvisoConfiguracion />
        </div>
        <div className={`${claseTarjeta} p-6 sm:p-8`}>{children}</div>
      </div>
    </main>
  );
}
