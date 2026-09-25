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
export function calcularRuidoRLS90(datosTrafico, velocidad = 50, tipoSuperf = 'asfalto_no_ranurado', distancia = 25) {
  // Soportar tanto formato español tradicional como las columnas de base de datos
  const livianos = Number(datosTrafico?.pequeños ?? datosTrafico?.vehiculos_livianos ?? datosTrafico?.trafico_vehiculos_pequenos ?? 0);
  const medianos = Number(datosTrafico?.medianos ?? datosTrafico?.trafico_vehiculos_medianos ?? 0);
  const pesadosCount = Number(datosTrafico?.grandes ?? datosTrafico?.vehiculos_pesados ?? datosTrafico?.trafico_vehiculos_grandes ?? 0);
  const motos = Number(datosTrafico?.motos ?? 0);

  // 1. Calcular flujo total (M)
  const M = livianos + medianos + pesadosCount + motos;
  if (M <= 0) return 0; // Sin tráfico, sin emisión base

  // 2. Calcular proporción de vehículos pesados (p)
  const pesados = medianos + pesadosCount;
  const p = Math.min(1, Math.max(0, pesados / M));

  // 3. Calcular Ls (nivel de fuente según RLS-90)
  const Lsl = 70; // Vehículos ligeros
  const Lsw = 75; // Vehículos pesados
  const ponderacion = p * Math.pow(10, Lsw / 10) + (1 - p) * Math.pow(10, Lsl / 10);
  const Ls = 37.3 + 10 * Math.log10(ponderacion > 0 ? ponderacion : 1);

  // 4. Calcular Lm(25) - nivel a 25 metros
  const Lm25 = Ls + 10 * Math.log10(M);

  // 5. Corrección por velocidad (DV)
  const velNum = Number(velocidad) > 0 ? Number(velocidad) : 50;
  const DV = velNum !== 50 ? 10 * Math.log10(velNum / 50) : 0;

  // 6. Corrección por tipo de superficie (DStrO)
  const DStrO = obtenerCorreccionSuperf(tipoSuperf, velNum);

  // 7. Corrección por distancia si es distinta a 25m (atenuación geométrica básica)
  const distNum = Number(distancia) > 0 ? Number(distancia) : 25;
  const DS = distNum !== 25 ? -10 * Math.log10(distNum / 25) : 0;

  // 8. Cálculo final
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