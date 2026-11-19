import { describe, expect, it } from "vitest";
import { descubrimientosAnimo, estadoAnimoNuevoSchema, rangoFechas, semanaDeRacha, textoDescubrimiento } from "../src";

const TODOS = [0, 1, 2, 3, 4, 5, 6];

describe("descubrimientosAnimo", () => {
  // 10 días: los 5 primeros con ejercicio cumplido y ánimo 5; los 5 siguientes sin ejercicio y ánimo 3.
  const fechas = rangoFechas("2026-11-01", "2026-11-10");
  const animo = fechas.map((fecha, i) => ({
    fecha,
    nivel: i < 5 ? 5 : 3,
    etiquetas: i < 4 ? ["dormi_bien"] : i >= 7 ? ["estres"] : [],
  }));
  const habitos = [
    { id: 1, diasSemana: TODOS, desde: "2026-10-01", completados: new Set(fechas.slice(0, 5)) }, // Ejercicio
    { id: 2, diasSemana: TODOS, desde: "2026-10-01", completados: new Set([fechas[0]!, fechas[9]!]) }, // poco dato
  ];

  it("encuentra hábitos y etiquetas que suben o bajan el ánimo, de mayor a menor impacto", () => {
    const r = descubrimientosAnimo({ animo, habitos });
    expect(r[0]).toMatchObject({ tipo: "habito", clave: 1, diferencia: 2, diasCon: 5, diasSin: 5 });
    expect(r).toContainEqual(expect.objectContaining({ tipo: "etiqueta", clave: "dormi_bien", diferencia: 1.7 }));
    // Con estrés: 3,0 de promedio; sin estrés: 31/7 ≈ 4,43 → −1,4.
    expect(r).toContainEqual(expect.objectContaining({ tipo: "etiqueta", clave: "estres", diferencia: -1.4 }));
    // El hábito 2 solo tiene 2 días "con": no alcanza el mínimo de 3.
    expect(r.find((d) => d.tipo === "habito" && d.clave === 2)).toBeUndefined();
  });

  it("ignora diferencias pequeñas y días no programados", () => {
    const parejo = fechas.map((fecha, i) => ({ fecha, nivel: i % 2 === 0 ? 4 : 3 }));
    expect(descubrimientosAnimo({ animo: parejo, habitos: [] })).toEqual([]);
    // Un hábito de domingo no compara días de semana.
    const soloDomingo = [{ id: 9, diasSemana: [0], desde: "2026-10-01", completados: new Set<string>() }];
    expect(descubrimientosAnimo({ animo, habitos: soloDomingo })).not.toContainEqual(expect.objectContaining({ clave: 9 }));
  });

  it("textoDescubrimiento redacta en español con coma decimal", () => {
    expect(
      textoDescubrimiento({ tipo: "habito", clave: 1, diferencia: 0.8, diasCon: 4, diasSin: 4 }, () => "Ejercicio"),
    ).toBe("Los días que cumples «Ejercicio», tu ánimo es 0,8 puntos más alto.");
    expect(textoDescubrimiento({ tipo: "etiqueta", clave: "estres", diferencia: -1.3, diasCon: 3, diasSin: 5 }, () => undefined)).toBe(
      "Los días con «Estrés», tu ánimo baja 1,3 puntos.",
    );
  });
});

describe("semanaDeRacha", () => {
  it("clasifica los 7 días de la semana de hoy (lunes a domingo)", () => {
    const r = semanaDeRacha(
      [
        { fecha: "2026-11-16", programados: 4, completados: 3 }, // 75 % ✔
        { fecha: "2026-11-17", programados: 2, completados: 1 }, // 50 % ✘
        { fecha: "2026-11-18", programados: 0, completados: 0 }, // libre
        { fecha: "2026-11-19", programados: 3, completados: 1 }, // hoy, aún no
      ],
      "2026-11-19",
    );
    expect(r.map((d) => d.estado)).toEqual(["cumplido", "fallado", "libre", "pendiente", "futuro", "futuro", "futuro"]);
    expect(r[0]!.fecha).toBe("2026-11-16");
  });
});

describe("etiquetas de ánimo", () => {
  it("la migración permite exactamente las etiquetas de ETIQUETAS_ANIMO", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { ETIQUETAS_ANIMO } = await import("../src");
    const dir = fileURLToPath(new URL("../../../supabase/migrations/", import.meta.url));
    const archivo = readdirSync(dir).find((f) => f.endsWith("_etiquetas_animo.sql"));
    const sql = readFileSync(`${dir}${archivo}`, "utf8");
    const lista = sql.slice(sql.indexOf("array["), sql.indexOf("]::text[]"));
    const enSql = [...lista.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect([...enSql].sort()).toEqual(ETIQUETAS_ANIMO.map((e) => e.id).sort());
  });

  it("el esquema acepta etiquetas conocidas y rechaza desconocidas, repetidas o demasiadas", () => {
    const base = { fecha: "2026-11-19", nivel: 4, nota: null };
    expect(estadoAnimoNuevoSchema.safeParse({ ...base, etiquetas: ["ejercicio", "familia"] }).success).toBe(true);
    expect(estadoAnimoNuevoSchema.safeParse({ ...base, etiquetas: ["volar"] }).success).toBe(false);
    expect(estadoAnimoNuevoSchema.safeParse({ ...base, etiquetas: ["trabajo", "trabajo"] }).success).toBe(false);
    expect(
      estadoAnimoNuevoSchema.safeParse({
        ...base,
        etiquetas: ["dormi_bien", "ejercicio", "trabajo", "estudio", "familia", "amigos", "logro"],
      }).success,
    ).toBe(false);
    expect(estadoAnimoNuevoSchema.parse(base).etiquetas).toBeUndefined();
  });
});
