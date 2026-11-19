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
    errorEnlace ? "El enlace de confirmación no es válido o expiró." : null,
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
          ? "Correo o contraseña incorrectos."
          : error.code === "email_not_confirmed"
            ? "Confirma tu correo antes de entrar (revisa tu bandeja de entrada)."
            : "No se pudo iniciar sesión. Inténtalo de nuevo.",
      );
      setCargando(false);
      return;
    }

    router.replace("/hoy");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <h1 className="font-titulo text-2xl font-bold">Iniciar sesión</h1>
      {error && <MensajeError error={new Error(error)} />}
      <Campo etiqueta="Correo" name="email" type="email" autoComplete="email" required />
      <Campo etiqueta="Contraseña" name="password" type="password" autoComplete="current-password" required />
      <Boton type="submit" cargando={cargando} className="w-full">
        Entrar
      </Boton>
      <p className="text-center text-sm text-texto-suave">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="inline-block py-3 font-semibold text-violeta">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
