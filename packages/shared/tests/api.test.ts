import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ErrorDiarco, TAMANO_PAGINA, obtenerTodo, traducirError, validar } from "../src";

const sinError = (data: unknown) => ({ data, error: null });
const conError = (code: string) => ({
  data: null,
  error: { code, message: "detalle técnico", details: "", hint: "", name: "PostgrestError" },
});

describe("traducirError", () => {
  it("traduce códigos conocidos y conserva el código original", () => {
    const e = traducirError({ code: "23505", message: "duplicate key" });
    expect(e).toBeInstanceOf(ErrorDiarco);
    expect(e.message).toBe("Ya existe un registro igual.");
    expect(e.codigo).toBe("23505");
  });

  it("usa un mensaje genérico para códigos desconocidos (sin filtrar detalles técnicos)", () => {
    expect(traducirError({ code: "XX000", message: "stack interno" }).message).toBe(
      "Algo salió mal. Inténtalo de nuevo.",
    );
  });
});

describe("validar", () => {
  it("devuelve los datos validados", () => {
    expect(validar(sinError([1, 2]), z.array(z.number()))).toEqual([1, 2]);
  });

  it("lanza el error traducido si Supabase falla", () => {
    expect(() => validar(conError("42501") as never, z.any())).toThrow("No tienes permiso");
  });

  it("lanza si los datos no tienen el formato esperado", () => {
    expect(() => validar(sinError("texto"), z.array(z.number()))).toThrow("formato esperado");
  });
});

describe("obtenerTodo", () => {
  it("pide páginas hasta que una llega incompleta", async () => {
    const total = TAMANO_PAGINA * 2 + 5;
    const pedidos: [number, number][] = [];
    const filas = await obtenerTodo(async (desde, hasta) => {
      pedidos.push([desde, hasta]);
      const fin = Math.min(hasta + 1, total);
      return sinError(Array.from({ length: Math.max(0, fin - desde) }, (_, i) => desde + i));
    }, z.array(z.number()));

    expect(filas).toHaveLength(total);
    expect(pedidos).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });
});
