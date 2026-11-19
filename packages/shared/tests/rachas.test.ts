import { describe, expect, it } from "vitest";
import {
  calcularRachaGeneral,
  calcularRachaHabito,
  construirResumenDiario,
  cumpleUmbral,
  hitoAlcanzado,
  rangoFechas,
  siguienteHito,
  type DiaResumen,
} from "../src";

// Calendario de referencia (noviembre de 2026):
//   lun 09 · mar 10 · mié 11 · jue 12 · vie 13 · sáb 14 · dom 15
//   lun 16 · mar 17 · mié 18 · jue 19 (hoy) · vie 20
const HOY = "2026-11-19";
const TODOS = [0, 1, 2, 3, 4, 5, 6];
const LUN_A_VIE = [1, 2, 3, 4, 5];

/** Días de un rango, quitando los indicados. */
const dias = (desde: string, hasta: string, sin: string[] = []) =>
  rangoFechas(desde, hasta).filter((f) => !sin.includes(f));

describe("calcularRachaHabito", () => {
  it("cuenta hoy si ya se completó", () => {
    const r = calcularRachaHabito({
      diasSemana: TODOS,
      desde: "2026-11-01",
      completados: dias("2026-11-15", HOY),
      hoy: HOY,
      protectoresPorSemana: 0,
    });
    expect(r).toMatchObject({ actual: 5, maxima: 5, programadoHoy: true, completadoHoy: true, enRiesgo: false });
  });

  it("si hoy no se marcó, cuenta hasta ayer y avisa que está en riesgo", () => {
    const r = calcularRachaHabito({
      diasSemana: TODOS,
      desde: "2026-11-01",
      completados: dias("2026-11-15", "2026-11-18"),
      hoy: HOY,
      protectoresPorSemana: 0,
    });
    expect(r).toMatchObject({ actual: 4, completadoHoy: false, enRiesgo: true });
  });

  it("no está en riesgo si no hay racha que perder", () => {
    const r = calcularRachaHabito({ diasSemana: TODOS, desde: "2026-11-01", completados: [], hoy: HOY });
    expect(r).toMatchObject({ actual: 0, maxima: 0, enRiesgo: false });
  });

  it("los días no programados no rompen la racha", () => {
    // Lunes a viernes: la semana pasada completa, el fin de semana no cuenta.
    const completados = [...dias("2026-11-09", "2026-11-13"), ...dias("2026-11-16", HOY)];
    const r = calcularRachaHabito({
      diasSemana: LUN_A_VIE,
      desde: "2026-11-01",
      completados,
      hoy: HOY,
      protectoresPorSemana: 0,
    });
    expect(r.actual).toBe(9);
  });

  it("hoy no programado: no está en riesgo y la racha sigue", () => {
    const r = calcularRachaHabito({
      diasSemana: LUN_A_VIE,
      desde: "2026-11-01",
      completados: dias("2026-11-09", "2026-11-13"),
      hoy: "2026-11-15", // domingo
      protectoresPorSemana: 0,
    });
    expect(r).toMatchObject({ actual: 5, programadoHoy: false, enRiesgo: false });
  });

  it("un día fallado rompe la racha si no hay protector", () => {
    const r = calcularRachaHabito({
      diasSemana: TODOS,
      desde: "2026-11-01",
      completados: dias("2026-11-10", HOY, ["2026-11-17"]),
      hoy: HOY,
      protectoresPorSemana: 0,
    });
    expect(r.actual).toBe(2); // 18 y 19
    expect(r.maxima).toBe(7); // del 10 al 16
  });

  it("el protector salva un fallo por semana; el día protegido no suma", () => {
    const r = calcularRachaHabito({
      diasSemana: TODOS,
      desde: "2026-11-01",
      completados: dias("2026-11-10", HOY, ["2026-11-17"]),
      hoy: HOY,
      protectoresPorSemana: 1,
    });
    expect(r.actual).toBe(9); // 10 días menos el protegido
    expect(r.protectoresUsadosSemana).toBe(1);
    expect(r.protectoresRestantesSemana).toBe(0);
  });

  it("el segundo fallo de la misma semana rompe la racha con 1 protector", () => {
    const r = calcularRachaHabito({
      diasSemana: TODOS,
      desde: "2026-11-01",
      completados: dias("2026-11-10", HOY, ["2026-11-16", "2026-11-18"]),
      hoy: HOY,
      protectoresPorSemana: 1,
    });
    expect(r.actual).toBe(1); // se rompe el 18, solo cuenta el 19
    expect(r.maxima).toBe(7); // 10 al 15 (6) + el 17 (protegido el 16) = 7
  });

  it("los protectores se renuevan cada lunes", () => {
    // Un fallo el miércoles 11 y otro el martes 17: semanas distintas.
    const r = calcularRachaHabito({
      diasSemana: TODOS,
      desde: "2026-11-01",
      completados: dias("2026-11-09", HOY, ["2026-11-11", "2026-11-17"]),
      hoy: HOY,
      protectoresPorSemana: 1,
    });
    expect(r.actual).toBe(9);
  });

  it("con 2 protectores se perdonan 2 fallos en la misma semana", () => {
    const r = calcularRachaHabito({
      diasSemana: TODOS,
      desde: "2026-11-01",
      completados: dias("2026-11-10", HOY, ["2026-11-16", "2026-11-18"]),
      hoy: HOY,
      protectoresPorSemana: 2,
    });
    expect(r.actual).toBe(8);
    expect(r.protectoresRestantesSemana).toBe(0);
  });

  it("no gasta protector si la racha ya estaba en 0", () => {
    // Falla el 16 sin racha previa; luego completa 17-19.
    const r = calcularRachaHabito({
      diasSemana: TODOS,
      desde: "2026-11-16",
      completados: dias("2026-11-17", HOY),
      hoy: HOY,
      protectoresPorSemana: 1,
    });
    expect(r.actual).toBe(3);
    expect(r.protectoresUsadosSemana).toBe(0);
    expect(r.protectoresRestantesSemana).toBe(1);
  });

  it("la máxima conserva la mejor racha histórica", () => {
    const completados = [...dias("2026-11-01", "2026-11-12"), ...dias("2026-11-17", "2026-11-18")];
    const r = calcularRachaHabito({ diasSemana: TODOS, desde: "2026-11-01", completados, hoy: HOY, protectoresPorSemana: 0 });
    expect(r).toMatchObject({ actual: 2, maxima: 12 });
  });

  it("ignora registros anteriores a la creación, futuros o de días no programados", () => {
    const r = calcularRachaHabito({
      diasSemana: LUN_A_VIE,
      desde: "2026-11-16",
      completados: ["2026-11-10", "2026-11-13", "2026-11-15", ...dias("2026-11-16", HOY), "2026-11-20"],
      hoy: HOY,
      protectoresPorSemana: 0,
    });
    expect(r).toMatchObject({ actual: 4, maxima: 4 });
  });

  it("un hábito creado en el futuro no tiene racha", () => {
    const r = calcularRachaHabito({ diasSemana: TODOS, desde: "2026-11-25", completados: [], hoy: HOY });
    expect(r).toMatchObject({ actual: 0, maxima: 0, programadoHoy: false, enRiesgo: false });
  });

  it("usa 1 protector por defecto", () => {
    const r = calcularRachaHabito({
      diasSemana: TODOS,
      desde: "2026-11-01",
      completados: dias("2026-11-16", HOY, ["2026-11-17"]),
      hoy: HOY,
    });
    expect(r.actual).toBe(3);
  });
});

