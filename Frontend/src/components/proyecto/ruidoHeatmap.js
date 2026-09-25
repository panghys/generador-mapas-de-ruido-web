import { NIVELES_RUIDO, obtenerColorRuido } from "./nivelesRuido.js";
import { calcularRuidoLocal } from "./ruidoLocal.js";

const METROS_POR_GRADO_LATITUD = 110540;
const METROS_POR_GRADO_LONGITUD = 111320;
const MAX_CELDAS_RUIDO = 5000;
const NIVEL_MINIMO_VISIBLE = 45;

const proyectar = ([longitud, latitud], referencia) => [
  longitud * METROS_POR_GRADO_LONGITUD * referencia.factorLongitud,
  latitud * METROS_POR_GRADO_LATITUD,
];

const desproyectar = ([x, y], referencia) => [
  x / (METROS_POR_GRADO_LONGITUD * referencia.factorLongitud),
  y / METROS_POR_GRADO_LATITUD,
];

const puntoEnAnillo = ([x, y], puntos) => {
  let dentro = false;

  for (let actual = 0, anterior = puntos.length - 1; actual < puntos.length; anterior = actual++) {
    const [x1, y1] = puntos[actual];
    const [x2, y2] = puntos[anterior];
    const cruza = (y1 > y) !== (y2 > y) && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1;
    if (cruza) dentro = !dentro;
  }

  return dentro;
};

const puntoDentroDeZona = (punto, anillosProyectados) =>
  Boolean(anillosProyectados.length) &&
  puntoEnAnillo(punto, anillosProyectados[0]) &&
  !anillosProyectados.slice(1).some((hueco) => puntoEnAnillo(punto, hueco));

const distanciaAlSegmento = (punto, inicio, fin) => {
  const dx = fin[0] - inicio[0];
  const dy = fin[1] - inicio[1];
  const longitudCuadrada = dx * dx + dy * dy;
  if (!longitudCuadrada) return Math.hypot(punto[0] - inicio[0], punto[1] - inicio[1]);

  const proporcion = Math.max(
    0,
    Math.min(1, ((punto[0] - inicio[0]) * dx + (punto[1] - inicio[1]) * dy) / longitudCuadrada)
  );
  return Math.hypot(
    punto[0] - (inicio[0] + proporcion * dx),
    punto[1] - (inicio[1] + proporcion * dy)
  );
};

const fuentesDeRuido = (calles, referencia) =>
  calles.flatMap((calle) => {
    const nivel = calcularRuidoLocal(
      {
        pequeños: calle.trafico_vehiculos_pequenos,
        medianos: calle.trafico_vehiculos_medianos,
        grandes: calle.trafico_vehiculos_grandes,
      },
      calle.velocidadPromedio ?? 50,
      calle.tipoSuperficie || "asfalto_no_ranurado",
      calle.periodoConteo || "15_minutos"
    );
    const coordenadas = calle.trazo_calle?.coordinates;
    if (!Number.isFinite(nivel) || nivel <= 0 || !Array.isArray(coordenadas)) return [];

    const puntos = coordenadas
      .filter((coordenada) => coordenada.length >= 2 && coordenada.every(Number.isFinite))
      .map((coordenada) => proyectar(coordenada, referencia));
    if (puntos.length < 2) return [];

    return [{
      nivel,
      segmentos: puntos.slice(1).map((punto, indice) => ({
        inicio: puntos[indice],
        fin: punto,
      })),
    }];
  });

export function crearCeldasMapaRuido(calles, zona, maxCeldas = MAX_CELDAS_RUIDO) {
  const anillos = zona?.type === "Polygon" ? zona.coordinates : null;
  if (!anillos?.[0]?.length || !Array.isArray(calles) || calles.length === 0) return [];

  const latitudMedia =
    anillos[0].reduce((suma, [, latitud]) => suma + latitud, 0) / anillos[0].length;
  const referencia = {
    factorLongitud: Math.max(Math.abs(Math.cos((latitudMedia * Math.PI) / 180)), 0.01),
  };
  const anillosProyectados = anillos.map((anillo) =>
    anillo.map((coordenada) => proyectar(coordenada, referencia))
  );
  const vertices = anillosProyectados[0];
  const minX = Math.min(...vertices.map(([x]) => x));
  const maxX = Math.max(...vertices.map(([x]) => x));
  const minY = Math.min(...vertices.map(([, y]) => y));
  const maxY = Math.max(...vertices.map(([, y]) => y));
  const area = Math.max(0, (maxX - minX) * (maxY - minY));
  if (!area) return [];

  const columnasIniciales = Math.max(1, Math.ceil(Math.sqrt(maxCeldas * ((maxX - minX) / (maxY - minY)))));
  const filasIniciales = Math.max(1, Math.ceil(maxCeldas / columnasIniciales));
  let tamanoCelda = Math.max(
    5,
    (Math.max(maxX - minX, maxY - minY) / Math.max(columnasIniciales, filasIniciales)) * 1.5
  );
  while (Math.ceil((maxX - minX) / tamanoCelda) * Math.ceil((maxY - minY) / tamanoCelda) > maxCeldas) {
    tamanoCelda *= 1.05;
  }

  const fuentes = fuentesDeRuido(calles, referencia);
  if (!fuentes.length) return [];

  const celdasPorColor = new Map(NIVELES_RUIDO.map(({ color }) => [color, []]));
  const filas = Math.ceil((maxY - minY) / tamanoCelda);
  const columnas = Math.ceil((maxX - minX) / tamanoCelda);

  for (let fila = 0; fila < filas; fila += 1) {
    for (let columna = 0; columna < columnas; columna += 1) {
      const x = minX + (columna + 0.5) * tamanoCelda;
      const y = minY + (fila + 0.5) * tamanoCelda;
      if (!puntoDentroDeZona([x, y], anillosProyectados)) continue;

      let energiaAcumulada = 0;
      for (const fuente of fuentes) {
        const distancia = Math.max(
          1,
          Math.min(
            ...fuente.segmentos.map(({ inicio, fin }) =>
              distanciaAlSegmento([x, y], inicio, fin)
            )
          )
        );
        const nivelEnCelda = fuente.nivel - 10 * Math.log10(distancia / 25);
        energiaAcumulada += 10 ** (nivelEnCelda / 10);
      }

      if (!energiaAcumulada) continue;
      const nivelTotal = 10 * Math.log10(energiaAcumulada);
      if (nivelTotal < NIVEL_MINIMO_VISIBLE) continue;

      const color = obtenerColorRuido(nivelTotal).color;
      const esquinaSuroeste = desproyectar([x - tamanoCelda / 2, y - tamanoCelda / 2], referencia);
      const esquinaNoreste = desproyectar([x + tamanoCelda / 2, y + tamanoCelda / 2], referencia);
      celdasPorColor.get(color).push([
        [
          [esquinaSuroeste[0], esquinaSuroeste[1]],
          [esquinaNoreste[0], esquinaSuroeste[1]],
          [esquinaNoreste[0], esquinaNoreste[1]],
          [esquinaSuroeste[0], esquinaNoreste[1]],
          [esquinaSuroeste[0], esquinaSuroeste[1]],
        ],
      ]);
    }
  }

  return NIVELES_RUIDO.flatMap(({ color }) => {
    const coordenadas = celdasPorColor.get(color);
    if (!coordenadas.length) return [];
    return [
      {
        type: "Feature",
        properties: { color },
        geometry: { type: "MultiPolygon", coordinates: coordenadas },
      },
    ];
  });
}
