import { describe, expect, it } from "vitest";
import {
  actividadNuevaSchema,
  bloqueHorarioActualizarSchema,
  bloqueHorarioNuevoSchema,
  categoriaNuevaSchema,
  habitoNuevoSchema,
  habitoSchema,
  perfilActualizarSchema,
  resumenDiaSchema,
} from "../src";

/** Primer mensaje de error de un resultado de safeParse. */
const error = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues[0]?.message;

describe("habitoNuevoSchema", () => {
  it("aplica valores por defecto y limpia espacios", () => {
    expect(habitoNuevoSchema.parse({ nombre: "  Leer  ", meta: "" })).toEqual({
      nombre: "Leer",
      icono: "✓",
      color: "#ff6a2b",
      dias_semana: [0, 1, 2, 3, 4, 5, 6],
      meta: null,
      activo: true,
    });
  });

  it("rechaza datos inválidos con mensajes en español", () => {
    expect(error(habitoNuevoSchema.safeParse({ nombre: "   " }))).toBe("El nombre es obligatorio");
    expect(error(habitoNuevoSchema.safeParse({ nombre: "x", dias_semana: [1, 1] }))).toBe("Hay días repetidos");
    expect(error(habitoNuevoSchema.safeParse({ nombre: "x", dias_semana: [] }))).toBe("Elige al menos un día");
    expect(habitoNuevoSchema.safeParse({ nombre: "x", dias_semana: [7] }).success).toBe(false);
    expect(error(habitoNuevoSchema.safeParse({ nombre: "x", color: "rojo" }))).toBe("Color inválido (formato #rrggbb)");
    expect(habitoNuevoSchema.safeParse({ nombre: "x".repeat(61) }).success).toBe(false);
  });

  it("habitoSchema acepta una fila tal como la devuelve Supabase", () => {
    const fila = {
      id: 1,
      usuario_id: "d3b07384-d9a0-4c9e-8f1a-000000000001",
      nombre: "Leer",
      icono: "📚",
      color: "#6741d9",
      dias_semana: [1, 2, 3, 4, 5],
      meta: null,
      activo: true,
      creado_en: "2026-11-19T17:02:49.123456+00:00",
    };
    expect(habitoSchema.parse(fila)).toEqual(fila);
  });
});

describe("bloques de horario", () => {
  it("la hora de fin debe ser posterior al inicio", () => {
    const r = bloqueHorarioNuevoSchema.safeParse({ dias_semana: [1], inicio: "10:00", fin: "09:30", titulo: "x" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]).toMatchObject({ path: ["fin"], message: "La hora de fin debe ser posterior a la de inicio" });
    expect(bloqueHorarioNuevoSchema.safeParse({ dias_semana: [1], inicio: "10:00", fin: "10:00", titulo: "x" }).success).toBe(false);
  });

  it("acepta horas con segundos como las devuelve Postgres", () => {
    expect(
      bloqueHorarioNuevoSchema.parse({ dias_semana: [1, 3], inicio: "08:00:00", fin: "13:00:00", titulo: "Trabajo" }),
    ).toMatchObject({ categoria_id: null });
  });

  it("al editar solo valida el orden si vienen ambas horas", () => {
    expect(bloqueHorarioActualizarSchema.safeParse({ fin: "09:00" }).success).toBe(true);
    expect(bloqueHorarioActualizarSchema.safeParse({ inicio: "10:00", fin: "09:00" }).success).toBe(false);
  });

  it("rechaza horas imposibles", () => {
    expect(bloqueHorarioNuevoSchema.safeParse({ dias_semana: [1], inicio: "24:00", fin: "25:00", titulo: "x" }).success).toBe(false);
  });
});

describe("actividadNuevaSchema", () => {
  it("campos opcionales pasan a null", () => {
    expect(actividadNuevaSchema.parse({ fecha: "2026-11-19", descripcion: "Correr" })).toEqual({
      fecha: "2026-11-19",
      hora: null,
      descripcion: "Correr",
      categoria_id: null,
      minutos: null,
    });
  });

  it("valida fecha real y rango de minutos", () => {
    expect(actividadNuevaSchema.safeParse({ fecha: "2026-02-30", descripcion: "x" }).success).toBe(false);
    expect(error(actividadNuevaSchema.safeParse({ fecha: "2026-11-19", descripcion: "x", minutos: 0 }))).toBe("Mínimo 1 minuto");
    expect(actividadNuevaSchema.safeParse({ fecha: "2026-11-19", descripcion: "x", minutos: 1441 }).success).toBe(false);
  });
});

describe("perfil y categorías", () => {
  it("perfilActualizarSchema valida zona horaria y protectores", () => {
    expect(perfilActualizarSchema.parse({ zona_horaria: "Europe/Madrid" })).toEqual({ zona_horaria: "Europe/Madrid" });
    expect(error(perfilActualizarSchema.safeParse({ zona_horaria: "Marte/Base" }))).toBe("Zona horaria desconocida");
    expect(perfilActualizarSchema.safeParse({ protectores_semana: 8 }).success).toBe(false);
  });

  it("categoriaNuevaSchema usa violeta por defecto", () => {
    expect(categoriaNuevaSchema.parse({ nombre: "Trabajo" })).toEqual({ nombre: "Trabajo", color: "#6741d9" });
  });
});

describe("resumenDiaSchema", () => {
  it("acepta porcentaje numérico, en texto o null", () => {
    expect(resumenDiaSchema.parse({ fecha: "2026-11-19", programados: 4, completados: 3, porcentaje: 0.75 }).porcentaje).toBe(0.75);
    expect(resumenDiaSchema.parse({ fecha: "2026-11-19", programados: 4, completados: 3, porcentaje: "0.7500" }).porcentaje).toBe(0.75);
    expect(resumenDiaSchema.parse({ fecha: "2026-11-19", programados: 0, completados: 0, porcentaje: null }).porcentaje).toBeNull();
  });
});
