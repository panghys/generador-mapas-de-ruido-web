/**
 * Valida los parámetros requeridos para el cálculo de ruido
 * @param {Object} params - Parámetros de tráfico y vía
 * @returns {Object} { esValido: boolean, errores: string[] }
 */
export function validarParametrosRuido(params) {
  const errores = [];

  if (!params || typeof params !== 'object') {
    errores.push("Los parámetros de entrada son requeridos.");
    return { esValido: false, errores };
  }

  // Validar velocidad si está presente
  const velocidad = params.velocidad ?? params.velocidad_promedio ?? params.velocidadPromedio;
  if (velocidad !== undefined && (isNaN(velocidad) || Number(velocidad) <= 0)) {
    errores.push("La velocidad debe ser un número mayor a 0 km/h.");
  }
  if (
    params.periodoConteo !== undefined &&
    !["15_minutos", "por_hora"].includes(params.periodoConteo)
  ) {
    errores.push("El período del conteo debe ser 15_minutos o por_hora.");
  }

  // Validar valores de tráfico no negativos
  const camposTrafico = [
    'pequeños', 'medianos', 'grandes',
    'vehiculos_livianos', 'vehiculos_pesados', 'motos',
    'trafico_vehiculos_pequenos', 'trafico_vehiculos_medianos', 'trafico_vehiculos_grandes'
  ];

  for (const campo of camposTrafico) {
    if (params[campo] !== undefined && (isNaN(params[campo]) || Number(params[campo]) < 0)) {
      errores.push(`El valor para ${campo} no puede ser un número negativo.`);
    }
  }

  return {
    esValido: errores.length === 0,
    errores,
  };
}

/**
 * Calcula el nivel de ruido según RLS-90
 * @param {Object} datosTrafico - {pequeños, medianos, grandes} o {vehiculos_livianos, vehiculos_pesados, motos}
 * @param {number} velocidad - km/h
 * @param {string} tipoSuperf - tipo de carpeta/pavimento
 * @param {number} distancia - metros de la fuente (default 25m)
 * @returns {number} Nivel de ruido en dB(A)
 */
export function calcularRuidoRLS90(
  datosTrafico,
  velocidad = 50,
  tipoSuperf = "asfalto_no_ranurado",
  distancia = 25,
  periodoConteo = "15_minutos"
) {
  // Soportar tanto formato español tradicional como las columnas de base de datos
  const livianos = Number(datosTrafico?.pequeños ?? datosTrafico?.vehiculos_livianos ?? datosTrafico?.trafico_vehiculos_pequenos ?? 0);
  const medianos = Number(datosTrafico?.medianos ?? datosTrafico?.trafico_vehiculos_medianos ?? 0);
  const pesadosCount = Number(datosTrafico?.grandes ?? datosTrafico?.vehiculos_pesados ?? datosTrafico?.trafico_vehiculos_grandes ?? 0);
  const motos = Number(datosTrafico?.motos ?? 0);

  // RLS-90 requiere el flujo horario de vehículos.
  const factorHorario = periodoConteo === "15_minutos" ? 4 : 1;
  const M = (livianos + medianos + pesadosCount + motos) * factorHorario;
  if (M <= 0) return 0;

  // 2. Calcular proporción de vehículos pesados en porcentaje.
  const pesados = medianos + pesadosCount;
  const p = Math.min(100, Math.max(0, (pesados / (M / factorHorario)) * 100));

  // 3. Nivel de emisión de referencia a 25 m según el flujo y la fracción pesada.
  const Lm25 = 37.3 + 10 * Math.log10(M * (1 + 0.082 * p));

  // 4. Corrección por velocidad (DV)
  const velNum = Number(velocidad) > 0 ? Number(velocidad) : 50;
  const DV = velNum !== 50 ? 10 * Math.log10(velNum / 50) : 0;

  // 5. Corrección por tipo de superficie (DStrO)
  const DStrO = obtenerCorreccionSuperf(tipoSuperf, velNum);

  // 6. Corrección por distancia si es distinta a 25 m.
  const distNum = Number(distancia) > 0 ? Number(distancia) : 25;
  const DS = distNum !== 25 ? -10 * Math.log10(distNum / 25) : 0;

  // 7. Cálculo final
  const Lr = Lm25 + DV + DStrO + DS;

  return Math.round(Lr * 10) / 10; // Redondear a 1 decimal
}

/**
 * Retorna corrección por tipo de superficie según RLS-90
 */
function obtenerCorreccionSuperf(tipo, velocidad) {
  const correcciones = {
    'asfalto_estandar': { 30: 0, 40: 0, 50: 0, 60: 0 },
    'asfalto_no_ranurado': { 30: 0, 40: 0, 50: 0, 60: 0 },
    'concreto_asfalto_rasurado': { 30: 1, 40: 1.5, 50: 2, 60: 2 },
    'pedregosa_lisa': { 30: 2, 40: 2.5, 50: 3, 60: 3 },
    'pedregosa_rugosa': { 30: 3, 40: 4.5, 50: 6, 60: 6 },
    'asfalto_hormigon': { 30: 0, 40: 0, 50: 0, 60: -2 },
    'asfalto_poroso_15_11': { 30: 0, 40: 0, 50: 0, 60: -4 },
    'asfalto_poroso_15_8': { 30: 0, 40: 0, 50: 0, 60: -5 },
  };

  const grupos = correcciones[tipo] || correcciones['asfalto_estandar'];

  const velocidades = Object.keys(grupos).map(Number).sort((a, b) => a - b);
  let velocidadBase = 50;

  for (let vel of velocidades) {
    if (velocidad <= vel) {
      velocidadBase = vel;
      break;
    }
  }

  return grupos[velocidadBase] || 0;
}