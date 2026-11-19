/** Zona horaria por defecto de los usuarios. Las fechas nunca se calculan en UTC del servidor. */
export const ZONA_HORARIA_POR_DEFECTO = "America/Lima";

/** Protectores de racha por semana si el perfil no indica otro valor. */
export const PROTECTORES_POR_DEFECTO = 1;

/** Porcentaje mínimo de hábitos programados cumplidos para contar un día en la racha general. */
export const UMBRAL_RACHA_GENERAL = 0.7;

/** Rachas que disparan un aviso al usuario. */
export const HITOS_RACHA = [3, 7, 21, 30, 100] as const;

/** Colores de marca. */
export const COLORES = {
  mandarina: "#ff6a2b",
  violeta: "#6741d9",
} as const;
