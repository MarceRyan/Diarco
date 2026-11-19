import { describe, expect, it } from "vitest";
import { HITOS_RACHA, UMBRAL_RACHA_GENERAL, ZONA_HORARIA_POR_DEFECTO } from "../src";

describe("constantes", () => {
  it("usa America/Lima como zona horaria por defecto", () => {
    expect(ZONA_HORARIA_POR_DEFECTO).toBe("America/Lima");
  });

  it("define los hitos de racha en orden ascendente", () => {
    expect([...HITOS_RACHA]).toEqual([3, 7, 21, 30, 100]);
  });

  it("exige 70 % para la racha general", () => {
    expect(UMBRAL_RACHA_GENERAL).toBe(0.7);
  });
});
