import { describe, expect, it } from "vitest";
import { historialReciente, pendientesDeAyer, rangoFechas } from "../src";

// lun 16 · mar 17 · mié 18 · jue 19 (hoy) de noviembre de 2026
const HOY = "2026-11-19";
const LUN_A_VIE = [1, 2, 3, 4, 5];

describe("historialReciente", () => {
  it("clasifica cada día de la última semana", () => {
    const r = historialReciente({
      diasSemana: LUN_A_VIE,
      desde: "2026-11-14", // sábado
      completados: new Set(["2026-11-16", "2026-11-18"]),
      hoy: HOY,
    });
    expect(r.map((d) => [d.fecha, d.estado, d.marcable])).toEqual([
      ["2026-11-13", "antes", false], // viernes, antes de crear el hábito
      ["2026-11-14", "libre", false], // sábado
      ["2026-11-15", "libre", false], // domingo
      ["2026-11-16", "cumplido", true],
      ["2026-11-17", "fallado", true], // se puede corregir
      ["2026-11-18", "cumplido", true],
      ["2026-11-19", "pendiente", true], // hoy
    ]);
  });

  it("respeta la cantidad de días pedida", () => {
    const r = historialReciente({ diasSemana: [0, 1, 2, 3, 4, 5, 6], desde: "2026-01-01", completados: new Set(), hoy: HOY, dias: 3 });
    expect(r.map((d) => d.fecha)).toEqual(rangoFechas("2026-11-17", HOY));
  });
});

describe("pendientesDeAyer", () => {
  it("devuelve los hábitos que ayer tocaban y no se marcaron", () => {
    const habitos = [
      { id: 1, diasSemana: LUN_A_VIE, desde: "2026-11-01", completados: new Set(["2026-11-18"]) },
      { id: 2, diasSemana: LUN_A_VIE, desde: "2026-11-01", completados: new Set<string>() },
      { id: 3, diasSemana: [0, 6], desde: "2026-11-01", completados: new Set<string>() }, // ayer no tocaba
      { id: 4, diasSemana: LUN_A_VIE, desde: HOY, completados: new Set<string>() }, // creado hoy
    ];
    expect(pendientesDeAyer(habitos, HOY)).toEqual([2]);
  });
});
