import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CATALOGO_LOGROS,
  CODIGOS_LOGRO,
  contarFindesPerfectos,
  evaluarLogros,
  GRUPOS_LOGRO,
  maximoCategoriasEnUnaSemana,
  nuevosLogros,
  progresoLogros,
  rangoFechas,
  type ContextoLogros,
  type TotalesLogros,
} from "../src";

const HOY = "2026-11-19"; // jueves

const ceros: TotalesLogros = {
  completados: 0,
  dias_activos: 0,
  actividades: 0,
  minutos_registrados: 0,
  actividades_madrugada: 0,
  actividades_noche: 0,
  animo_registros: 0,
  habitos_creados: 0,
  habitos_activos: 0,
  categorias: 0,
  bloques: 0,
  minutos_planificados: 0,
  notas: 0,
};

const base: ContextoLogros = {
  hoy: HOY,
  mejorRacha: 0,
  mejorRachaGeneral: 0,
  resumenDiario: [],
  actividades: [],
  fechasAnimo: [],
  totales: ceros,
};

const con = (cambios: Partial<Omit<ContextoLogros, "totales">> & { totales?: Partial<TotalesLogros> }): ContextoLogros => ({
  ...base,
  ...cambios,
  totales: { ...ceros, ...cambios.totales },
});

