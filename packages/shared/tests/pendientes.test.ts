import { describe, expect, it } from "vitest";
import {
  agruparPendientes,
  diasDeAtraso,
  diasDeRutina,
  pendienteActualizarSchema,
  pendienteNuevoSchema,
  rutinasDelDia,
  rutinaTocaba,
  type Pendiente,
  type Rutina,
} from "../src";

const USUARIO = "d3b07384-d9a0-4c9e-8f1a-000000000001";
let siguiente = 1;

function p(titulo: string, extra: Partial<Pendiente> = {}): Pendiente {
  const id = siguiente++;
  return {
    id,
    usuario_id: USUARIO,
    titulo,
    fecha: null,
    hora: null,
    nota: null,
    hecho_en: null,
    creado_en: `2026-11-01T00:00:${String(id).padStart(2, "0")}Z`,
    ...extra,
  };
}

function r(nombre: string, dias: number[], activo = true): Rutina {
  return { id: siguiente++, usuario_id: USUARIO, nombre, icono: "🧹", dias_semana: dias, activo, creado_en: "2026-11-01T00:00:00Z" };
}

const HOY = "2026-11-19"; // jueves
const titulos = (lista: Pendiente[]) => lista.map((x) => x.titulo);

describe("agruparPendientes", () => {
  it("reparte por atrasados, hoy, mañana, próximos, algún día y hechos", () => {
    const g = agruparPendientes(
      [
        p("luz", { fecha: "2026-11-15" }),
        p("pan", { fecha: HOY }),
        p("dentista", { fecha: "2026-11-20", hora: "10:00:00" }),
        p("regalo", { fecha: "2026-11-25" }),
        p("viaje", { fecha: "2026-11-22" }),
        p("libro"),
        p("correo", { fecha: "2026-11-18", hecho_en: "2026-11-18" }),
      ],
      HOY,
    );
    expect(titulos(g.atrasados)).toEqual(["luz"]);
    expect(titulos(g.hoy)).toEqual(["pan"]);
    expect(titulos(g.manana)).toEqual(["dentista"]);
    expect(g.proximos.map((d) => [d.fecha, titulos(d.pendientes)])).toEqual([
      ["2026-11-22", ["viaje"]],
      ["2026-11-25", ["regalo"]],
    ]);
    expect(titulos(g.algunDia)).toEqual(["libro"]);
    expect(titulos(g.hechos)).toEqual(["correo"]);
  });

  it("un pendiente hecho nunca cuenta como atrasado", () => {
    const g = agruparPendientes([p("viejo", { fecha: "2026-11-01", hecho_en: "2026-11-02" })], HOY);
    expect(g.atrasados).toEqual([]);
    expect(titulos(g.hechos)).toEqual(["viejo"]);
  });

  it("dentro del día van primero los que tienen hora, en orden", () => {
    const g = agruparPendientes(
      [p("sin hora", { fecha: HOY }), p("tarde", { fecha: HOY, hora: "18:00:00" }), p("mañana", { fecha: HOY, hora: "08:30:00" })],
      HOY,
    );
    expect(titulos(g.hoy)).toEqual(["mañana", "tarde", "sin hora"]);
  });

  it("los atrasados van del más antiguo al más reciente y los hechos al revés", () => {
    const g = agruparPendientes(
      [
        p("b", { fecha: "2026-11-17" }),
        p("a", { fecha: "2026-11-10" }),
        p("h1", { hecho_en: "2026-11-10" }),
        p("h2", { hecho_en: "2026-11-18" }),
      ],
      HOY,
    );
    expect(titulos(g.atrasados)).toEqual(["a", "b"]);
    expect(titulos(g.hechos)).toEqual(["h2", "h1"]);
  });
});

describe("rutinasDelDia", () => {
  it("solo las activas programadas para ese día de la semana", () => {
    const lista = [r("cama", [0, 1, 2, 3, 4, 5, 6]), r("basura", [1, 3]), r("plantas", [4]), r("pausada", [4], false)];
    expect(rutinasDelDia(lista, HOY).map((x) => x.nombre)).toEqual(["cama", "plantas"]);
  });
});

