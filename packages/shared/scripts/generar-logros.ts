/**
 * Genera la migración SQL del catálogo de logros a partir de CATALOGO_LOGROS,
 * para que la tabla `logros` y la app nunca se desincronicen.
 *
 * Uso: pnpm --filter @diarco/shared generar:logros <ruta-de-la-migración.sql>
 */
import { writeFileSync } from "node:fs";
import { CATALOGO_LOGROS } from "../src/logic/logros";

const destino = process.argv[2];
if (!destino) {
  console.error("Falta la ruta del archivo de migración.");
  process.exit(1);
}

const texto = (s: string) => `'${s.replaceAll("'", "''")}'`;

const filas = CATALOGO_LOGROS.map((l) => `  (${texto(l.codigo)}, ${texto(l.nombre)}, ${texto(l.descripcion)})`).join(",\n");

const sql = `-- =============================================================================
-- Diarco · Catálogo de logros ampliado (${CATALOGO_LOGROS.length} logros)
-- ARCHIVO GENERADO por packages/shared/scripts/generar-logros.ts a partir de
-- CATALOGO_LOGROS. No editar a mano: cambia el catálogo y vuelve a generarlo.
-- Inserta los nuevos y actualiza nombre y descripción de los existentes.
-- =============================================================================
insert into public.logros (codigo, nombre, descripcion) values
${filas}
on conflict (codigo) do update
  set nombre = excluded.nombre,
      descripcion = excluded.descripcion;
`;

writeFileSync(destino, sql);
console.log(`Escritos ${CATALOGO_LOGROS.length} logros en ${destino}`);
