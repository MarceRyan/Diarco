import { describe, expect, it } from "vitest";
import { distribuirBloques, minutosPlanificadosPorCategoria, rangoHorasDia } from "../src";

const b = (id: string, inicio: string, fin: string) => ({ id, inicio, fin });
const resumen = (lista: ReturnType<typeof distribuirBloques<ReturnType<typeof b>>>) =>
  lista.map((x) => [x.bloque.id, x.carril, x.carriles]);

describe("distribuirBloques", () => {
  it("bloques que no se pisan van en un solo carril", () => {
    expect(resumen(distribuirBloques([b("a", "08:00", "09:00"), b("b", "09:00", "10:00")]))).toEqual([
      ["a", 0, 1],
      ["b", 0, 1],
    ]);
  });

  it("bloques que se pisan van lado a lado", () => {
    expect(resumen(distribuirBloques([b("a", "08:00", "10:00"), b("b", "09:00", "11:00")]))).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
    ]);
  });

  it("reutiliza un carril cuando queda libre dentro del mismo grupo", () => {
    // a ocupa 8-12; b 8-9 y c 9-10 caben en el segundo carril uno tras otro.
    expect(
      resumen(distribuirBloques([b("c", "09:00", "10:00"), b("a", "08:00", "12:00"), b("b", "08:00", "09:00")])),
    ).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 1, 2],
    ]);
  });

  it("cada grupo cuenta sus propios carriles", () => {
    const r = resumen(
      distribuirBloques([b("a", "08:00", "09:00"), b("b", "08:30", "09:30"), b("c", "14:00", "15:00")]),
    );
    expect(r).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 0, 1],
    ]);
  });
});

describe("minutosPlanificadosPorCategoria", () => {
  it("multiplica por los días de la semana y ordena de mayor a menor", () => {
    expect(
      minutosPlanificadosPorCategoria([
        { inicio: "09:00", fin: "11:00", dias_semana: [1, 2, 3, 4, 5], categoria_id: 3 }, // 10 h
        { inicio: "19:00", fin: "20:30", dias_semana: [2, 4], categoria_id: 1 }, // 3 h
        { inicio: "07:00", fin: "08:00", dias_semana: [6], categoria_id: 1 }, // 1 h
        { inicio: "13:00", fin: "13:30", dias_semana: [0], categoria_id: null }, // 30 min
      ]),
    ).toEqual([
      { categoria_id: 3, minutos: 600 },
      { categoria_id: 1, minutos: 240 },
      { categoria_id: null, minutos: 30 },
    ]);
  });
});

describe("rangoHorasDia", () => {
  it("usa 7 a 21 por defecto y se amplía para que quepan los bloques", () => {
    expect(rangoHorasDia([])).toEqual([7, 21]);
    expect(rangoHorasDia([b("a", "06:30", "07:30"), b("b", "21:15", "22:40")])).toEqual([6, 23]);
    expect(rangoHorasDia([b("a", "23:00", "23:59")])).toEqual([7, 24]);
  });
});
