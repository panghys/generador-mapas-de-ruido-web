import { ANCHO_BANDA_DB, NIVEL_CORTE_DB, NIVELES_RUIDO, obtenerColorRuido } from "./nivelesRuido.js";
import {
  calcularGrillaEnergia,
  convertirEnergiaANiveles,
  crearProyeccionParaCalles,
  prepararFuentes,
} from "./ruidoPropagacion.js";

const TAM_TESELA = 256;
const ZOOM_MAX = 19;
const ZOOM_MIN = 3;
const LADO_MAX_PX = 2000; // tamaño máximo del mapa exportado (px) → define el zoom elegido
const MAPA_MIN_ANCHO = 1000;
const MAPA_MIN_ALTO = 820; // deja espacio en el panel lateral para leyenda + mini mapa
const MARGEN_ZONA = 0.08; // aire alrededor de la zona (8 % por lado)
const MAX_CELDAS = 500000; // igual que la capa en pantalla; las celdas se amplían con suavizado
const OPACIDAD_SUPERFICIE = 0.8;

const ANCHO_LEYENDA = 300;
const ALTO_CABECERA = 96;
const ALTO_PIE = 44;
const FUENTE = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const COLOR_TEXTO = "#0f172a";
const COLOR_TEXTO_SUAVE = "#475569";

/* ---------- Proyección Web Mercator (misma que las teselas de OSM) ---------- */

const mundoPx = (zoom) => TAM_TESELA * 2 ** zoom;
const lngAX = (lng, zoom) => ((lng + 180) / 360) * mundoPx(zoom);
const latAY = (lat, zoom) => {
  const s = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * mundoPx(zoom);
};
const xALng = (x, zoom) => (x / mundoPx(zoom)) * 360 - 180;
const yALat = (y, zoom) => {
  const n = Math.PI - (2 * Math.PI * y) / mundoPx(zoom);
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
};

/** Elige zoom y encuadre (en px de mundo) para que la zona quepa con un poco de margen. */
const calcularVista = (zona) => {
  const lats = zona.map(([lat]) => lat);
  const lngs = zona.map(([, lng]) => lng);
  const sur = Math.min(...lats);
  const norte = Math.max(...lats);
  const oeste = Math.min(...lngs);
  const este = Math.max(...lngs);

  let zoom = ZOOM_MAX;
  let ancho = 0;
  let alto = 0;
  for (; zoom >= ZOOM_MIN; zoom -= 1) {
    ancho = (lngAX(este, zoom) - lngAX(oeste, zoom)) * (1 + 2 * MARGEN_ZONA);
    alto = (latAY(sur, zoom) - latAY(norte, zoom)) * (1 + 2 * MARGEN_ZONA);
    if (ancho <= LADO_MAX_PX && alto <= LADO_MAX_PX) break;
  }
  zoom = Math.max(zoom, ZOOM_MIN);

  ancho = Math.round(Math.max(ancho, MAPA_MIN_ANCHO));
  alto = Math.round(Math.max(alto, MAPA_MIN_ALTO));
  const centroX = (lngAX(oeste, zoom) + lngAX(este, zoom)) / 2;
  const centroY = (latAY(sur, zoom) + latAY(norte, zoom)) / 2;

  // Origen entero para que las teselas encajen sin costuras.
  return {
    zoom,
    ancho,
    alto,
    origenX: Math.round(centroX - ancho / 2),
    origenY: Math.round(centroY - alto / 2),
  };
};

/* ---------- Mapa base ---------- */

