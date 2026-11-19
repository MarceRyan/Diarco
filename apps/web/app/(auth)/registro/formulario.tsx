"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campos";
import { MensajeError } from "@/components/ui/estados";
import { erroresPorCampo } from "@/lib/formularios";
import { crearClienteNavegador } from "@/lib/supabase/cliente";

const registroSchema = z.object({
  nombre: z.string().trim().min(1, { error: "Escribe tu nombre" }).max(80),
  email: z.email({ error: "Correo inválido" }),
  password: z.string().min(8, { error: "Mínimo 8 caracteres" }),
});

export function FormularioRegistro() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [revisarCorreo, setRevisarCorreo] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const resultado = registroSchema.safeParse(Object.fromEntries(new FormData(evento.currentTarget)));
    if (!resultado.success) {
      setErrores(erroresPorCampo(resultado.error));
      return;
    }
    setErrores({});
    setError(null);
    setCargando(true);

    const { nombre, email, password } = resultado.data;
    const { data, error } = await crearClienteNavegador().auth.signUp({
      email,
      password,
      // El trigger de la base de datos usa este nombre para crear el perfil.
      options: { data: { nombre }, emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setCargando(false);

    if (error) {
      setError(
        error.code === "user_already_exists"
          ? "Ya existe una cuenta con ese correo."
          : error.code === "weak_password"
            ? "La contraseña es demasiado débil."
            : "No se pudo crear la cuenta. Inténtalo de nuevo.",
      );
      return;
    }

    // Si el proyecto exige confirmar el correo, no hay sesión todavía.
    if (!data.session) {
      setRevisarCorreo(true);
      return;
    }
    router.replace("/hoy");
    router.refresh();
  }

  if (revisarCorreo) {
    return (
      <div className="flex flex-col items-center gap-3 text-center" role="status">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-verde-suave text-verde-texto" aria-hidden>
          <MailCheck className="size-8" strokeWidth={2.5} />
        </span>
        <h1 className="font-titulo text-3xl font-extrabold">¡Revisa tu correo!</h1>
        <p className="text-texto-suave">
          Te enviamos un enlace para confirmar tu cuenta. Ábrelo y volverás a Diarco con todo listo para empezar.
        </p>
        <p className="text-sm text-texto-suave">¿No llega? Mira en la carpeta de spam.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <h1 className="text-center font-titulo text-3xl font-extrabold">Empecemos tu racha</h1>
      {error && <MensajeError error={new Error(error)} />}
      <Campo etiqueta="¿Cómo te llamas?" name="nombre" autoComplete="given-name" placeholder="Tu nombre" error={errores.nombre} />
      <Campo etiqueta="Correo" name="email" type="email" autoComplete="email" placeholder="tu@correo.com" error={errores.email} />
      <Campo
        etiqueta="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        ayuda="Mínimo 8 caracteres."
        error={errores.password}
      />
      <Boton type="submit" grande cargando={cargando} className="w-full">
        Crear mi cuenta
      </Boton>
      <p className="text-center text-texto-suave">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="inline-block py-3 font-extrabold text-violeta-texto">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