describe("cumpleUmbral", () => {
  it("70 % exacto cumple (sin errores de coma flotante)", () => {
    expect(cumpleUmbral({ programados: 10, completados: 7 })).toBe(true);
    expect(cumpleUmbral({ programados: 3, completados: 2 })).toBe(false); // 66,7 %
    expect(cumpleUmbral({ programados: 4, completados: 3 })).toBe(true); // 75 %
    expect(cumpleUmbral({ programados: 0, completados: 0 })).toBe(false);
  });
});

describe("calcularRachaGeneral", () => {
  const dia = (fecha: string, programados: number, completados: number): DiaResumen => ({
    fecha,
    programados,
    completados,
  });

  it("cuenta días seguidos con al menos 70 %", () => {
    const r = calcularRachaGeneral({
      hoy: HOY,
      dias: [
        dia("2026-11-15", 4, 2), // 50 % rompe
        dia("2026-11-16", 4, 3),
        dia("2026-11-17", 4, 4),
        dia("2026-11-18", 10, 7),
        dia(HOY, 4, 3),
      ],
    });
    expect(r).toMatchObject({ actual: 4, maxima: 4, cumpleHoy: true, porcentajeHoy: 0.75 });
  });

  it("hoy por debajo del umbral queda pendiente, no rompe", () => {
    const r = calcularRachaGeneral({
      hoy: HOY,
      dias: [dia("2026-11-17", 2, 2), dia("2026-11-18", 2, 2), dia(HOY, 2, 0)],
    });
    expect(r).toMatchObject({ actual: 2, cumpleHoy: false, porcentajeHoy: 0 });
  });

  it("los días sin hábitos programados (o sin datos) se saltan", () => {
    const r = calcularRachaGeneral({
      hoy: HOY,
      dias: [dia("2026-11-15", 2, 2), dia("2026-11-16", 0, 0), dia("2026-11-18", 2, 2), dia(HOY, 0, 0)],
    });
    expect(r).toMatchObject({ actual: 2, porcentajeHoy: null, cumpleHoy: false });
  });

  it("acepta un umbral distinto (100 % para semana perfecta)", () => {
    const r = calcularRachaGeneral({
      hoy: HOY,
      umbral: 1,
      dias: [dia("2026-11-17", 4, 4), dia("2026-11-18", 4, 3), dia(HOY, 4, 4)],
    });
    expect(r.actual).toBe(1);
  });

  it("sin datos devuelve ceros", () => {
    expect(calcularRachaGeneral({ hoy: HOY, dias: [] })).toEqual({
      actual: 0,
      maxima: 0,
      porcentajeHoy: null,
      cumpleHoy: false,
    });
  });
});

