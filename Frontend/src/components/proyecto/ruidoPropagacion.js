import { NIVEL_CORTE_DB } from "./nivelesRuido.js";
import { calcularRuidoLocal } from "./ruidoLocal.js";

/**
 * Propagación acústica RLS-90 calibrada para entorno urbano con suma energética.
 *
 *   D_S(d)       = 15.8 - 10·log10(d) - 1.1·(log10(d))² - k_urbano·(d - d_min)
 *   L_k(x, y)    = L_m,k(25) + D_S(d_k(x, y))
 *   energiaTotal = Σ_k 10^(L_k / 10)
 *   L_total      = 10·log10(energiaTotal)
 */

/** Ancho efectivo de semicalzada en metros (evita singularidad extrema en el asfalto). */
export const DISTANCIA_MINIMA_METROS = 3;

/**
 * Coeficiente de atenuación por dispersión urbana y apantallamiento (dB/m).
 * Permite que a 80-120 m el nivel caiga al rango verde/transparente,
 * definiendo las isófonas concéntricas dentro de las manzanas.
 */
export const COEFICIENTE_ATENUACION_URBANA = 0.085;

/** Margen por debajo del nivel de corte para considerar suma lejana. */
const MARGEN_CALCULO_DB = 4;

const METROS_POR_GRADO_LATITUD = 110540;
const METROS_POR_GRADO_LONGITUD = 111320;

/** D_S(d) en dB considerando geometría RLS-90 y obstáculos urbanos. */
export const calcularAtenuacionDistancia = (distanciaMetros) => {
  const d = Math.max(distanciaMetros, DISTANCIA_MINIMA_METROS);
  const logaritmo = Math.log10(d);
  const dsGeometrico = 15.8 - 10 * logaritmo - 1.1 * logaritmo * logaritmo;
  const atenuacionObstaculos = COEFICIENTE_ATENUACION_URBANA * (d - DISTANCIA_MINIMA_METROS);
  return dsGeometrico - atenuacionObstaculos;
};

/** L_A(d) = L_m(25) + D_S(d). */
export const calcularNivelPorDistancia = (nivelEmision25, distanciaMetros) =>
  nivelEmision25 + calcularAtenuacionDistancia(distanciaMetros);

/**
 * Calcula con precisión métrica el radio de alcance (m) hasta el nivel objetivo
 * mediante búsqueda binaria monotónica.
 */
export const calcularAlcanceMetros = (nivelEmision25, nivelObjetivo) => {
  if (calcularNivelPorDistancia(nivelEmision25, DISTANCIA_MINIMA_METROS) <= nivelObjetivo) {
    return 0;
  }
  let bajo = DISTANCIA_MINIMA_METROS;
  let alto = 500;

  for (let i = 0; i < 16; i += 1) {
    const medio = (bajo + alto) / 2;
    if (calcularNivelPorDistancia(nivelEmision25, medio) > nivelObjetivo) {
      bajo = medio;
    } else {
      alto = medio;
    }
  }
  return alto;
};

/** Energía relativa: 10^(L/10). */
export const nivelAEnergia = (nivelDb) => 10 ** (nivelDb / 10);

/** Nivel a partir de energía: 10·log10(E). */
export const energiaANivel = (energia) => (energia > 0 ? 10 * Math.log10(energia) : -Infinity);

/** L_total = 10·log10(Σ 10^(L_i/10)). */
export const sumarNivelesEnergeticamente = (niveles) => {
  let energia = 0;
  for (const nivel of niveles) energia += nivelAEnergia(nivel);
  return energiaANivel(energia);
};

/** Nivel de emisión L_m(25) a partir de tráfico y velocidad. */
export const obtenerNivelEmisionCalle = (calle) => {
  const local = calcularRuidoLocal(
    {
      pequeños: calle.trafico_vehiculos_pequenos,
      medianos: calle.trafico_vehiculos_medianos,
      grandes: calle.trafico_vehiculos_grandes,
    },
    calle.velocidadPromedio ?? 50,
    calle.tipoSuperficie || "asfalto_no_ranurado",
    calle.periodoConteo || "15_minutos"
  );
  if (Number.isFinite(local) && local > 0) return local;

  const guardado = Number(calle.nivelRuidoCalculado);
  return Number.isFinite(guardado) && guardado > 0 ? guardado : null;
};

/** Proyección equirectangular local. */
export const crearProyeccionLocal = (lat0, lng0) => {
  const metrosPorGradoX = METROS_POR_GRADO_LONGITUD * Math.cos((lat0 * Math.PI) / 180);
  return {
    lat0,
    lng0,
    metrosPorGradoX,
    metrosPorGradoY: METROS_POR_GRADO_LATITUD,
    xDesdeLng: (lng) => (lng - lng0) * metrosPorGradoX,
    yDesdeLat: (lat) => (lat - lat0) * METROS_POR_GRADO_LATITUD,
  };
};

