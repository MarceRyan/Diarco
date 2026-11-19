"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campos";
import { EstadoVacio, MensajeError } from "@/components/ui/estados";
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
      <EstadoVacio
        icono={<MailCheck className="size-6" />}
        titulo="Revisa tu correo"
        descripcion="Te enviamos un enlace para confirmar tu cuenta. Ábrelo y volverás a Diarco con la sesión iniciada."
      />
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <h1 className="font-titulo text-2xl font-bold">Crear cuenta</h1>
      {error && <MensajeError error={new Error(error)} />}
      <Campo etiqueta="Nombre" name="nombre" autoComplete="given-name" error={errores.nombre} />
      <Campo etiqueta="Correo" name="email" type="email" autoComplete="email" error={errores.email} />
      <Campo
        etiqueta="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        ayuda="Mínimo 8 caracteres."
        error={errores.password}
      />
      <Boton type="submit" cargando={cargando} className="w-full">
        Crear cuenta
      </Boton>
      <p className="text-center text-sm text-texto-suave">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="inline-block py-3 font-semibold text-violeta">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