describe("construirResumenDiario", () => {
  it("cuenta programados según días de la semana y fecha de creación", () => {
    const r = construirResumenDiario({
      habitos: [
        { id: 1, diasSemana: TODOS, desde: "2026-11-01" },
        { id: 2, diasSemana: LUN_A_VIE, desde: "2026-11-01" },
        { id: 3, diasSemana: TODOS, desde: "2026-11-15" }, // creado el domingo 15
      ],
      completados: [
        { habito_id: 1, fecha: "2026-11-14" },
        { habito_id: 1, fecha: "2026-11-16" },
        { habito_id: 2, fecha: "2026-11-16" },
        { habito_id: 2, fecha: "2026-11-15" }, // domingo: no programado, no cuenta
      ],
      desde: "2026-11-14",
      hasta: "2026-11-16",
    });
    expect(r).toEqual([
      { fecha: "2026-11-14", programados: 1, completados: 1 }, // sábado
      { fecha: "2026-11-15", programados: 2, completados: 0 }, // domingo: 1 y 3
      { fecha: "2026-11-16", programados: 3, completados: 2 }, // lunes
    ]);
  });

  it("alimenta la racha general", () => {
    const dias = construirResumenDiario({
      habitos: [{ id: 1, diasSemana: TODOS, desde: "2026-11-01" }],
      completados: rangoFechas("2026-11-15", HOY).map((fecha) => ({ habito_id: 1, fecha })),
      desde: "2026-11-01",
      hasta: HOY,
    });
    expect(calcularRachaGeneral({ dias, hoy: HOY }).actual).toBe(5);
  });
});

describe("hitos de racha", () => {
  it("detecta el hito cruzado", () => {
    expect(hitoAlcanzado(2, 3)).toBe(3);
    expect(hitoAlcanzado(6, 7)).toBe(7);
    expect(hitoAlcanzado(7, 8)).toBeNull();
    expect(hitoAlcanzado(99, 100)).toBe(100);
  });

  it("si se cruzan varios a la vez devuelve el mayor", () => {
    expect(hitoAlcanzado(0, 25)).toBe(21);
  });

  it("siguienteHito", () => {
    expect(siguienteHito(0)).toBe(3);
    expect(siguienteHito(7)).toBe(21);
    expect(siguienteHito(100)).toBeNull();
  });
});
