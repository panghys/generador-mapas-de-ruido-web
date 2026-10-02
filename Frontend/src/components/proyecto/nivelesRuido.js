/**
 * Estándar DIN 18005-2 / ISO 9613-2 para mapas estratégicos de ruido.
 */

export const NIVEL_CORTE_DB = 45;
export const NIVEL_MAXIMO_ESCALA_DB = 80;

export const PARADAS_COLOR_RUIDO = [
  { nivel: 45, color: "#2e7d32" }, // Verde bosque oscuro (umbral corte)
  { nivel: 50, color: "#4caf50" }, // Verde brillante
  { nivel: 55, color: "#cddc39" }, // Lima / Amarillo verdoso
  { nivel: 60, color: "#ffeb3b" }, // Amarillo puro
  { nivel: 65, color: "#ff9800" }, // Naranja fuego
  { nivel: 70, color: "#f44336" }, // Rojo vivo
  { nivel: 75, color: "#b71c1c" }, // Rojo sangre oscuro
  { nivel: 80, color: "#4a148c" }, // Púrpura profundo (eje máximo)
];

/**
 * Categorías discretas para tooltips, leyendas y modales.
 */
export function obtenerColorRuido(dBA) {
  if (dBA <= 55) return { color: "#66bd63", etiqueta: "Bajo", rango: "≤55 dB" };
  if (dBA <= 60) return { color: "#fee08b", etiqueta: "Moderado", rango: "55-60 dB" };
  if (dBA <= 65) return { color: "#fdae61", etiqueta: "Alto", rango: "60-65 dB" };
  if (dBA <= 70) return { color: "#d73027", etiqueta: "Muy alto", rango: "65-70 dB" };
  return { color: "#49006a", etiqueta: "Crítico", rango: ">70 dB" };
}

export const NIVELES_RUIDO = [
  { color: "#66bd63", etiqueta: "Bajo", rango: "≤55 dB(A)" },
  { color: "#fee08b", etiqueta: "Moderado", rango: "55-60 dB(A)" },
  { color: "#fdae61", etiqueta: "Alto", rango: "60-65 dB(A)" },
  { color: "#d73027", etiqueta: "Muy alto", rango: "65-70 dB(A)" },
  { color: "#49006a", etiqueta: "Crítico", rango: ">70 dB(A)" },
];