const cargarTesela = (zoom, x, y) =>
  new Promise((resolve) => {
    const imagen = new Image();
    imagen.crossOrigin = "anonymous"; // necesario para poder exportar el canvas
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () => resolve(null);
    const subdominio = "abc"[Math.abs(x + y) % 3]; // mismo patrón que Leaflet (aprovecha la caché)
    imagen.src = `https://${subdominio}.tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
  });

const dibujarMapaBase = async (ctx, { zoom, ancho, alto, origenX, origenY }) => {
  const n = 2 ** zoom;
  const x0 = Math.floor(origenX / TAM_TESELA);
  const x1 = Math.floor((origenX + ancho - 1) / TAM_TESELA);
  const y0 = Math.floor(origenY / TAM_TESELA);
  const y1 = Math.floor((origenY + alto - 1) / TAM_TESELA);

  const pedidos = [];
  for (let y = y0; y <= y1; y += 1) {
    if (y < 0 || y >= n) continue;
    for (let x = x0; x <= x1; x += 1) {
      pedidos.push(cargarTesela(zoom, ((x % n) + n) % n, y).then((imagen) => ({ imagen, x, y })));
    }
  }
  const teselas = await Promise.all(pedidos);

  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(0, 0, ancho, alto);
  let cargadas = 0;
  for (const { imagen, x, y } of teselas) {
    if (!imagen) continue;
    ctx.drawImage(imagen, x * TAM_TESELA - origenX, y * TAM_TESELA - origenY);
    cargadas += 1;
  }
  if (cargadas === 0) {
    throw new Error("No se pudo cargar el mapa base. Revisa tu conexión e inténtalo de nuevo.");
  }
};


const trazarZona = (ctx, zona, { zoom, origenX, origenY }) => {
  ctx.beginPath();
  zona.forEach(([lat, lng], indice) => {
    const x = lngAX(lng, zoom) - origenX;
    const y = latAY(lat, zoom) - origenY;
    if (indice === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
};

const hexARgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

const dibujarSuperficieRuido = (ctx, vista, calles, zona) => {
  const { zoom, ancho, alto, origenX, origenY } = vista;
  const proyeccion = crearProyeccionParaCalles(calles);
  const fuentes = prepararFuentes(calles, proyeccion);
  if (fuentes.length === 0) return;

  let celda = 1;
  while ((ancho / celda) * (alto / celda) > MAX_CELDAS) celda += 1;
  const columnas = Math.ceil(ancho / celda);
  const filas = Math.ceil(alto / celda);

  const xs = new Float64Array(columnas);
  const ys = new Float64Array(filas);
  for (let i = 0; i < columnas; i += 1) {
    xs[i] = proyeccion.xDesdeLng(xALng(origenX + (i + 0.5) * celda, zoom));
  }
  for (let j = 0; j < filas; j += 1) {
    ys[j] = proyeccion.yDesdeLat(yALat(origenY + (j + 0.5) * celda, zoom));
  }

  const niveles = convertirEnergiaANiveles(calcularGrillaEnergia(fuentes, xs, ys));

  const colores = NIVELES_RUIDO.map(({ color }) => hexARgb(color));
  const buffer = document.createElement("canvas");
  buffer.width = columnas;
  buffer.height = filas;
  const ctxBuffer = buffer.getContext("2d");
  const imagen = ctxBuffer.createImageData(columnas, filas);
  const pixeles = imagen.data;
  for (let k = 0; k < niveles.length; k += 1) {
    const nivel = niveles[k];
    if (!(nivel >= NIVEL_CORTE_DB)) continue;
    const banda = Math.min(
      colores.length - 1,
      Math.floor((nivel - NIVEL_CORTE_DB) / ANCHO_BANDA_DB)
    );
    const [r, g, b] = colores[banda];
    pixeles[k * 4] = r;
    pixeles[k * 4 + 1] = g;
    pixeles[k * 4 + 2] = b;
    pixeles[k * 4 + 3] = 255;
  }
  ctxBuffer.putImageData(imagen, 0, 0);

  ctx.save();
  trazarZona(ctx, zona, vista);
  ctx.clip();
  ctx.globalAlpha = OPACIDAD_SUPERFICIE;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(buffer, 0, 0, columnas, filas, 0, 0, columnas * celda, filas * celda);
  ctx.restore();

  ctx.save();
  trazarZona(ctx, zona, vista);
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.strokeStyle = COLOR_TEXTO;
  ctx.stroke();
  ctx.restore();
};

const dibujarEscala = (ctx, { zoom, alto, origenY }, x, y) => {
  const latCentro = yALat(origenY + alto / 2, zoom);
  const metrosPorPx = (40075016.686 * Math.cos((latCentro * Math.PI) / 180)) / mundoPx(zoom);
  const candidatos = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  let metros = candidatos[0];
  for (const candidato of candidatos) if (candidato / metrosPorPx <= 180) metros = candidato;
  const largo = metros / metrosPorPx;
  const etiqueta = metros >= 1000 ? `${metros / 1000} km` : `${metros} m`;

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(x, y - 44, largo + 28, 44 + 12);
  ctx.strokeStyle = COLOR_TEXTO;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 14, y - 22);
  ctx.lineTo(x + 14, y - 8);
  ctx.lineTo(x + 14 + largo, y - 8);
  ctx.lineTo(x + 14 + largo, y - 22);
  ctx.stroke();
  ctx.fillStyle = COLOR_TEXTO;
  ctx.font = `600 18px ${FUENTE}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(etiqueta, x + 14, y - 28);
  ctx.restore();
};

const ajustarTexto = (ctx, texto, anchoMax) => {
  const lineas = [];
  let actual = "";
  for (const palabra of texto.split(" ")) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > anchoMax && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
};
const dibujarMiniMapa = (ctx, { base, vista, calles, zona }, x, y, ancho, alto) => {
  const escala = Math.min(ancho / vista.ancho, alto / vista.alto);
  const w = vista.ancho * escala;
  const h = vista.alto * escala;
  const aPunto = ([lat, lng]) => [
    lngAX(lng, vista.zoom) - vista.origenX,
    latAY(lat, vista.zoom) - vista.origenY,
  ];

  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  ctx.scale(escala, escala);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(base, 0, 0);

  // Zona de estudio.
  trazarZona(ctx, zona, vista);
  ctx.fillStyle = "rgba(45,212,191,0.12)";
  ctx.fill();
  ctx.lineJoin = "round";
  ctx.lineWidth = 2 / escala;
  ctx.strokeStyle = COLOR_TEXTO;
  ctx.stroke();
  ctx.lineCap = "round";
  for (const { latlngs, nivel } of calles) {
    ctx.beginPath();
    latlngs.forEach((punto, indice) => {
      const [px, py] = aPunto(punto);
      if (indice === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = COLOR_TEXTO;
    ctx.lineWidth = 5 / escala;
    ctx.stroke();
    ctx.strokeStyle = obtenerColorRuido(nivel).color;
    ctx.lineWidth = 3 / escala;
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
};

const dibujarLeyenda = (ctx, x, y, ancho, alto, mini) => {
  const margen = 28;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, ancho, alto);
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(x, y, 2, alto);

  ctx.textBaseline = "top";
  ctx.fillStyle = COLOR_TEXTO;
  ctx.font = `700 26px ${FUENTE}`;
  ctx.fillText("Nivel de ruido", x + margen, y + margen);
  ctx.fillStyle = COLOR_TEXTO_SUAVE;
  ctx.font = `500 21px ${FUENTE}`;
  ctx.fillText("dB(A)", x + margen, y + margen + 34);

  const altoFila = 34;
  const separacion = 10;
  const anchoCaja = 56;
  let fy = y + margen + 86;
  ctx.textBaseline = "middle";
  for (const { color, rango } of NIVELES_RUIDO) {
    ctx.globalAlpha = OPACIDAD_SUPERFICIE;
    ctx.fillStyle = color;
    ctx.fillRect(x + margen, fy, anchoCaja, altoFila);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(15,23,42,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + margen + 0.5, fy + 0.5, anchoCaja - 1, altoFila - 1);
    ctx.fillStyle = COLOR_TEXTO;
    ctx.font = `500 22px ${FUENTE}`;
    ctx.fillText(rango, x + margen + anchoCaja + 16, fy + altoFila / 2);
    fy += altoFila + separacion;
  }

  ctx.textBaseline = "top";
  ctx.fillStyle = COLOR_TEXTO_SUAVE;
  ctx.font = `400 16px ${FUENTE}`;
  const nota =
    "Superficie calculada con RLS-90 / DIN 18005-2 desde 45 dB(A), con suma energética entre calles. No considera edificios ni terreno.";
  let ny = fy + 18;
  for (const linea of ajustarTexto(ctx, nota, ancho - margen * 2)) {
    ctx.fillText(linea, x + margen, ny);
    ny += 22;
  }

  if (mini) {
    const tituloY = ny + 16;
    ctx.fillStyle = COLOR_TEXTO;
    ctx.font = `600 18px ${FUENTE}`;
    ctx.fillText("Zona y calles", x + margen, tituloY);
    const areaY = tituloY + 30;
    const areaAlto = y + alto - margen - areaY;
    if (areaAlto >= 80) dibujarMiniMapa(ctx, mini, x + margen, areaY, ancho - margen * 2, areaAlto);
  }
  ctx.restore();
};

const dibujarCabeceraYPie = (ctx, anchoTotal, altoTotal, nombre) => {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, anchoTotal, ALTO_CABECERA);
  ctx.fillRect(0, altoTotal - ALTO_PIE, anchoTotal, ALTO_PIE);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLOR_TEXTO;
  ctx.font = `700 32px ${FUENTE}`;
  ctx.fillText(nombre || "Mapa de ruido", 28, 46);
  ctx.fillStyle = COLOR_TEXTO_SUAVE;
  ctx.font = `500 20px ${FUENTE}`;
  ctx.fillText(`Mapa de ruido · ${new Date().toLocaleDateString("es-CL")}`, 28, 78);

  ctx.font = `400 15px ${FUENTE}`;
  ctx.textBaseline = "middle";
  ctx.fillText("Mapa base © colaboradores de OpenStreetMap", 28, altoTotal - ALTO_PIE / 2);
  ctx.restore();
};
const canvasABlob = (canvas, tipo) =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen."))),
      tipo
    )
  );

const descargarBlob = (blob, archivo) => {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = archivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const EXPORTADORES = {
  png: async (canvas, base) => descargarBlob(await canvasABlob(canvas, "image/png"), `${base}.png`),
};

export const FORMATOS_EXPORTACION = Object.keys(EXPORTADORES);

const nombreBase = (nombre) => {
  const slug = String(nombre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `mapa-ruido-${slug || "proyecto"}`;
};

/**
 *
 * @param {object} opciones
 * @param {string} opciones.nombre
 * @param {Array<{latlngs:number[][], nivel:number}>} opciones.calles  
 * @param {number[][]} opciones.zona 
 * @returns {Promise<{canvas: HTMLCanvasElement, nombreArchivo: string, ancho: number, alto: number}>}
 */
export async function generarMapaRuido({ nombre, calles, zona }) {
  if (!Array.isArray(zona) || zona.length < 3) throw new Error("El proyecto no tiene una zona delimitada.");
  if (!Array.isArray(calles) || calles.length === 0) throw new Error("No hay calles con tráfico para graficar.");

  const vista = calcularVista(zona);

  const mapa = document.createElement("canvas");
  mapa.width = vista.ancho;
  mapa.height = vista.alto;
  const ctxMapa = mapa.getContext("2d");
  await dibujarMapaBase(ctxMapa, vista);
  const base = document.createElement("canvas");
  base.width = vista.ancho;
  base.height = vista.alto;
  base.getContext("2d").drawImage(mapa, 0, 0);
  dibujarSuperficieRuido(ctxMapa, vista, calles, zona);
  dibujarEscala(ctxMapa, vista, 20, vista.alto - 20);
  ctxMapa.strokeStyle = COLOR_TEXTO;
  ctxMapa.lineWidth = 4;
  ctxMapa.strokeRect(2, 2, vista.ancho - 4, vista.alto - 4);

  const anchoTotal = vista.ancho + ANCHO_LEYENDA;
  const altoTotal = ALTO_CABECERA + vista.alto + ALTO_PIE;
  const lienzo = document.createElement("canvas");
  lienzo.width = anchoTotal;
  lienzo.height = altoTotal;
  const ctx = lienzo.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, anchoTotal, altoTotal);
  dibujarCabeceraYPie(ctx, anchoTotal, altoTotal, nombre);
  ctx.drawImage(mapa, 0, ALTO_CABECERA);
  dibujarLeyenda(ctx, vista.ancho, ALTO_CABECERA, ANCHO_LEYENDA, vista.alto, { base, vista, calles, zona });

  return { canvas: lienzo, nombreArchivo: nombreBase(nombre), ancho: anchoTotal, alto: altoTotal };
}

export async function crearUrlVistaPrevia({ canvas }) {
  return URL.createObjectURL(await canvasABlob(canvas, "image/png"));
}
export async function descargarMapaRuido({ canvas, nombreArchivo }, formato = "png") {
  const exportador = EXPORTADORES[formato];
  if (!exportador) throw new Error(`Formato de exportación no soportado: ${formato}`);
  await exportador(canvas, nombreArchivo);
}