describe("rutinaTocaba", () => {
  const basura = r("basura", [1, 3, 5]); // lun, mié, vie
  it("solo los días programados", () => {
    expect(rutinaTocaba(basura, "2026-11-18", "2026-11-01")).toBe(true); // miércoles
    expect(rutinaTocaba(basura, "2026-11-19", "2026-11-01")).toBe(false); // jueves
  });
  it("no antes de crearla", () => {
    expect(rutinaTocaba(basura, "2026-11-16", "2026-11-17")).toBe(false);
    expect(rutinaTocaba(basura, "2026-11-18", "2026-11-18")).toBe(true);
  });
});

describe("diasDeRutina", () => {
  it("cuenta días hechos y días que tocaban en el periodo", () => {
    // 16 (lun) al 22 (dom) de noviembre.
    const { porRutina, diasConRutina } = diasDeRutina({
      rutinas: [
        { id: 1, dias_semana: [0, 1, 2, 3, 4, 5, 6], creadaEl: "2026-11-01" }, // cama: todos los días
        { id: 2, dias_semana: [1, 3, 5], creadaEl: "2026-11-18" }, // basura: lun/mié/vie, creada el miércoles
      ],
      hechas: new Map([
        [1, new Set(["2026-11-16", "2026-11-17", "2026-11-20"])],
        [2, new Set(["2026-11-20", "2026-11-30"])], // el 30 está fuera del periodo
      ]),
      desde: "2026-11-16",
      hasta: "2026-11-22",
    });
    expect(porRutina).toEqual([
      { id: 1, hechos: 3, tocaban: 7 },
      { id: 2, hechos: 1, tocaban: 2 }, // tocaba mié 18 y vie 20 (el lunes aún no existía)
    ]);
    expect(diasConRutina).toBe(3); // 16, 17 y 20
  });

  it("un día hecho que no tocaba también cuenta como posible (nunca más hechos que posibles)", () => {
    const { porRutina } = diasDeRutina({
      rutinas: [{ id: 1, dias_semana: [1], creadaEl: "2026-11-20" }], // solo lunes, creada el viernes 20
      hechas: new Map([[1, new Set(["2026-11-19", "2026-11-23"])]]), // jueves 19 (antes de crearla) y lunes 23
      desde: "2026-11-16",
      hasta: "2026-11-23",
    });
    expect(porRutina).toEqual([{ id: 1, hechos: 2, tocaban: 2 }]);
  });
});

describe("diasDeAtraso", () => {
  it("cuenta los días desde la fecha hasta hoy", () => {
    expect(diasDeAtraso("2026-11-16", HOY)).toBe(3);
    expect(diasDeAtraso(HOY, HOY)).toBe(0);
    expect(diasDeAtraso("2026-11-25", HOY)).toBe(0);
  });
});

describe("esquemas de pendientes", () => {
  it("la hora exige una fecha", () => {
    expect(pendienteNuevoSchema.safeParse({ titulo: "Cita", hora: "10:00" }).success).toBe(false);
    expect(pendienteNuevoSchema.safeParse({ titulo: "Cita", fecha: "2026-11-20", hora: "10:00" }).success).toBe(true);
  });

  it("sin fecha se guarda como algún día y el texto vacío de la nota como null", () => {
    const r = pendienteNuevoSchema.parse({ titulo: "  Leer un libro  ", nota: "" });
    expect(r).toEqual({ titulo: "Leer un libro", fecha: null, hora: null, nota: null });
  });

  it("marcar como hecho solo necesita hecho_en", () => {
    expect(pendienteActualizarSchema.safeParse({ hecho_en: HOY }).success).toBe(true);
    expect(pendienteActualizarSchema.safeParse({ hecho_en: null }).success).toBe(true);
  });
});
