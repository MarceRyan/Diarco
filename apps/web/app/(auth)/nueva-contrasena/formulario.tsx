"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campos";
import { MensajeError } from "@/components/ui/estados";
import { erroresPorCampo } from "@/lib/formularios";
import { crearClienteNavegador } from "@/lib/supabase/cliente";

const nuevaSchema = z
  .object({
    password: z.string().min(8, { error: "Mínimo 8 caracteres" }),
    repetir: z.string(),
  })
  .refine((d) => d.password === d.repetir, { error: "Las contraseñas no coinciden", path: ["repetir"] });

export function FormularioNuevaContrasena() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = nuevaSchema.safeParse(Object.fromEntries(new FormData(evento.currentTarget)));
    if (!datos.success) return setErrores(erroresPorCampo(datos.error));
    setErrores({});
    setError(undefined);
    setCargando(true);

    const { error } = await crearClienteNavegador().auth.updateUser({ password: datos.data.password });
    setCargando(false);

    if (error) {
      setError(
        error.code === "same_password"
          ? "La nueva contraseña debe ser distinta de la anterior."
          : error.code === "weak_password"
            ? "Esa contraseña es demasiado débil. Prueba con una más larga."
            : "No pudimos cambiar la contraseña. Pide un enlace nuevo e inténtalo otra vez.",
      );
      return;
    }
    router.replace("/hoy");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <div className="text-center">
        <h1 className="font-titulo text-3xl font-extrabold">Elige tu nueva contraseña</h1>
        <p className="mt-1 text-texto-suave">Después te llevamos directo a tus hábitos de hoy.</p>
      </div>
      {error && <MensajeError error={new Error(error)} />}
      <Campo
        etiqueta="Nueva contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        ayuda="Mínimo 8 caracteres."
        error={errores.password}
        autoFocus
      />
      <Campo etiqueta="Repítela" name="repetir" type="password" autoComplete="new-password" error={errores.repetir} />
      <Boton type="submit" grande cargando={cargando} className="w-full">
        Guardar y entrar
      </Boton>
    </form>
  );
}
