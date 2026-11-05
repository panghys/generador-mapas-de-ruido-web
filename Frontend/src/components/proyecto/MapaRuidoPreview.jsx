/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import clientAxios from "../config/clienteAxios";
import CapaRuidoRaster from "./CapaRuidoRaster";
import { obtenerColorRuido } from "./nivelesRuido";
import { calcularRuidoLocal } from "./ruidoLocal";
import { obtenerNivelEmisionCalle } from "./ruidoPropagacion";

const CACHE_DETALLES_MS = 30000;
const detallesEnCache = new Map();

function obtenerDetallePublico(id) {
  const clave = String(id);
  const existente = detallesEnCache.get(clave);

  if (existente && Date.now() - existente.fecha < CACHE_DETALLES_MS) {
    return existente.promesa;
  }

  const promesa = clientAxios
    .get(`/proyectos/publicos/${id}`)
    .then(({ data }) => data.data)
    .catch((error) => {
      detallesEnCache.delete(clave);
      throw error;
    });

  detallesEnCache.set(clave, {
    fecha: Date.now(),
    promesa,
  });

  return promesa;
}

function leerGeoJSON(valor) {
  try {
    return typeof valor === "string" ? JSON.parse(valor) : valor;
  } catch {
    return null;
  }
}

function obtenerGeometria(valor) {
  const geojson = leerGeoJSON(valor);
  return geojson?.type === "Feature" ? geojson.geometry : geojson;
}

function poligonoALatLngs(zona) {
  const geometria = obtenerGeometria(zona);
  const anillo = geometria?.type === "Polygon"
    ? geometria.coordinates?.[0]
    : null;

  return Array.isArray(anillo)
    ? anillo.map(([lng, lat]) => [lat, lng])
    : [];
}

function prepararCalle(calle) {
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

  const geometria = obtenerGeometria(calle.trazo_calle);
  const coordenadas = geometria?.type === "LineString"
    ? geometria.coordinates
    : [];

  return {
    ...calle,
    nivelRuidoCalculado: nivel,
    latlngs: Array.isArray(coordenadas)
      ? coordenadas.map(([lng, lat]) => [lat, lng])
      : [],
  };
}

export default function MapaRuidoPreview({ proyectoId, className = "" }) {
  const contenedorRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [detalleCargado, setDetalleCargado] = useState({ id: null, data: null });
  const [estado, setEstado] = useState("esperando");
  const proyecto = detalleCargado.id === proyectoId ? detalleCargado.data : null;

  // Solicita los datos completos solo cuando la previsualización se aproxima
  // al área visible del navegador.
  useEffect(() => {
    const elemento = contenedorRef.current;
    if (!elemento) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { rootMargin: "100px 0px" }
    );

    observador.observe(elemento);

    return () => {
      observador.disconnect();
    };
  }, []);

  // El detalle se comparte en caché entre la tarjeta y el carrusel.
  useEffect(() => {
    if (!visible || proyectoId == null) return undefined;

    let cancelado = false;
    setEstado("cargando");
    setDetalleCargado({ id: proyectoId, data: null });

    obtenerDetallePublico(proyectoId)
      .then((detalle) => {
        if (cancelado) return;
        setDetalleCargado({ id: proyectoId, data: detalle });
      })
      .catch((error) => {
        if (cancelado) return;
        console.error("No se pudo cargar la vista previa del mapa:", proyectoId, error);
        setEstado("error");
      });

    return () => {
      cancelado = true;
    };
  }, [visible, proyectoId]);

  // Dibuja el mapa base, la superficie de propagación y las calles coloreadas.
  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!proyecto || !contenedor) return undefined;

    let mapa;
    let frame = null;

    try {
      mapa = L.map(contenedor, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: true,
        preferCanvas: true,
      }).setView([-39.82, -73.24], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
        crossOrigin: true,
      }).addTo(mapa);

      const paneRuido = mapa.createPane("superficieRuidoPreview");
      paneRuido.style.zIndex = "350";
      paneRuido.style.pointerEvents = "none";

      const paneCalles = mapa.createPane("callesRuidoPreview");
      paneCalles.style.zIndex = "450";
      paneCalles.style.pointerEvents = "none";

      const zona = poligonoALatLngs(proyecto.zona);
      const calles = (proyecto.calles || []).map(prepararCalle);
      const lineasValidas = calles.filter((calle) => calle.latlngs.length >= 2);
      const fuentes = lineasValidas
        .map((calle) => ({
          latlngs: calle.latlngs,
          nivel: obtenerNivelEmisionCalle(calle),
        }))
        .filter((fuente) => Number.isFinite(fuente.nivel));

      if (zona.length >= 3) {
        L.polygon(zona, {
          color: "#287EAB",
          weight: 1.5,
          fillColor: "#287EAB",
          fillOpacity: 0.04,
        }).addTo(mapa);
      }

      if (zona.length >= 3) {
        mapa.fitBounds(L.latLngBounds(zona), {
          padding: [10, 10],
          animate: false,
        });
      } else if (lineasValidas.length) {
        const puntos = lineasValidas.flatMap((calle) => calle.latlngs);
        mapa.fitBounds(L.latLngBounds(puntos), {
          padding: [10, 10],
          animate: false,
        });
      }

      if (fuentes.length) {
        new CapaRuidoRaster(
          {
            calles: fuentes,
            zona,
          },
          {
            pane: "superficieRuidoPreview",
            opacidad: 0.68,
            tamanoCeldaPx: 2,
            margenViewport: 0.05,
            maxCeldas: 12000,
          }
        ).addTo(mapa);
      }

      lineasValidas.forEach((calle) => {
        const nivel = obtenerNivelEmisionCalle(calle);
        const color = Number.isFinite(nivel) && nivel > 0
          ? obtenerColorRuido(nivel).color
          : calle.color_asignado || "#eab308";

        L.polyline(calle.latlngs, {
          pane: "callesRuidoPreview",
          color: "#17212b",
          weight: 4,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(mapa);

        L.polyline(calle.latlngs, {
          pane: "callesRuidoPreview",
          color,
          weight: 2.2,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(mapa);
      });

      frame = window.requestAnimationFrame(() => {
        mapa?.invalidateSize({ pan: false });
      });

      setEstado("listo");
    } catch (error) {
      console.error("No se pudo dibujar la vista previa:", proyectoId, error);
      setEstado("error");
    }

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (mapa) mapa.remove();
    };
  }, [proyecto, proyectoId]);

  return (
    <div
      className={`pointer-events-none relative h-full w-full overflow-hidden bg-[#EAF0F4] ${className}`}
      role="img"
      aria-label={`Previsualización del mapa de calor del proyecto ${proyecto?.nombre || proyectoId}`}
    >
      <div ref={contenedorRef} className="absolute inset-0" />

      {(estado === "esperando" || estado === "cargando") && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#EAF0F4] text-xs font-medium text-[#718397]">
          Cargando mapa de ruido...
        </div>
      )}

      {estado === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#EAF0F4] px-4 text-center text-xs text-[#718397]">
          Vista previa no disponible
        </div>
      )}
    </div>
  );
}
