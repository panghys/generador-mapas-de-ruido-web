export const BANDAS_HZ = [63, 125, 250, 500, 1000, 2000, 4000, 8000];

export const VELOCIDAD_REFERENCIA_KMH = 70;

export const PONDERACION_A_DB = [-26.2, -16.1, -8.6, -3.2, 0, 1.2, 1.0, -1.1];

export const ABSORCION_ATMOSFERICA_DB_KM = [0.1, 0.4, 1.0, 1.9, 3.7, 9.7, 32.8, 117];

export const CORRECCION_DIVERGENCIA_LINEA_DB = 3;

export const DISTANCIA_MINIMA_CNOSSOS_METROS = 3;

const COEFICIENTES = {
  livianos: {
    Ar: [79.9, 85.7, 84.5, 90.2, 97.3, 93.9, 84.1, 74.3],
    Br: [30, 41.5, 38.9, 25.7, 32.5, 37.2, 39, 40],
    Ap: [94.5, 89.2, 88, 85.9, 84.2, 86.9, 83.3, 76.1],
    Bp: [-1.3, 7.2, 7.7, 8, 8, 8, 8, 8],
  },
  medianos: {
    Ar: [84, 88.7, 91.5, 96.7, 97.4, 90.9, 83.3, 80.5],
    Br: [30, 35.8, 32.6, 23.8, 30.1, 36.2, 38.3, 40.1],
    Ap: [101, 96.5, 98.8, 96.8, 98.6, 95.2, 88.8, 82.7],
    Bp: [-1.9, 4.7, 6.4, 6.5, 6.5, 6.5, 6.5, 6.5],
  },
  pesados: {
    Ar: [87, 91.7, 94.1, 100.7, 100.8, 94.3, 87.1, 82.5],
    Br: [30, 33.5, 31.3, 25.4, 31.8, 37.1, 38.6, 40.6],
    Ap: [104.4, 100.6, 101.7, 101, 100.1, 95.9, 91.3, 85.3],
    Bp: [0, 3, 4.6, 5, 5, 5, 5, 5],
  },
  motos: {
    Ar: [0, 0, 0, 0, 0, 0, 0, 0],
    Br: [0, 0, 0, 0, 0, 0, 0, 0],
    Ap: [95, 97.2, 92.7, 92.9, 94.7, 93.2, 90.1, 86.5],
    Bp: [3.2, 5.9, 11.9, 11.6, 11.5, 12.6, 11.1, 12],
  },
};

const sumaEnergetica = (a, b) => 10 * Math.log10(10 ** (0.1 * a) + 10 ** (0.1 * b));

const potenciaPorBanda = (coef, velocidad) => {
  const relacion = velocidad / VELOCIDAD_REFERENCIA_KMH;
  return BANDAS_HZ.map((_, i) => {
    const propulsion = coef.Ap[i] + coef.Bp[i] * ((velocidad - VELOCIDAD_REFERENCIA_KMH) / VELOCIDAD_REFERENCIA_KMH);
    const hayRodadura = coef.Ar[i] !== 0 || coef.Br[i] !== 0;
    if (!hayRodadura) return propulsion;
    const rodadura = coef.Ar[i] + coef.Br[i] * Math.log10(relacion);
    return sumaEnergetica(rodadura, propulsion);
  });
};

const factorHorario = (periodoConteo) => (periodoConteo === "15_minutos" ? 4 : 1);

export function calcularEmisionCNOSSOS(
  { livianos = 0, medianos = 0, pesados = 0, motos = 0 },
  velocidad = 50,
  periodoConteo = "15_minutos"
) {
  const v = Number(velocidad) > 0 ? Number(velocidad) : 50;
  const factor = factorHorario(periodoConteo);
  const categorias = [
    { coef: COEFICIENTES.livianos, flujo: (Number(livianos) || 0) * factor },
    { coef: COEFICIENTES.medianos, flujo: (Number(medianos) || 0) * factor },
    { coef: COEFICIENTES.pesados, flujo: (Number(pesados) || 0) * factor },
    { coef: COEFICIENTES.motos, flujo: (Number(motos) || 0) * factor },
  ];

  const energiaPorBanda = new Array(BANDAS_HZ.length).fill(0);

  for (const { coef, flujo } of categorias) {
    if (flujo <= 0) continue;
    const potencia = potenciaPorBanda(coef, v);
    const correccionFlujo = 10 * Math.log10(flujo / (1000 * v));
    for (let i = 0; i < BANDAS_HZ.length; i += 1) {
      const nivelA = potencia[i] + correccionFlujo + PONDERACION_A_DB[i];
      energiaPorBanda[i] += 10 ** (0.1 * nivelA);
    }
  }

  const energiaTotal = energiaPorBanda.reduce((acc, e) => acc + e, 0);
  if (energiaTotal <= 0) return null;

  return {
    bandasA: energiaPorBanda.map((e) => (e > 0 ? 10 * Math.log10(e) : -Infinity)),
    potenciaLineaDBA: 10 * Math.log10(energiaTotal),
  };
}

export function nivelCNOSSOSADistancia(bandasA, distanciaMetros) {
  const d = Math.max(distanciaMetros, DISTANCIA_MINIMA_CNOSSOS_METROS);
  const divergencia = 10 * Math.log10(d) + CORRECCION_DIVERGENCIA_LINEA_DB;
  let energia = 0;
  for (let i = 0; i < BANDAS_HZ.length; i += 1) {
    if (!Number.isFinite(bandasA[i])) continue;
    const atmosfera = (ABSORCION_ATMOSFERICA_DB_KM[i] * d) / 1000;
    energia += 10 ** (0.1 * (bandasA[i] - divergencia - atmosfera));
  }
  return energia > 0 ? 10 * Math.log10(energia) : -Infinity;
}

export function calcularNivelCNOSSOS25m(datosTrafico, velocidad, periodoConteo) {
  const emision = calcularEmisionCNOSSOS(datosTrafico, velocidad, periodoConteo);
  if (!emision) return null;
  const nivel = nivelCNOSSOSADistancia(emision.bandasA, 25);
  return Number.isFinite(nivel) ? Math.round(nivel * 10) / 10 : null;
}

export const PASO_TABLA_METROS = 0.5;
export const ALCANCE_MAXIMO_TABLA_METROS = 1500;

export function construirTablaNivelDistancia(bandasA, nivelObjetivo) {
  const maximoPasos = Math.ceil(ALCANCE_MAXIMO_TABLA_METROS / PASO_TABLA_METROS);
  const valores = new Float32Array(maximoPasos + 1);
  let alcance = 0;

  for (let k = 0; k <= maximoPasos; k += 1) {
    const d = k * PASO_TABLA_METROS;
    const nivel = nivelCNOSSOSADistancia(bandasA, d);
    valores[k] = nivel;
    if (nivel > nivelObjetivo) alcance = d;
  }

  return { valores, alcance: alcance > 0 ? Math.min(alcance + PASO_TABLA_METROS, ALCANCE_MAXIMO_TABLA_METROS) : 0 };
}

export function leerTablaNivelDistancia(valores, distanciaMetros) {
  const posicion = Math.max(distanciaMetros, DISTANCIA_MINIMA_CNOSSOS_METROS) / PASO_TABLA_METROS;
  const base = Math.floor(posicion);
  if (base >= valores.length - 1) return valores[valores.length - 1];
  const fraccion = posicion - base;
  return valores[base] + (valores[base + 1] - valores[base]) * fraccion;
}
