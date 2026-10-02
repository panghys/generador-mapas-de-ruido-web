import L from "leaflet";
import { NIVEL_CORTE_DB, NIVEL_MAXIMO_ESCALA_DB, PARADAS_COLOR_RUIDO } from "./nivelesRuido.js";
import {
  calcularGrillaEnergia,
  convertirEnergiaANiveles,
  crearProyeccionParaCalles,
  prepararFuentes,
} from "./ruidoPropagacion.js";

const RESOLUCION_LUT_DB = 0.1;

const hexARgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

/** Tabla de colores RGB cada 0.1 dB entre NIVEL_CORTE_DB y NIVEL_MAXIMO_ESCALA_DB. */
const construirTablaColores = () => {
  const pasos = Math.round((NIVEL_MAXIMO_ESCALA_DB - NIVEL_CORTE_DB) / RESOLUCION_LUT_DB) + 1;
  const tabla = new Uint8ClampedArray(pasos * 3);
  const paradas = PARADAS_COLOR_RUIDO.map((parada) => ({
    nivel: parada.nivel,
    rgb: hexARgb(parada.color),
  }));

  for (let indice = 0; indice < pasos; indice += 1) {
    const nivel = NIVEL_CORTE_DB + indice * RESOLUCION_LUT_DB;
    let superior = paradas.findIndex((parada) => parada.nivel >= nivel);
    if (superior === -1) superior = paradas.length - 1;
    const inferior = Math.max(0, superior - 1);

    const a = paradas[inferior];
    const b = paradas[superior];
    const proporcion =
      b.nivel === a.nivel ? 0 : Math.min(1, Math.max(0, (nivel - a.nivel) / (b.nivel - a.nivel)));

    for (let canal = 0; canal < 3; canal += 1) {
      tabla[indice * 3 + canal] = Math.round(a.rgb[canal] + (b.rgb[canal] - a.rgb[canal]) * proporcion);
    }
  }

  return tabla;
};

const TABLA_COLORES = construirTablaColores();
const PASOS_TABLA = TABLA_COLORES.length / 3;

/**
 * Capa raster continua del mapa de ruido (RLS-90 / DIN 18005).
 */
