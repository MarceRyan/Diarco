import { describe, expect, it } from "vitest";
import {
  cosechasSemanales,
  diasSinLena,
  ETAPAS_CHISPA,
  esHemisferioSur,
  estacionDelAno,
  etapaChispa,
  lenaTotal,
} from "../src";

describe("leña y etapas", () => {
  it("lenaTotal suma hábitos, días con ánimo y actividades", () => {
    expect(lenaTotal({ completados: 20, animo_registros: 5, actividades: 7 })).toBe(32);
  });

  it("etapaChispa respeta los umbrales y calcula el avance", () => {
    expect(etapaChispa(0)).toMatchObject({ numero: 1, nombre: "Chispita", siguiente: { nombre: "Llamita", desde: 10 } });
    expect(etapaChispa(9).numero).toBe(1);
    expect(etapaChispa(10)).toMatchObject({ numero: 2, nombre: "Llamita" });
    expect(etapaChispa(50)).toMatchObject({ numero: 3, nombre: "Fueguito", progreso: 0.5 }); // 30 → 70
    expect(etapaChispa(5000)).toMatchObject({ numero: 10, nombre: "Estrella", siguiente: null, progreso: 1 });
  });

  it("hay 10 etapas con umbrales crecientes", () => {
    expect(ETAPAS_CHISPA).toHaveLength(10);
    for (let i = 1; i < ETAPAS_CHISPA.length; i++) {
      expect(ETAPAS_CHISPA[i]!.desde).toBeGreaterThan(ETAPAS_CHISPA[i - 1]!.desde);
    }
  });

  it("diasSinLena cuenta desde la última fecha con leña (ignora futuras)", () => {
    expect(diasSinLena(["2026-11-10", "2026-11-16", "2026-11-25"], "2026-11-19")).toBe(3);
    expect(diasSinLena(["2026-11-19"], "2026-11-19")).toBe(0);
    expect(diasSinLena([], "2026-11-19")).toBeNull();
  });
});

describe("estaciones", () => {
  it("Lima está en el hemisferio sur; Madrid en el norte", () => {
    expect(esHemisferioSur("America/Lima")).toBe(true);
    expect(esHemisferioSur("America/Argentina/Cordoba")).toBe(true);
    expect(esHemisferioSur("Europe/Madrid")).toBe(false);
    expect(esHemisferioSur("America/Mexico_City")).toBe(false);
  });

  it("las estaciones se invierten en el hemisferio sur", () => {
    expect(estacionDelAno("2026-11-19", "America/Lima")).toBe("primavera");
    expect(estacionDelAno("2026-11-19", "Europe/Madrid")).toBe("otono");
    expect(estacionDelAno("2026-01-15", "America/Lima")).toBe("verano");
    expect(estacionDelAno("2026-07-01", "America/Lima")).toBe("invierno");
    expect(estacionDelAno("2026-04-10", "America/Mexico_City")).toBe("primavera");
  });
});

describe("cosechasSemanales", () => {
  it("resume cada semana de la más reciente a la más antigua", () => {
    const r = cosechasSemanales({
      hoy: "2026-11-19", // jueves
      semanas: 2,
      dias: [
        { fecha: "2026-11-16", programados: 2, completados: 2 },
        { fecha: "2026-11-17", programados: 2, completados: 1 },
        { fecha: "2026-11-18", programados: 2, completados: 2 },
        { fecha: "2026-11-09", programados: 4, completados: 3 },
        { fecha: "2026-11-11", programados: 4, completados: 4 },
      ],
      fechasAnimo: ["2026-11-16", "2026-11-10"],
      actividades: [{ fecha: "2026-11-18" }, { fecha: "2026-11-18" }],
    });
    expect(r[0]).toEqual({
      semana: "2026-11-16",
      enCurso: true,
      lena: 5 + 1 + 2,
      cumplimiento: 5 / 6,
      diasQueSumaron: 2,
      mejorDia: "2026-11-16",
    });
    expect(r[1]).toMatchObject({ semana: "2026-11-09", enCurso: false, lena: 8, cumplimiento: 7 / 8, mejorDia: "2026-11-11" });
  });
});
