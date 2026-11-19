import { Chispa } from "./chispa";

/** Logotipo: Chispa junto al nombre en la letra redonda de títulos. */
export function Logo({ conTexto = true }: { conTexto?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Chispa tamano={30} animada={false} />
      {conTexto && <span className="font-titulo text-2xl font-extrabold tracking-[-0.01em] text-mandarina-texto">diarco</span>}
    </span>
  );
}
