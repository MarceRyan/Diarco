/** Logotipo: un arco (el progreso de tus días) que termina en un punto mandarina. */
export function Logo({ conTexto = true }: { conTexto?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <path d="M6 24a10 10 0 0 1 20 0" fill="none" stroke="var(--violeta)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="26" cy="24" r="3.5" fill="var(--mandarina)" />
      </svg>
      {conTexto && <span className="font-titulo text-xl font-bold tracking-tight">Diarco</span>}
    </span>
  );
}
