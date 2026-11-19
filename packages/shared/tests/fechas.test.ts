import { describe, expect, it } from "vitest";
import {
  diaSemana,
  diferenciaDias,
  esFechaValida,
  esZonaHorariaValida,
  fechaEnZona,
  fechaHoy,
  horaActual,
  horaAMinutos,
  inicioSemana,
  minutosAHora,
  maximoDiasConsecutivos,
  rangoFechas,
  sumarDias,
} from "../src";

describe("fechaEnZona / fechaHoy", () => {
  it("usa la zona del usuario, no UTC", () => {
    // 03:00 UTC del 20 = 22:00 del 19 en Lima (UTC-5)
    const instante = new Date("2026-11-20T03:00:00Z");
    expect(fechaEnZona(instante, "America/Lima")).toBe("2026-11-19");
    expect(fechaEnZona(instante, "UTC")).toBe("2026-11-20");
    expect(fechaEnZona(instante, "Asia/Tokyo")).toBe("2026-11-20");
  });

  it("por defecto usa America/Lima", () => {
    expect(fechaHoy(undefined, new Date("2026-11-20T04:59:00Z"))).toBe("2026-11-19");
    expect(fechaHoy(undefined, new Date("2026-11-20T05:00:00Z"))).toBe("2026-11-20");
  });
});

describe("validaciones", () => {
  it("esFechaValida rechaza fechas inexistentes o mal formadas", () => {
    expect(esFechaValida("2026-11-19")).toBe(true);
    expect(esFechaValida("2028-02-29")).toBe(true);
    expect(esFechaValida("2026-02-29")).toBe(false);
    expect(esFechaValida("2026-13-01")).toBe(false);
    expect(esFechaValida("19/11/2026")).toBe(false);
  });

  it("esZonaHorariaValida", () => {
    expect(esZonaHorariaValida("America/Lima")).toBe(true);
    expect(esZonaHorariaValida("Marte/Base")).toBe(false);
  });

  it("las operaciones lanzan error con fechas inválidas", () => {
    expect(() => sumarDias("2026-02-30", 1)).toThrow(RangeError);
  });
});

describe("aritmética de fechas", () => {
  it("sumarDias cruza meses, años y bisiestos", () => {
    expect(sumarDias("2026-11-30", 1)).toBe("2026-12-01");
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(sumarDias("2028-02-28", 1)).toBe("2028-02-29");
    expect(sumarDias("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("no se desplaza con cambios de horario de verano", () => {
    // En EE. UU. el horario cambia el 1 de noviembre de 2026.
    expect(rangoFechas("2026-10-31", "2026-11-02")).toEqual(["2026-10-31", "2026-11-01", "2026-11-02"]);
  });

  it("diferenciaDias", () => {
    expect(diferenciaDias("2026-11-01", "2026-11-19")).toBe(18);
    expect(diferenciaDias("2026-11-19", "2026-11-01")).toBe(-18);
  });

  it("diaSemana: 0 = domingo … 6 = sábado", () => {
    expect(diaSemana("2026-11-15")).toBe(0); // domingo
    expect(diaSemana("2026-11-16")).toBe(1); // lunes
    expect(diaSemana("2026-11-21")).toBe(6); // sábado
  });

  it("inicioSemana devuelve el lunes (el domingo cierra la semana)", () => {
    expect(inicioSemana("2026-11-16")).toBe("2026-11-16");
    expect(inicioSemana("2026-11-19")).toBe("2026-11-16");
    expect(inicioSemana("2026-11-22")).toBe("2026-11-16");
    expect(inicioSemana("2026-11-23")).toBe("2026-11-23");
  });

  it("rangoFechas incluye ambos extremos", () => {
    expect(rangoFechas("2026-11-19", "2026-11-19")).toEqual(["2026-11-19"]);
    expect(rangoFechas("2026-11-20", "2026-11-19")).toEqual([]);
  });
});

describe("horas", () => {
  it("horaActual usa la zona del usuario en formato 24 h", () => {
    const instante = new Date("2026-11-20T03:07:00Z");
    expect(horaActual("America/Lima", instante)).toBe("22:07");
    expect(horaActual("UTC", instante)).toBe("03:07");
  });

  it("minutosAHora y horaAMinutos son inversas y dan la vuelta al día", () => {
    expect(minutosAHora(0)).toBe("00:00");
    expect(minutosAHora(13 * 60 + 50)).toBe("13:50");
    expect(minutosAHora(1440)).toBe("00:00");
    expect(minutosAHora(-5)).toBe("23:55");
    expect(horaAMinutos(minutosAHora(615))).toBe(615);
    expect(horaAMinutos("08:30:00")).toBe(510);
  });
});

describe("maximoDiasConsecutivos", () => {
  it("encuentra la secuencia más larga, sin importar orden ni duplicados", () => {
    expect(maximoDiasConsecutivos([])).toBe(0);
    expect(
      maximoDiasConsecutivos(["2026-11-05", "2026-11-01", "2026-11-02", "2026-11-02", "2026-11-03", "2026-11-06"]),
    ).toBe(3);
    expect(maximoDiasConsecutivos(["2026-12-31", "2027-01-01"])).toBe(2);
  });
});
