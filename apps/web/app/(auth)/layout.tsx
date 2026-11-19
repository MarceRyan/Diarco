import { AvisoConfiguracion } from "@/components/aviso-configuracion";
import { Logo } from "@/components/logo";

export default function LayoutAcceso({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo />
          <p className="text-sm text-texto-suave">Tu día, tus hábitos y tus rachas en un solo lugar.</p>
        </div>
        <AvisoConfiguracion />
        {children}
      </div>
    </main>
  );
}
