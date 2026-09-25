/**
 * Retorna nivel de ruido y color según dB(A)
 * Basado en estándar DIN 18005
 */
export function obtenerColorRuido(dBA) {
  if (dBA <= 55) return { color: "#22c55e", etiqueta: "Bajo", rango: "≤55 dB" };
  if (dBA <= 60) return { color: "#eab308", etiqueta: "Moderado", rango: "55-60 dB" };
  if (dBA <= 65) return { color: "#f97316", etiqueta: "Alto", rango: "60-65 dB" };
  if (dBA <= 70) return { color: "#ef4444", etiqueta: "Muy alto", rango: "65-70 dB" };
  return { color: "#7c3aed", etiqueta: "Crítico", rango: ">70 dB" };
}

export const NIVELES_RUIDO = [
  { color: "#22c55e", etiqueta: "Bajo", rango: "≤55 dB(A)" },
  { color: "#eab308", etiqueta: "Moderado", rango: "55-60 dB(A)" },
  { color: "#f97316", etiqueta: "Alto", rango: "60-65 dB(A)" },
  { color: "#ef4444", etiqueta: "Muy alto", rango: "65-70 dB(A)" },
  { color: "#7c3aed", etiqueta: "Crítico", rango: ">70 dB(A)" },
];