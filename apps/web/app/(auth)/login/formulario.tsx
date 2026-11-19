"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campos";
import { MensajeError } from "@/components/ui/estados";
import { crearClienteNavegador } from "@/lib/supabase/cliente";

export function FormularioLogin() {
  const router = useRouter();
  const errorEnlace = useSearchParams().get("error") === "enlace";
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(
    errorEnlace ? "El enlace de confirmación no es válido o ya venció." : null,
  );

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    setCargando(true);
    setError(null);

    const { error } = await crearClienteNavegador().auth.signInWithPassword({
      email: String(datos.get("email")),
      password: String(datos.get("password")),
    });

    if (error) {
      setError(
        error.code === "invalid_credentials"
          ? "El correo o la contraseña no coinciden."
          : error.code === "email_not_confirmed"
            ? "Primero confirma tu correo: revisa tu bandeja de entrada."
            : "No pudimos iniciar sesión. Inténtalo otra vez.",
      );
      setCargando(false);
      return;
    }

    router.replace("/hoy");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <h1 className="text-center font-titulo text-3xl font-extrabold">¡Qué bueno verte!</h1>
      {error && <MensajeError error={new Error(error)} />}
      <Campo etiqueta="Correo" name="email" type="email" autoComplete="email" placeholder="tu@correo.com" required />
      <div>
        <Campo etiqueta="Contraseña" name="password" type="password" autoComplete="current-password" required />
        <Link href="/recuperar" className="mt-1 inline-flex min-h-11 items-center text-sm font-extrabold text-violeta-texto">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <Boton type="submit" grande cargando={cargando} className="w-full">
        Entrar
      </Boton>
      <p className="text-center text-texto-suave">
        ¿Primera vez aquí?{" "}
        <Link href="/registro" className="inline-block py-3 font-extrabold text-violeta-texto">
          Crea tu cuenta
        </Link>
      </p>
    </form>
  );
}