/** Origen centrado en el bounding box de las calles. */
export const crearProyeccionParaCalles = (calles) => {
  let latMin = Infinity;
  let latMax = -Infinity;
  let lngMin = Infinity;
  let lngMax = -Infinity;

  for (const calle of calles) {
    for (const [lat, lng] of calle.latlngs) {
      if (lat < latMin) latMin = lat;
      if (lat > latMax) latMax = lat;
      if (lng < lngMin) lngMin = lng;
      if (lng > lngMax) lngMax = lng;
    }
  }

  if (!Number.isFinite(latMin)) return crearProyeccionLocal(0, 0);
  return crearProyeccionLocal((latMin + latMax) / 2, (lngMin + lngMax) / 2);
};

/** Prepara las fuentes con su radio de influencia optimizado. */
export const prepararFuentes = (calles, proyeccion) => {
  const fuentes = [];

  for (const calle of calles) {
    const { latlngs, nivel } = calle;
    if (!Array.isArray(latlngs) || latlngs.length < 2) continue;
    if (!Number.isFinite(nivel) || nivel <= 0) continue;

    const alcance = calcularAlcanceMetros(nivel, NIVEL_CORTE_DB - MARGEN_CALCULO_DB);
    if (alcance <= 0) continue;

    const segmentos = new Float64Array((latlngs.length - 1) * 4);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < latlngs.length - 1; i += 1) {
      const ax = proyeccion.xDesdeLng(latlngs[i][1]);
      const ay = proyeccion.yDesdeLat(latlngs[i][0]);
      const bx = proyeccion.xDesdeLng(latlngs[i + 1][1]);
      const by = proyeccion.yDesdeLat(latlngs[i + 1][0]);
      segmentos[i * 4] = ax;
      segmentos[i * 4 + 1] = ay;
      segmentos[i * 4 + 2] = bx;
      segmentos[i * 4 + 3] = by;
      minX = Math.min(minX, ax, bx);
      minY = Math.min(minY, ay, by);
      maxX = Math.max(maxX, ax, bx);
      maxY = Math.max(maxY, ay, by);
    }

    fuentes.push({
      nivel,
      segmentos,
      alcance,
      alcanceCuadrado: alcance * alcance,
      minX: minX - alcance,
      minY: minY - alcance,
      maxX: maxX + alcance,
      maxY: maxY + alcance,
    });
  }

  return fuentes;
};

/** Distancia ortogonal cuadrática mínima a los segmentos de una calle. */
export const distanciaMinimaCuadrada = (px, py, segmentos) => {
  let mejor = Infinity;

  for (let i = 0; i < segmentos.length; i += 4) {
    const ax = segmentos[i];
    const ay = segmentos[i + 1];
    const dx = segmentos[i + 2] - ax;
    const dy = segmentos[i + 3] - ay;
    const largoCuadrado = dx * dx + dy * dy;

    let t = largoCuadrado > 0 ? ((px - ax) * dx + (py - ay) * dy) / largoCuadrado : 0;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;

    const ex = px - (ax + t * dx);
    const ey = py - (ay + t * dy);
    const distancia = ex * ex + ey * ey;
    if (distancia < mejor) mejor = distancia;
  }

  return mejor;
};

/** L_total en un punto con suma energética entre fuentes distintas. */
export const calcularNivelEnPunto = (px, py, fuentes) => {
  let energia = 0;

  for (const fuente of fuentes) {
    if (px < fuente.minX || px > fuente.maxX || py < fuente.minY || py > fuente.maxY) continue;

    const distanciaCuadrada = distanciaMinimaCuadrada(px, py, fuente.segmentos);
    if (distanciaCuadrada > fuente.alcanceCuadrado) continue;

    energia += nivelAEnergia(calcularNivelPorDistancia(fuente.nivel, Math.sqrt(distanciaCuadrada)));
  }

  return energiaANivel(energia);
};

/** Buffer escalar de energía acumulada. */
export const calcularGrillaEnergia = (fuentes, xs, ys) => {
  const columnas = xs.length;
  const filas = ys.length;
  const energia = new Float64Array(columnas * filas);
  if (fuentes.length === 0 || columnas === 0 || filas === 0) return energia;

  for (const fuente of fuentes) {
    for (let j = 0; j < filas; j += 1) {
      const py = ys[j];
      if (py < fuente.minY || py > fuente.maxY) continue;

      const base = j * columnas;
      for (let i = 0; i < columnas; i += 1) {
        const px = xs[i];
        if (px < fuente.minX || px > fuente.maxX) continue;

        const distanciaCuadrada = distanciaMinimaCuadrada(px, py, fuente.segmentos);
        if (distanciaCuadrada > fuente.alcanceCuadrado) continue;

        const nivelK = calcularNivelPorDistancia(fuente.nivel, Math.sqrt(distanciaCuadrada));
        energia[base + i] += nivelAEnergia(nivelK);
      }
    }
  }

  return energia;
};

/** Conversión logarítmica a decibeles. */
export const convertirEnergiaANiveles = (energia) => {
  const niveles = new Float32Array(energia.length);
  for (let k = 0; k < energia.length; k += 1) niveles[k] = energiaANivel(energia[k]);
  return niveles;
};

/** Wrapper directo. */
export const calcularGrillaNiveles = (fuentes, xs, ys) =>
  convertirEnergiaANiveles(calcularGrillaEnergia(fuentes, xs, ys));