describe("catálogo", () => {
  it("tiene 109 logros con códigos únicos, metas positivas y grupos válidos", () => {
    expect(CATALOGO_LOGROS).toHaveLength(109);
    expect(new Set(CODIGOS_LOGRO).size).toBe(109);
    const grupos = new Set(GRUPOS_LOGRO.map((g) => g.id));
    for (const l of CATALOGO_LOGROS) {
      expect(l.meta, l.codigo).toBeGreaterThan(0);
      expect(grupos.has(l.grupo), l.codigo).toBe(true);
      expect(l.codigo).toMatch(/^[a-z0-9_]+$/);
    }
  });

  it("cada grupo tiene logros", () => {
    for (const g of GRUPOS_LOGRO) {
      expect(CATALOGO_LOGROS.some((l) => l.grupo === g.id), g.id).toBe(true);
    }
  });

  it("la migración generada contiene exactamente el catálogo", () => {
    const dir = fileURLToPath(new URL("../../../supabase/migrations/", import.meta.url));
    const archivo = readdirSync(dir).find((f) => f.endsWith("_logros_ampliados.sql"));
    expect(archivo, "falta la migración *_logros_ampliados.sql (pnpm --filter @diarco/shared generar:logros)").toBeDefined();
    const sql = readFileSync(`${dir}${archivo}`, "utf8");
    const codigos = [...sql.matchAll(/^\s+\('([a-z0-9_]+)'/gm)].map((m) => m[1]);
    expect([...codigos].sort()).toEqual([...CODIGOS_LOGRO].sort());
  });
});

describe("evaluarLogros", () => {
  it("sin historial no hay logros", () => {
    expect(evaluarLogros(base)).toEqual([]);
  });

  it("rachas de hábito: todas las metas alcanzadas", () => {
    const r = evaluarLogros(con({ mejorRacha: 21 }));
    expect(r).toEqual(expect.arrayContaining(["racha_2", "racha_3", "racha_5", "racha_7", "racha_10", "racha_14", "racha_21"]));
    expect(r).not.toContain("racha_30");
  });

  it("racha general y totales de toda la historia", () => {
    const r = evaluarLogros(
      con({ mejorRachaGeneral: 14, totales: { completados: 30, actividades: 12, minutos_registrados: 600, notas: 1 } }),
    );
    expect(r).toEqual(
      expect.arrayContaining([
        "general_3",
        "general_7",
        "general_14",
        "primer_paso",
        "completados_10",
        "completados_25",
        "actividades_1",
        "actividades_10",
        "horas_1",
        "horas_10",
        "notas_1",
      ]),
    );
    expect(r).not.toContain("general_21");
    expect(r).not.toContain("completados_50");
  });

  it("organización, madrugador y noctámbulo", () => {
    const r = evaluarLogros(
      con({
        totales: {
          habitos_creados: 5,
          habitos_activos: 3,
          categorias: 3,
          bloques: 10,
          minutos_planificados: 21 * 60,
          actividades_madrugada: 1,
          actividades_noche: 10,
        },
      }),
    );
    expect(r).toEqual(
      expect.arrayContaining([
        "habitos_5",
        "activos_3",
        "categorias_3",
        "bloques_10",
        "plan_20",
        "madrugador_1",
        "noctambulo_10",
      ]),
    );
    expect(r).not.toContain("plan_40");
    expect(r).not.toContain("activos_5");
  });

  it("días perfectos seguidos dan semana perfecta y perfecto_3", () => {
    const perfecta = rangoFechas("2026-11-13", HOY).map((fecha) => ({ fecha, programados: 2, completados: 2 }));
    expect(evaluarLogros(con({ resumenDiario: perfecta }))).toEqual(
      expect.arrayContaining(["perfecto_3", "semana_perfecta"]),
    );
  });

  it("bitácora y ánimo: días seguidos", () => {
    const r = evaluarLogros(
      con({
        actividades: rangoFechas("2026-11-06", HOY).map((fecha) => ({ fecha, categoria_id: null })), // 14 días
        fechasAnimo: rangoFechas("2026-11-13", HOY), // 7 días
      }),
    );
    expect(r).toEqual(expect.arrayContaining(["bitacora_3", "bitacora_constante", "bitacora_14", "animo_3", "animo_7"]));
    expect(r).not.toContain("buen_animo");
  });
});

describe("métricas especiales", () => {
  it("contarFindesPerfectos: sábado + domingo con todo cumplido", () => {
    const dias = [
      { fecha: "2026-11-07", programados: 2, completados: 2 }, // sábado
      { fecha: "2026-11-08", programados: 1, completados: 1 }, // domingo → finde perfecto
      { fecha: "2026-11-14", programados: 2, completados: 2 }, // sábado
      { fecha: "2026-11-15", programados: 2, completados: 1 }, // domingo incompleto
      { fecha: "2026-11-21", programados: 0, completados: 0 }, // sábado sin hábitos
      { fecha: "2026-11-22", programados: 0, completados: 0 },
    ];
    expect(contarFindesPerfectos(dias)).toBe(1);
  });

  it("maximoCategoriasEnUnaSemana cuenta categorías distintas por semana", () => {
    expect(
      maximoCategoriasEnUnaSemana([
        { fecha: "2026-11-16", categoria_id: 1 },
        { fecha: "2026-11-17", categoria_id: 2 },
        { fecha: "2026-11-18", categoria_id: 2 },
        { fecha: "2026-11-22", categoria_id: 3 }, // domingo: misma semana
        { fecha: "2026-11-23", categoria_id: 4 }, // lunes siguiente
        { fecha: "2026-11-23", categoria_id: null },
      ]),
    ).toBe(3);
    expect(maximoCategoriasEnUnaSemana([])).toBe(0);
  });
});

describe("progreso y nuevos logros", () => {
  it("el progreso no pasa de la meta y coincide con la evaluación", () => {
    const ctx = con({ mejorRacha: 12 });
    const p = progresoLogros(ctx);
    expect(p.find((x) => x.codigo === "racha_21")).toEqual({ codigo: "racha_21", valor: 12, meta: 21, cumplido: false });
    expect(p.find((x) => x.codigo === "racha_10")).toEqual({ codigo: "racha_10", valor: 10, meta: 10, cumplido: true });
    expect(p.filter((x) => x.cumplido).map((x) => x.codigo)).toEqual(evaluarLogros(ctx));
  });

  it("nuevosLogros devuelve solo los que aún no se tienen", () => {
    expect(nuevosLogros(con({ mejorRacha: 3 }), ["racha_2"])).toEqual(["racha_3"]);
  });
});
