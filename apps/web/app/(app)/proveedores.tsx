"use client";

import { ProveedorDiarco } from "@diarco/shared/hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";

let clienteConsultas: QueryClient | undefined;

/** Un QueryClient por render en el servidor y uno compartido en el navegador. */
function obtenerClienteConsultas() {
  const nuevo = () =>
    new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
      },
    });
  if (typeof window === "undefined") return nuevo();
  clienteConsultas ??= nuevo();
  return clienteConsultas;
}

export function Proveedores({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={obtenerClienteConsultas()}>
      <ProveedorDiarco crearCliente={crearClienteNavegador}>{children}</ProveedorDiarco>
    </QueryClientProvider>
  );
}
