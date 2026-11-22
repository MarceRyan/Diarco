import { describe, expect, it } from "vitest";
import {
  agruparPendientes,
  diasDeAtraso,
  pendienteActualizarSchema,
  pendienteNuevoSchema,
  rutinasDelDia,
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
