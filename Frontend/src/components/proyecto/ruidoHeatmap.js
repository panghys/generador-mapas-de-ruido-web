import buffer from "@turf/buffer";
import intersect from "@turf/intersect";
import { featureCollection, lineString, polygon } from "@turf/helpers";
import { NIVELES_RUIDO } from "./nivelesRuido.js";
import { calcularRuidoLocal } from "./ruidoLocal.js";

const DISTANCIA_REFERENCIA_METROS = 25;
const NIVEL_MINIMO_VISIBLE = 40;
const PASO_GRADIENTE_DB = 1;
const METROS_POR_GRADO_LATITUD = 110540;
const METROS_POR_GRADO_LONGITUD = 111320;

const coloresGradiente = [
  { nivel: 40, color: NIVELES_RUIDO[0].color },
  { nivel: 55, color: NIVELES_RUIDO[1].color },
  { nivel: 60, color: NIVELES_RUIDO[2].color },
  { nivel: 65, color: NIVELES_RUIDO[3].color },
  { nivel: 70, color: NIVELES_RUIDO[4].color },
];

const interpolarColor = (colorInicial, colorFinal, proporcion) => {
  const canales = [1, 3, 5].map((indice) => {
    const inicial = Number.parseInt(colorInicial.slice(indice, indice + 2), 16);
    const final = Number.parseInt(colorFinal.slice(indice, indice + 2), 16);
    return Math.round(inicial + (final - inicial) * proporcion);
  });

  return `#${canales.map((canal) => canal.toString(16).padStart(2, "0")).join("")}`;
};

const obtenerColorGradiente = (nivel) => {
  const indiceSuperior = coloresGradiente.findIndex((parada) => parada.nivel > nivel);
  if (indiceSuperior === -1) return coloresGradiente[coloresGradiente.length - 1].color;
  if (indiceSuperior === 0) return coloresGradiente[0].color;

  const inferior = coloresGradiente[indiceSuperior - 1];
  const superior = coloresGradiente[indiceSuperior];
  const proporcion = (nivel - inferior.nivel) / (superior.nivel - inferior.nivel);
  return interpolarColor(inferior.color, superior.color, proporcion);
};

const obtenerNivelCalle = (calle) =>
  calcularRuidoLocal(
    {
      pequeños: calle.trafico_vehiculos_pequenos,
      medianos: calle.trafico_vehiculos_medianos,
      grandes: calle.trafico_vehiculos_grandes,
    },
    calle.velocidadPromedio ?? 50,
    calle.tipoSuperficie || "asfalto_no_ranurado",
    calle.periodoConteo || "15_minutos"
  );

export const obtenerAlcanceRuidoMetros = (nivelFuente, nivelObjetivo) =>
  DISTANCIA_REFERENCIA_METROS * 10 ** ((nivelFuente - nivelObjetivo) / 10);

const obtenerExtensionMaximaZona = (coordenadasZona) => {
  const vertices = coordenadasZona.flat();
  const longitudes = vertices.map(([longitud]) => longitud);
  const latitudes = vertices.map(([, latitud]) => latitud);
  const latitudMedia = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
  const extensionEsteOeste =
    (Math.max(...longitudes) - Math.min(...longitudes)) *
    METROS_POR_GRADO_LONGITUD *
    Math.abs(Math.cos((latitudMedia * Math.PI) / 180));
  const extensionNorteSur =
    (Math.max(...latitudes) - Math.min(...latitudes)) * METROS_POR_GRADO_LATITUD;

  return Math.hypot(extensionEsteOeste, extensionNorteSur);
};

export function crearFranjasMapaRuido(calles, zona) {
  const coordenadasZona = zona?.type === "Polygon" ? zona.coordinates : null;
  if (!Array.isArray(calles) || calles.length === 0 || !coordenadasZona?.[0]?.length) return [];

  const capas = [];
  const areaProyecto = polygon(coordenadasZona);
  const extensionMaximaZona = obtenerExtensionMaximaZona(coordenadasZona);

  for (const calle of calles) {
    const nivel = obtenerNivelCalle(calle);
    const coordenadas = calle.trazo_calle?.coordinates;
    if (!Number.isFinite(nivel) || nivel <= 0 || !Array.isArray(coordenadas)) continue;
    if (coordenadas.length < 2) continue;

    const alcanceVisible = obtenerAlcanceRuidoMetros(nivel, NIVEL_MINIMO_VISIBLE);
    if (alcanceVisible < 1) continue;

    const linea = lineString(coordenadas);
    const nivelMaximoVisible = Math.min(
      85,
      nivel + 10 * Math.log10(DISTANCIA_REFERENCIA_METROS)
    );

    for (
      let nivelObjetivo = NIVEL_MINIMO_VISIBLE;
      nivelObjetivo <= nivelMaximoVisible;
      nivelObjetivo += PASO_GRADIENTE_DB
    ) {
      const alcance = Math.min(
        obtenerAlcanceRuidoMetros(nivel, nivelObjetivo),
        extensionMaximaZona
      );
      if (alcance < 1) continue;

      const area = buffer(linea, alcance, { units: "meters", steps: 12 });
      if (area) {
        const recorte = intersect(featureCollection([area, areaProyecto]));
        if (recorte) {
          capas.push({
            type: "Feature",
            properties: {
              nivel: nivelObjetivo,
              color: obtenerColorGradiente(nivelObjetivo),
              fillOpacity: 0.015 + ((nivelObjetivo - NIVEL_MINIMO_VISIBLE) / 45) * 0.17,
            },
            geometry: recorte.geometry,
          });
        }
      }
    }
  }

  return capas.sort((a, b) => a.properties.nivel - b.properties.nivel);
}
