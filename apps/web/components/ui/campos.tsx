import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

const claseControl =
  "min-h-11 w-full rounded-xl border border-borde bg-fondo px-3 text-base text-texto placeholder:text-texto-suave/70 focus:border-violeta focus:outline-none aria-[invalid=true]:border-peligro";

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
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": idDescripcion })}
      {(error || ayuda) && (
        <p id={idDescripcion} className={`text-sm ${error ? "text-peligro" : "text-texto-suave"}`}>
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

type PropsSelector = SelectHTMLAttributes<HTMLSelectElement> & { etiqueta: string; error?: string };

export function Selector({ etiqueta, error, className = "", children, ...props }: PropsSelector) {
  return (
    <Envoltura etiqueta={etiqueta} error={error}>
      {(a11y) => (
        <select className={`${claseControl} ${className}`} {...a11y} {...props}>
          {children}
        </select>
      )}
    </Envoltura>
  );
}
