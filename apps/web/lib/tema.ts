/**
 * Tema de color elegido por el usuario. Se guarda en localStorage (es una
 * preferencia de este navegador) y se aplica como data-tema en <html>.
 */
export type Tema = "sistema" | "claro" | "oscuro";

export const CLAVE_TEMA = "diarco-tema";

export function leerTema(): Tema {
  try {
    const valor = localStorage.getItem(CLAVE_TEMA);
    return valor === "claro" || valor === "oscuro" ? valor : "sistema";
  } catch {
    return "sistema"; // modo privado o almacenamiento bloqueado
  }
}

export function aplicarTema(tema: Tema) {
  try {
    if (tema === "sistema") localStorage.removeItem(CLAVE_TEMA);
    else localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    // Si no se puede guardar, al menos se aplica en esta visita.
  }
  if (tema === "sistema") delete document.documentElement.dataset.tema;
  else document.documentElement.dataset.tema = tema;
}

/** Script que corre antes de pintar la página para evitar un destello del tema equivocado. */
export const SCRIPT_TEMA = `try{var t=localStorage.getItem("${CLAVE_TEMA}");if(t==="claro"||t==="oscuro")document.documentElement.dataset.tema=t}catch(e){}`;
