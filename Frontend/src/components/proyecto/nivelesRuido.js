export const NIVEL_CORTE_DB = 45;
export const NIVEL_MAXIMO_ESCALA_DB = 80;

export const PARADAS_COLOR_RUIDO = [
  { nivel: 45, color: "#2e7d32" },
  { nivel: 50, color: "#4caf50" },
  { nivel: 55, color: "#cddc39" },
  { nivel: 60, color: "#ffeb3b" },
  { nivel: 65, color: "#ff9800" }, 
  { nivel: 70, color: "#f44336" }, 
  { nivel: 75, color: "#b71c1c" }, 
  { nivel: 80, color: "#4a148c" }, 
];
export const ANCHO_BANDA_DB = 5;
export const NIVELES_RUIDO = PARADAS_COLOR_RUIDO.map(({ nivel, color }, indice, paradas) => {
  const esUltima = indice === paradas.length - 1;
  return {
    color,
    desde: nivel,
    hasta: esUltima ? null : paradas[indice + 1].nivel,
    rango: esUltima ? `≥ ${nivel}` : `${nivel} – ${paradas[indice + 1].nivel}`,
  };
});
export function obtenerColorRuido(dBA) {
  const indice = Math.floor((dBA - NIVEL_CORTE_DB) / ANCHO_BANDA_DB);
  const acotado = Math.min(NIVELES_RUIDO.length - 1, Math.max(0, indice));
  return NIVELES_RUIDO[acotado];
}
