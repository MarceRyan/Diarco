"use client";

import { perfilActualizarSchema, type Perfil } from "@diarco/shared";
import { useActualizarPerfil, useObtenerCliente, usePerfil } from "@diarco/shared/hooks";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Check, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { useCerrarSesion } from "@/components/navegacion";
import { abrirGuia } from "@/components/guia-bienvenida";
import { InstalarApp } from "@/components/pwa";
import { Boton } from "@/components/ui/boton";
import { Campo, Selector } from "@/components/ui/campos";
import { CargandoLista, claseTarjeta, Encabezado, MensajeError } from "@/components/ui/estados";
import { erroresPorCampo } from "@/lib/formularios";
import { aplicarTema, leerTema, type Tema } from "@/lib/tema";

export function PantallaConfiguracion() {
  const perfil = usePerfil();
  return (
    <>
      <Encabezado titulo="Ajustes" subtitulo="Haz que Diarco sea tuyo." />
      {/* Escritorio: perfil a la izquierda; apariencia y cuenta a la derecha */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          {perfil.isPending ? (
            <CargandoLista filas={3} />
          ) : perfil.error ? (
            <MensajeError error={perfil.error} onReintentar={() => perfil.refetch()} />
          ) : (
            <FormularioPerfil key={perfil.data.id} perfil={perfil.data} />
          )}
        </div>
        <div className="min-w-0 space-y-6">
          <Seccion titulo="¿Cómo se usa Diarco?" descripcion="Chispa te explica en un minuto cada parte de la app.">
            <Boton variante="secundario" onClick={abrirGuia}>
              <BookOpen className="size-5" strokeWidth={2.5} aria-hidden />
              Ver la guía otra vez
            </Boton>
          </Seccion>
          <Seccion titulo="App en tu celular" descripcion="Instala Diarco en tu pantalla de inicio: se abre a pantalla completa, sin tiendas de apps.">
            <InstalarApp />
          </Seccion>
          <Apariencia />
          <Cuenta />
        </div>
      </div>
    </>
  );
}

function Seccion({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: React.ReactNode }) {
  return (
    <section className={`${claseTarjeta} p-5`}>
      <h2 className="font-titulo text-2xl font-bold">{titulo}</h2>
      {descripcion && <p className="mt-1 text-sm text-texto-suave">{descripcion}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Zonas horarias que conoce el navegador (o una lista mínima si no lo soporta). */
function zonasHorarias(actual: string): string[] {
  let zonas: string[] = [];
  try {
    zonas = Intl.supportedValuesOf("timeZone");
  } catch {
    zonas = ["America/Lima", "America/Bogota", "America/Mexico_City", "America/Santiago", "America/Argentina/Buenos_Aires", "Europe/Madrid", "UTC"];
  }
  return zonas.includes(actual) ? zonas : [actual, ...zonas];
}

function FormularioPerfil({ perfil }: { perfil: Perfil }) {
  const actualizar = useActualizarPerfil();
  const [nombre, setNombre] = useState(perfil.nombre);
  const [zona, setZona] = useState(perfil.zona_horaria);
  const [protectores, setProtectores] = useState(perfil.protectores_semana);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardado, setGuardado] = useState(false);

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setGuardado(false);
    const datos = perfilActualizarSchema.safeParse({ nombre, zona_horaria: zona, protectores_semana: protectores });
    if (!datos.success) return setErrores(erroresPorCampo(datos.error));
    setErrores({});
    try {
      await actualizar.mutateAsync(datos.data);
      setGuardado(true);
    } catch {
      // Se muestra con actualizar.error.
    }
  }

  return (
    <Seccion titulo="Perfil">
      <form onSubmit={guardar} className="space-y-5" noValidate>
        {actualizar.error && <MensajeError error={actualizar.error} />}
        <Campo etiqueta="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} error={errores.nombre} />
        <Selector
          etiqueta="Zona horaria"
          value={zona}
          onChange={(e) => setZona(e.target.value)}
          error={errores.zona_horaria}
        >
          {zonasHorarias(perfil.zona_horaria).map((z) => (
            <option key={z} value={z}>
              {z.replaceAll("_", " ")}
            </option>
          ))}
        </Selector>
        <p className="-mt-3 text-sm text-texto-suave">Tus días empiezan y terminan a medianoche en esta zona.</p>

        <Selector
          etiqueta="Protectores de racha por semana"
          value={protectores}
          onChange={(e) => setProtectores(Number(e.target.value))}
          error={errores.protectores_semana}
        >
          {[0, 1, 2, 3].map((n) => (
            <option key={n} value={n}>
              {n === 0 ? "Ninguno (modo estricto)" : `${n} ${n === 1 ? "día" : "días"}`}
            </option>
          ))}
        </Selector>
        <p className="-mt-3 text-sm text-texto-suave">
          Días programados que puedes fallar cada semana (de lunes a domingo) sin perder la racha de un hábito.
        </p>

        <div className="flex items-center gap-3">
          <Boton type="submit" cargando={actualizar.isPending}>
            Guardar
          </Boton>
          {guardado && (
            <span role="status" className="inline-flex items-center gap-1 font-extrabold text-verde-texto">
              <Check className="size-4" aria-hidden /> Guardado
            </span>
          )}
        </div>
      </form>
    </Seccion>
  );
}

const TEMAS: { valor: Tema; etiqueta: string; Icono: typeof Sun }[] = [
  { valor: "sistema", etiqueta: "Sistema", Icono: Monitor },
  { valor: "claro", etiqueta: "Claro", Icono: Sun },
  { valor: "oscuro", etiqueta: "Oscuro", Icono: Moon },
];

// El tema vive en localStorage; useSyncExternalStore lo lee sin desajustes de hidratación.
const oyentesTema = new Set<() => void>();
const suscribirTema = (fn: () => void) => {
  oyentesTema.add(fn);
  return () => oyentesTema.delete(fn);
};

function Apariencia() {
  const tema = useSyncExternalStore(suscribirTema, leerTema, () => "sistema" as Tema);

  function elegir(nuevo: Tema) {
    aplicarTema(nuevo);
    oyentesTema.forEach((fn) => fn());
  }

  return (
    <Seccion titulo="Apariencia" descripcion="Se guarda en este navegador.">
      <div role="group" aria-label="Tema" className="grid grid-cols-3 gap-2">
        {TEMAS.map(({ valor, etiqueta, Icono }) => (
          <button
            key={valor}
            type="button"
            aria-pressed={tema === valor}
            onClick={() => elegir(valor)}
            className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-b-4 border-borde bg-tarjeta font-extrabold text-texto-suave transition-transform duration-100 active:translate-y-[2px] active:border-b-2 aria-pressed:border-violeta aria-pressed:bg-violeta-suave aria-pressed:text-violeta-texto"
          >
            <Icono className="size-6" strokeWidth={2.5} aria-hidden />
            {etiqueta}
          </button>
        ))}
      </div>
    </Seccion>
  );
}

function Cuenta() {
  const cliente = useObtenerCliente();
  const cerrarSesion = useCerrarSesion();
  const usuario = useQuery({
    queryKey: ["usuario"],
    queryFn: async () => (await cliente().auth.getUser()).data.user,
  });

  return (
    <Seccion titulo="Cuenta">
      <p className="text-sm text-texto-suave">Correo</p>
      <p className="mb-4 font-medium">{usuario.data?.email ?? "…"}</p>
      <Boton variante="secundario" onClick={cerrarSesion}>
        <LogOut className="size-4" aria-hidden />
        Cerrar sesión
      </Boton>
    </Seccion>
  );
}
