/** Zona horaria por defecto de los usuarios. Las fechas nunca se calculan en UTC del servidor. */
export const ZONA_HORARIA_POR_DEFECTO = "America/Lima";

/** Protectores de racha por semana si el perfil no indica otro valor. */
export const PROTECTORES_POR_DEFECTO = 1;

/** Porcentaje mínimo de hábitos programados cumplidos para contar un día en la racha general. */
export const UMBRAL_RACHA_GENERAL = 0.7;

/** Rachas que disparan un aviso al usuario. */
export const HITOS_RACHA = [3, 7, 21, 30, 100] as const;

/** Hábitos sugeridos para la primera experiencia (bienvenida con Chispa). */
export const SUGERENCIAS_HABITOS = [
  { nombre: "Tomar agua", icono: "💧", color: "#2f9ff0", meta: "8 vasos al día" },
  { nombre: "Leer", icono: "📚", color: "#6741d9", meta: "10 páginas" },
  { nombre: "Caminar", icono: "🏃", color: "#ff6a2b", meta: "20 minutos" },
  { nombre: "Meditar", icono: "🧘", color: "#17a362", meta: "5 minutos" },
  { nombre: "Dormir temprano", icono: "😴", color: "#7c6f99", meta: "Antes de las 11 p. m." },
  { nombre: "Comer fruta", icono: "🥗", color: "#ffb020", meta: "2 porciones" },
  { nombre: "Escribir", icono: "✍️", color: "#ff5fa2", meta: "Una página del diario" },
  { nombre: "Ordenar", icono: "🧹", color: "#0c8599", meta: "10 minutos" },
] as const;

/** Máximo de sugerencias que se pueden elegir de una vez (empezar pequeño). */
export const MAX_SUGERENCIAS = 3;

/** Colores de marca. */
export const COLORES = {
  mandarina: "#ff6a2b",
  violeta: "#6741d9",
} as const;
