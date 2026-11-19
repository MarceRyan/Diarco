import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CODIGOS_LOGRO, evaluarLogros, nuevosLogros, rangoFechas, type ContextoLogros } from "../src";

const HOY = "2026-11-19";

const base: ContextoLogros = {
  totalCompletados: 0,
  mejorRacha: 0,
  resumenDiario: [],
  fechasActividades: [],
  fechasAnimo: [],
  hoy: HOY,
};

describe("evaluarLogros", () => {
  it("sin historial no hay logros", () => {
    expect(evaluarLogros(base)).toEqual([]);
  });

  it("primer paso y logros de racha según la mejor racha", () => {
    expect(evaluarLogros({ ...base, totalCompletados: 25, mejorRacha: 21 })).toEqual([
      "primer_paso",
      "racha_3",
      "racha_7",
      "racha_21",
    ]);
  });

  it("semana perfecta: 7 días seguidos al 100 %", () => {
    const perfecta = rangoFechas("2026-11-13", HOY).map((fecha) => ({ fecha, programados: 3, completados: 3 }));
    expect(evaluarLogros({ ...base, resumenDiario: perfecta })).toContain("semana_perfecta");

    const casi = perfecta.map((d, i) => (i === 3 ? { ...d, completados: 2 } : d));
    expect(evaluarLogros({ ...base, resumenDiario: casi })).not.toContain("semana_perfecta");
  });

  it("bitácora constante (7 días) y buen ánimo (14 días)", () => {
    const r = evaluarLogros({
      ...base,
      fechasActividades: rangoFechas("2026-11-13", HOY),
      fechasAnimo: rangoFechas("2026-11-07", HOY), // 13 días: aún no
    });
    expect(r).toContain("bitacora_constante");
    expect(r).not.toContain("buen_animo");

    expect(evaluarLogros({ ...base, fechasAnimo: rangoFechas("2026-11-06", HOY) })).toContain("buen_animo");
  });
});

describe("nuevosLogros", () => {
  it("devuelve solo los que aún no se tienen", () => {
    expect(nuevosLogros({ ...base, totalCompletados: 5, mejorRacha: 7 }, ["primer_paso", "racha_3"])).toEqual([
      "racha_7",
    ]);
  });
});

describe("catálogo", () => {
  it("los códigos coinciden con los logros del seed de Supabase", () => {
    const seed = readFileSync(fileURLToPath(new URL("../../../supabase/seed.sql", import.meta.url)), "utf8");
    const bloque = seed.slice(seed.indexOf("insert into public.logros"), seed.indexOf("on conflict (codigo)"));
    const codigosSeed = [...bloque.matchAll(/\(\s*'([a-z0-9_]+)'/g)].map((m) => m[1]);
    expect([...codigosSeed].sort()).toEqual([...CODIGOS_LOGRO].sort());
  });
});
