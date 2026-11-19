/**
 * Distribución visual del horario de un día: qué bloques se pisan y en qué
 * carril va cada uno para dibujarlos lado a lado sin taparse.
 */
import { horaAMinutos } from "../schemas";

export interface BloqueEnCarril<T> {
  bloque: T;
  inicio: number; // minutos desde medianoche
  fin: number;
  /** Carril (columna) del bloque dentro de su grupo, desde 0. */
  carril: number;
  /** Carriles que usa el grupo de bloques que se pisan entre sí. */
  carriles: number;
}

/**
 * Asigna carriles a los bloques de un día. Los bloques que se solapan forman
 * un grupo; cada uno ocupa el primer carril libre (algoritmo voraz por inicio).
 * Un bloque que termina justo cuando otro empieza no se considera solapado.
 */
export function distribuirBloques<T extends { inicio: string; fin: string }>(bloques: readonly T[]): BloqueEnCarril<T>[] {
  const ordenados = bloques
    .map((bloque) => ({ bloque, inicio: horaAMinutos(bloque.inicio), fin: horaAMinutos(bloque.fin) }))
    .sort((a, b) => a.inicio - b.inicio || b.fin - a.fin);

  const resultado: BloqueEnCarril<T>[] = [];
  let grupo: BloqueEnCarril<T>[] = [];
  let finGrupo = -1;
  let finCarriles: number[] = []; // fin del último bloque de cada carril del grupo

  const cerrarGrupo = () => {
    const total = finCarriles.length;
    grupo.forEach((b) => (b.carriles = total));
    resultado.push(...grupo);
    grupo = [];
    finCarriles = [];
  };

  for (const b of ordenados) {
    if (b.inicio >= finGrupo && grupo.length > 0) cerrarGrupo();
    let carril = finCarriles.findIndex((fin) => fin <= b.inicio);
    if (carril === -1) {
      carril = finCarriles.length;
      finCarriles.push(b.fin);
    } else {
      finCarriles[carril] = b.fin;
    }
    grupo.push({ ...b, carril, carriles: 1 });
    finGrupo = Math.max(finGrupo, b.fin);
  }
  if (grupo.length > 0) cerrarGrupo();
  return resultado;
}

/**
 * Rango de horas a mostrar para un día: siempre al menos de 7:00 a 21:00 y
 * ampliado para que quepan todos los bloques. Devuelve horas enteras [desde, hasta].
 */
export function rangoHorasDia(bloques: readonly { inicio: string; fin: string }[], base: [number, number] = [7, 21]): [number, number] {
  let [desde, hasta] = base;
  for (const b of bloques) {
    desde = Math.min(desde, Math.floor(horaAMinutos(b.inicio) / 60));
    hasta = Math.max(hasta, Math.ceil(horaAMinutos(b.fin) / 60));
  }
  return [desde, Math.min(hasta, 24)];
}
