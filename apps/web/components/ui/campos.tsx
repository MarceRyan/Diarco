import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

const claseControl =
  "min-h-12 w-full rounded-2xl border-2 border-borde bg-superficie px-4 text-base font-semibold text-texto placeholder:font-medium placeholder:text-texto-suave/80 transition-colors focus:border-violeta focus:bg-tarjeta focus:outline-none aria-[invalid=true]:border-peligro";

interface PropsEnvoltura {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}

/** Etiqueta + control + mensaje de error accesible. */
function Envoltura({ etiqueta, error, ayuda, children }: PropsEnvoltura) {
  const id = useId();
  const idDescripcion = error || ayuda ? `${id}-descripcion` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-extrabold">
        {etiqueta}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": idDescripcion })}
      {(error || ayuda) && (
        <p id={idDescripcion} className={`text-sm ${error ? "font-bold text-peligro-texto" : "text-texto-suave"}`}>
          {error ?? ayuda}
        </p>
      )}
    </div>
  );
}

type PropsCampo = InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; error?: string; ayuda?: string };

export function Campo({ etiqueta, error, ayuda, className = "", ...props }: PropsCampo) {
  return (
    <Envoltura etiqueta={etiqueta} error={error} ayuda={ayuda}>
      {(a11y) => <input className={`${claseControl} ${className}`} {...a11y} {...props} />}
    </Envoltura>
  );
}

type PropsSelector = SelectHTMLAttributes<HTMLSelectElement> & { etiqueta: string; error?: string; ayuda?: string };

export function Selector({ etiqueta, error, ayuda, className = "", children, ...props }: PropsSelector) {
  return (
    <Envoltura etiqueta={etiqueta} error={error} ayuda={ayuda}>
      {(a11y) => (
        <select className={`${claseControl} ${className}`} {...a11y} {...props}>
          {children}
        </select>
      )}
    </Envoltura>
  );
}