const CapaRuidoRaster = L.Layer.extend({
  options: {
    pane: "superficieRuido",
    opacidad: 0.65, // Calibrado para dar viveza cromática sin tapar nombres de calles
    tamanoCeldaPx: 1,
    margenViewport: 0.25,
    maxCeldas: 500000,
  },

  initialize(datos, options) {
    L.setOptions(this, options);
    this._datos = datos || { calles: [], zona: null };
    this._prepararDatos();
  },

  setDatos(datos) {
    this._datos = datos || { calles: [], zona: null };
    this._prepararDatos();
    if (this._map) this._redibujar();
    return this;
  },

  setOpacidad(opacidad) {
    this.options.opacidad = opacidad;
    if (this._canvas) L.DomUtil.setOpacity(this._canvas, opacidad);
    return this;
  },

  _prepararDatos() {
    const calles = this._datos.calles || [];
    this._proyeccion = crearProyeccionParaCalles(calles);
    this._fuentes = prepararFuentes(calles, this._proyeccion);
  },

  onAdd(map) {
    const nombrePane = this.options.pane;
    if (!map.getPane(nombrePane)) map.createPane(nombrePane);

    const animado = map.options.zoomAnimation && L.Browser.any3d;
    this._canvas = L.DomUtil.create(
      "canvas",
      `leaflet-ruido-raster ${animado ? "leaflet-zoom-animated" : ""}`
    );
    this._canvas.style.pointerEvents = "none";
    L.DomUtil.setOpacity(this._canvas, this.options.opacidad);
    this.getPane().appendChild(this._canvas);

    this._buffer = document.createElement("canvas");
    this._redibujar();
  },

  onRemove() {
    L.DomUtil.remove(this._canvas);
    this._canvas = null;
    this._buffer = null;
  },

  getEvents() {
    const eventos = { moveend: this._redibujar };
    if (this._map.options.zoomAnimation && L.Browser.any3d) {
      eventos.zoomanim = this._animarZoom;
    }
    return eventos;
  },

  _animarZoom(evento) {
    if (!this._canvas || !this._nw) return;
    const escala = this._map.getZoomScale(evento.zoom, this._zoomDibujado);
    const desplazamiento = this._map._latLngToNewLayerPoint(this._nw, evento.zoom, evento.center);
    L.DomUtil.setTransform(this._canvas, desplazamiento, escala);
  },

  _redibujar() {
    const map = this._map;
    const canvas = this._canvas;
    if (!map || !canvas) return;

    const tamano = map.getSize();
    const margenX = Math.round(tamano.x * this.options.margenViewport);
    const margenY = Math.round(tamano.y * this.options.margenViewport);
    const ancho = tamano.x + margenX * 2;
    const alto = tamano.y + margenY * 2;

    let celda = this.options.tamanoCeldaPx;
    while ((ancho / celda) * (alto / celda) > this.options.maxCeldas) celda += 1;

    const columnas = Math.ceil(ancho / celda);
    const filas = Math.ceil(alto / celda);
    const anchoCanvas = columnas * celda;
    const altoCanvas = filas * celda;

    canvas.width = anchoCanvas;
    canvas.height = altoCanvas;
    canvas.style.width = `${anchoCanvas}px`;
    canvas.style.height = `${altoCanvas}px`;

    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([-margenX, -margenY]));
    this._zoomDibujado = map.getZoom();
    this._nw = map.containerPointToLatLng([-margenX, -margenY]);

    const contexto = canvas.getContext("2d");
    contexto.clearRect(0, 0, anchoCanvas, altoCanvas);
    if (this._fuentes.length === 0) return;

    const xs = new Float64Array(columnas);
    const ys = new Float64Array(filas);
    for (let i = 0; i < columnas; i += 1) {
      const lng = map.containerPointToLatLng([-margenX + (i + 0.5) * celda, 0]).lng;
      xs[i] = this._proyeccion.xDesdeLng(lng);
    }
    for (let j = 0; j < filas; j += 1) {
      const lat = map.containerPointToLatLng([0, -margenY + (j + 0.5) * celda]).lat;
      ys[j] = this._proyeccion.yDesdeLat(lat);
    }

    // Paso 1-2: Suma de energía pura
    const energia = calcularGrillaEnergia(this._fuentes, xs, ys);
    // Paso 3: Conversión logarítmica a decibeles
    const niveles = convertirEnergiaANiveles(energia);

    // Paso 4: Rasterizado con desvanecimiento alfa en umbral de corte
    const buffer = this._buffer;
    buffer.width = columnas;
    buffer.height = filas;
    const contextoBuffer = buffer.getContext("2d");
    const imagen = contextoBuffer.createImageData(columnas, filas);
    const pixeles = imagen.data;

    for (let k = 0; k < niveles.length; k += 1) {
      const nivel = niveles[k];
      if (!(nivel >= NIVEL_CORTE_DB)) continue;

      // Cuantiza en bandas normativas de 5 dB: 45, 50, 55, 60, 65, 70, 75...
      const nivelBanda = Math.floor(nivel / 5) * 5;
      const indice = Math.min(
        PASOS_TABLA - 1,
        Math.max(0, Math.round((nivelBanda - NIVEL_CORTE_DB) / RESOLUCION_LUT_DB))
      );
      const destino = k * 4;
      pixeles[destino]     = TABLA_COLORES[indice * 3];
      pixeles[destino + 1] = TABLA_COLORES[indice * 3 + 1];
      pixeles[destino + 2] = TABLA_COLORES[indice * 3 + 2];

      // Rampa de transparencia suave entre 45 y 50 dB:
      // Evita cortes duros y diluye el ruido bajo suavemente con el mapa base
      let alfa = 255;
      if (nivel < 55) {
        const factorRampa = (nivel - NIVEL_CORTE_DB) / (55 - NIVEL_CORTE_DB);
        alfa = Math.round(Math.max(0, Math.min(1, factorRampa)) * 255);
      }
      pixeles[destino + 3] = alfa;
    }
    contextoBuffer.putImageData(imagen, 0, 0);

    // Paso 5: Proyección con suavizado bilineal de alta calidad
    contexto.save();
    const zona = this._datos.zona;
    if (Array.isArray(zona) && zona.length > 2) {
      contexto.beginPath();
      zona.forEach(([lat, lng], indice) => {
        const punto = map.latLngToContainerPoint([lat, lng]);
        const x = punto.x + margenX;
        const y = punto.y + margenY;
        if (indice === 0) contexto.moveTo(x, y);
        else contexto.lineTo(x, y);
      });
      contexto.closePath();
      contexto.clip();
    }
    contexto.imageSmoothingEnabled = true;
    contexto.imageSmoothingQuality = "high";
    contexto.drawImage(buffer, 0, 0, columnas, filas, 0, 0, anchoCanvas, altoCanvas);
    contexto.restore();
  },
});

export default CapaRuidoRaster;