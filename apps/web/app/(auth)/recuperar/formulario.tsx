"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campos";
import { MensajeError } from "@/components/ui/estados";
import { crearClienteNavegador } from "@/lib/supabase/cliente";

const correoSchema = z.email({ error: "Escribe un correo válido" });

export function FormularioRecuperar() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string>();
  const [enviado, setEnviado] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const correo = correoSchema.safeParse(new FormData(evento.currentTarget).get("email"));
    if (!correo.success) return setError(correo.error.issues[0]?.message);
    setError(undefined);
    setCargando(true);

    const { error } = await crearClienteNavegador().auth.resetPasswordForEmail(correo.data, {
      // El enlace del correo vuelve a /auth/confirm, que inicia sesión y lleva a elegir la nueva contraseña.
      redirectTo: `${window.location.origin}/auth/confirm?siguiente=/nueva-contrasena`,
    });
    setCargando(false);

    // Por seguridad no se dice si el correo existe o no: siempre se muestra "revisa tu correo",
    // salvo un error real del servicio (por ejemplo, demasiados intentos).
    if (error && error.status !== 400) {
      setError(
        error.status === 429
          ? "Pediste demasiados correos seguidos. Espera unos minutos e inténtalo de nuevo."
          : "No pudimos enviar el correo. Inténtalo de nuevo.",
      );
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-3 text-center" role="status">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-verde-suave text-verde-texto" aria-hidden>
          <MailCheck className="size-8" strokeWidth={2.5} />
        </span>
        <h1 className="font-titulo text-3xl font-extrabold">¡Revisa tu correo!</h1>
        <p className="text-texto-suave">
          Si hay una cuenta con ese correo, te enviamos un enlace para elegir una nueva contraseña. Vence en una hora.
        </p>
        <p className="text-sm text-texto-suave">¿No llega? Mira en la carpeta de spam.</p>
        <Link href="/login" className="inline-block py-3 font-extrabold text-violeta-texto">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <div className="text-center">
        <h1 className="font-titulo text-3xl font-extrabold">¿Olvidaste tu contraseña?</h1>
        <p className="mt-1 text-texto-suave">Escribe tu correo y te enviamos un enlace para elegir una nueva.</p>
      </div>
      {error && <MensajeError error={new Error(error)} />}
      <Campo etiqueta="Correo" name="email" type="email" autoComplete="email" placeholder="tu@correo.com" autoFocus />
      <Boton type="submit" grande cargando={cargando} className="w-full">
        Enviarme el enlace
      </Boton>
      <p className="text-center text-texto-suave">
        ¿Te acordaste?{" "}
        <Link href="/login" className="inline-block py-3 font-extrabold text-violeta-texto">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
