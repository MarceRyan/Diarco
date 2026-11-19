import { describe, expect, it } from "vitest";
import {
  cumplimientoPorDiaSemana,
  cumplimientoPorHabito,
  minutosPorCategoria,
  nivelIntensidad,
  promedioAnimo,
  tasaCumplimiento,
} from "../src";

const filas = [
  { habito_id: 2, fecha: "2026-11-16", completado: true }, // lunes
  { habito_id: 1, fecha: "2026-11-16", completado: true },
  { habito_id: 1, fecha: "2026-11-17", completado: false }, // martes
  { habito_id: 1, fecha: "2026-11-23", completado: true }, // lunes
];

describe("cumplimiento", () => {
  it("tasaCumplimiento", () => {
    expect(tasaCumplimiento(filas)).toBe(0.75);
    expect(tasaCumplimiento([])).toBeNull();
  });

  it("cumplimientoPorHabito agrupa y ordena por id", () => {
    expect(cumplimientoPorHabito(filas)).toEqual([
      { habito_id: 1, programados: 3, completados: 2, tasa: 0.6667 },
      { habito_id: 2, programados: 1, completados: 1, tasa: 1 },
    ]);
  });

  it("cumplimientoPorDiaSemana siempre devuelve 7 días", () => {
    const r = cumplimientoPorDiaSemana(filas);
    expect(r).toHaveLength(7);
    expect(r[1]).toEqual({ dia: 1, nombre: "Lun", programados: 3, completados: 3, tasa: 1 });
    expect(r[2]).toMatchObject({ nombre: "Mar", tasa: 0 });
    expect(r[0]).toMatchObject({ nombre: "Dom", programados: 0, tasa: null });
  });
});

describe("minutosPorCategoria", () => {
  it("suma minutos (null cuenta como 0) y ordena de mayor a menor", () => {
    expect(
      minutosPorCategoria([
        { categoria_id: 1, minutos: 30 },
        { categoria_id: 2, minutos: 120 },
        { categoria_id: 1, minutos: null },
        { categoria_id: null, minutos: 15 },
      ]),
    ).toEqual([
      { categoria_id: 2, minutos: 120, actividades: 1 },
      { categoria_id: 1, minutos: 30, actividades: 2 },
      { categoria_id: null, minutos: 15, actividades: 1 },
    ]);
  });
});

describe("promedioAnimo", () => {
  it("redondea a un decimal", () => {
    expect(promedioAnimo([{ nivel: 4 }, { nivel: 5 }, { nivel: 3 }, { nivel: 4 }])).toBe(4);
    expect(promedioAnimo([{ nivel: 4 }, { nivel: 5 }, { nivel: 5 }])).toBe(4.7);
    expect(promedioAnimo([])).toBeNull();
  });
});

describe("nivelIntensidad", () => {
  it("convierte porcentajes en niveles 0..4", () => {
    expect([null, 0, 0.2, 0.5, 0.7, 0.99, 1].map(nivelIntensidad)).toEqual([0, 0, 1, 2, 3, 3, 4]);
  });
});
