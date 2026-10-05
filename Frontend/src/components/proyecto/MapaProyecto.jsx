import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import booleanWithin from "@turf/boolean-within";
import buffer from "@turf/buffer";
import { lineString, polygon as turfPolygon } from "@turf/helpers";
import EstadoBadge from "./EstadoBadge";
import clientAxios from "../config/clienteAxios";
import CalleModal from "./CalleModal";
import InstruccionesMapaModal from "./InstruccionesMapaModal";
import { NIVELES_RUIDO, obtenerColorRuido } from "./nivelesRuido";
import CapaRuidoRaster from "./CapaRuidoRaster";
import ExportarMapaModal from "./ExportarMapaModal";
import { crearUrlVistaPrevia, descargarMapaRuido, generarMapaRuido } from "./exportarMapaRuido";
import { obtenerNivelEmisionCalle } from "./ruidoPropagacion";
import { calcularRuidoLocal } from "./ruidoLocal";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "@geoman-io/leaflet-geoman-free";

const layerALineString = (layer) => {
  const latlngs = layer.getLatLngs();
  return {
    type: "LineString",
    coordinates: latlngs.map((p) => [p.lng, p.lat]),
  };
};

const lineStringALatLngs = (geojson) => {
  if (!geojson?.coordinates) return [];
  return geojson.coordinates.map(([lng, lat]) => [lat, lng]);
};

const layerAPolygon = (layer) => {
  const anillo = layer.getLatLngs()[0];
  const coords = anillo.map((p) => [p.lng, p.lat]);

  const primero = coords[0];
  const ultimo = coords[coords.length - 1];
  if (primero[0] !== ultimo[0] || primero[1] !== ultimo[1]) {
    coords.push(primero);
  }

  return { type: "Polygon", coordinates: [coords] };
};

const polygonALatLngs = (geojson) => {
  if (!geojson?.coordinates?.[0]) return [];
  return geojson.coordinates[0].map(([lng, lat]) => [lat, lng]);
};

const TOLERANCIA_BORDE_ZONA_METROS = 5;

const calleEstaDentroDeZona = (trazoGeoJSON, zonaGeoJSON) => {
  if (!zonaGeoJSON) return false;

  try {
    const linea = lineString(trazoGeoJSON.coordinates);
    const area = turfPolygon(zonaGeoJSON.coordinates);
    const areaConTolerancia = buffer(area, TOLERANCIA_BORDE_ZONA_METROS, { units: "meters" });
    return booleanWithin(linea, areaConTolerancia);
  } catch (err) {
    return false;
  }
};

const limpiarComponenteCoordenada = (token) => {
  const match = token.trim().match(/^(-?\d+(?:\.\d+)?)\s*°?\s*([NSEW])?$/i);
  if (!match) return null;

  let valor = Number(match[1]);
  if (Number.isNaN(valor)) return null;

  const direccion = match[2]?.toUpperCase();
  if (direccion === "S" || direccion === "W") valor = -Math.abs(valor);
  if (direccion === "N" || direccion === "E") valor = Math.abs(valor);

  return valor;
};

const parsearComoCoordenadas = (texto) => {
  const limpio = texto.trim().replace(/\s+/g, " ");
  if (!limpio) return null;

  const partes = limpio.includes(",")
    ? limpio.split(",").map((v) => v.trim())
    : limpio.split(" ");

  if (partes.length !== 2) return null;

  const lat = limpiarComponenteCoordenada(partes[0]);
  const lng = limpiarComponenteCoordenada(partes[1]);

  if (lat === null || lng === null) return null;

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { fueraDeRango: true };
  }

  return { lat, lng };
};

const estiloZona = {
  color: "#2dd4bf",
  weight: 2,
  fillColor: "#2dd4bf",
  fillOpacity: 0.15,
};

/** Fuentes de ruido (ejes + nivel de emisión) a partir de las calles cargadas. */
const construirFuentesRuido = (calles) =>
  calles
    .map((calle) => ({
      latlngs: calle.layer?.getLatLngs
        ? calle.layer.getLatLngs().map((punto) => [punto.lat, punto.lng])
        : [],
      nivel: obtenerNivelEmisionCalle(calle),
    }))
    .filter((fuente) => fuente.latlngs.length >= 2 && Number.isFinite(fuente.nivel));

const PANE_SUPERFICIE_RUIDO = "superficieRuido";
const PANE_CALLES = "callesRuido";
const Z_INDEX_SUPERFICIE_RUIDO = 350;
const Z_INDEX_CALLES = 650;
const OPACIDAD_SUPERFICIE_RUIDO = 0.6;

const PESO_CALLE = 3;
const PESO_CALLE_SELECCIONADA = 5;
const INCREMENTO_BORDE_CALLE = 3;
const COLOR_BORDE_CALLE = "#111827";

const estiloCallePendiente = {
  color: "#facc15",
  weight: PESO_CALLE,
  dashArray: "8, 6",
  opacity: 1,
};

// Estilo del trazo temporal que dibuja Geoman mientras el usuario traza la calle.
const estiloTemplineDibujo = {
  color: "#facc15",
  weight: 5,
  dashArray: "10, 6",
  opacity: 1,
};

/**
 * Calle con doble trazo: borde oscuro (weight + 3) y centro de color (weight),
 * ambos en un pane propio sobre la superficie de ruido. Devuelve un FeatureGroup
 * que conserva la interfaz de una polilínea (setStyle, getLatLngs, on("click")).
 */
const crearCalleDobleTrazo = (latlngs, estiloCentro = {}) => {
  const opcionesComunes = {
    pane: PANE_CALLES,
    lineCap: "round",
    lineJoin: "round",
    interactive: true,
    bubblingMouseEvents: false,
  };

  const borde = L.polyline(latlngs, {
    ...opcionesComunes,
    color: COLOR_BORDE_CALLE,
    weight: (estiloCentro.weight ?? PESO_CALLE) + INCREMENTO_BORDE_CALLE,
    opacity: 0.95,
  });

  const centro = L.polyline(latlngs, {
    ...opcionesComunes,
    color: estiloCentro.color ?? "#FF0000",
    weight: estiloCentro.weight ?? PESO_CALLE,
    dashArray: estiloCentro.dashArray ?? null,
    opacity: estiloCentro.opacity ?? 1,
  });

  const grupo = L.featureGroup([borde, centro]);

  grupo.setStyle = (estilo = {}) => {
    const cambiosCentro = {};
    if (estilo.color !== undefined) cambiosCentro.color = estilo.color;
    if (estilo.dashArray !== undefined) cambiosCentro.dashArray = estilo.dashArray;
    if (estilo.opacity !== undefined) cambiosCentro.opacity = estilo.opacity;
    if (estilo.weight !== undefined) {
      cambiosCentro.weight = estilo.weight;
      borde.setStyle({ weight: estilo.weight + INCREMENTO_BORDE_CALLE });
    }
    centro.setStyle(cambiosCentro);
    return grupo;
  };
  grupo.getLatLngs = () => centro.getLatLngs();

  return grupo;
};

const VISTA_INICIAL_SIN_ZONA = { centro: [-35.6751, -71.543], zoom: 4 };

const MapaProyecto = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: proyectoId } = useParams();

  const [proyecto, setProyecto] = useState(location.state?.proyecto || null);
  const [cargandoProyecto, setCargandoProyecto] = useState(!location.state?.proyecto);
  const [cargandoCalles, setCargandoCalles] = useState(false);

  const [calles, setCalles] = useState([]);
  const [errorCalles, setErrorCalles] = useState("");
  const [marcadores, setMarcadores] = useState([]);

  const [delimitando, setDelimitando] = useState(null);
  const [coordenadas, setCoordenadas] = useState("");
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);

  const [trazoPendiente, setTrazoPendiente] = useState(null);

  const [modalCalleAbierto, setModalCalleAbierto] = useState(false);
  const [modalDatosIniciales, setModalDatosIniciales] = useState(null);
  const [errorGuardarCalle, setErrorGuardarCalle] = useState("");
  const [mostrarSuperficieRuido, setMostrarSuperficieRuido] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState("");
  const [vistaPrevia, setVistaPrevia] = useState(null); // { url, ancho, alto, resultado }
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState("");
  const urlVistaPreviaRef = useRef(null);

  const [editandoZona, setEditandoZona] = useState(false);

  const [parametroTest, setParametroTest] = useState(0);
  const [instruccionesAbiertas, setInstruccionesAbiertas] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const zonaLayerRef = useRef(null);
  const resaltadoLayerRef = useRef(null);
  const superficieRuidoRef = useRef(null);

  const modoOcupadoRef = useRef(false);
  const callesRef = useRef([]);

  const modoOcupado =
    delimitando !== null || editandoZona || modalCalleAbierto || trazoPendiente !== null;
  const liberarVistaPrevia = useCallback(() => {
    if (urlVistaPreviaRef.current) URL.revokeObjectURL(urlVistaPreviaRef.current);
    urlVistaPreviaRef.current = null;
  }, []);

  const cerrarVistaPrevia = useCallback(() => {
    liberarVistaPrevia();
    setVistaPrevia(null);
    setErrorDescarga("");
  }, [liberarVistaPrevia]);

  // Libera la URL temporal de la imagen si se sale de la pantalla con la vista previa abierta.
  useEffect(() => liberarVistaPrevia, [liberarVistaPrevia]);

  // Genera la imagen y la muestra en un popup; la descarga se decide desde ahí.
  const exportarMapa = async () => {
    setErrorExportar("");
    setExportando(true);
    try {
      const resultado = await generarMapaRuido({
        nombre: proyecto.nombre,
        calles: construirFuentesRuido(calles),
        zona: polygonALatLngs(proyecto.zona),
      });
      const url = await crearUrlVistaPrevia(resultado);
      liberarVistaPrevia();
      urlVistaPreviaRef.current = url;
      setVistaPrevia({ url, ancho: resultado.ancho, alto: resultado.alto, resultado });
    } catch (error) {
      setErrorExportar(error.message || "No se pudo exportar el mapa.");
    } finally {
      setExportando(false);
    }
  };

  const descargarVistaPrevia = async () => {
    if (!vistaPrevia) return;
    setErrorDescarga("");
    setDescargando(true);
    try {
      await descargarMapaRuido(vistaPrevia.resultado, "png");
    } catch (error) {
      setErrorDescarga(error.message || "No se pudo descargar la imagen.");
    } finally {
      setDescargando(false);
    }
  };

  const hayTraficoRegistrado = calles.some(
    (calle) =>
      Number(calle.trafico_vehiculos_pequenos) +
        Number(calle.trafico_vehiculos_medianos) +
        Number(calle.trafico_vehiculos_grandes) >
      0
  );

  useEffect(() => {
    modoOcupadoRef.current = modoOcupado;
  }, [modoOcupado]);

  useEffect(() => {
    callesRef.current = calles;
  }, [calles]);

  useEffect(() => {
    if (proyecto) return;

    clientAxios
      .get(`/proyectos/${proyectoId}`)
      .then(({ data }) => setProyecto(data.data))
      .catch(() => setProyecto(null))
      .finally(() => setCargandoProyecto(false));
  }, [proyectoId, proyecto]);

  useEffect(() => {
    if (!mapRef.current || !proyectoId || !proyecto) return;

    const vistaInicial = proyecto.zona ? null : VISTA_INICIAL_SIN_ZONA;

    const map = vistaInicial
      ? L.map(mapRef.current).setView(vistaInicial.centro, vistaInicial.zoom)
      : L.map(mapRef.current).setView([0, 0], 2);

    mapInstance.current = map;

    // Superficie térmica (debajo de las capas vectoriales) y ejes viales (encima de todo).
    const paneSuperficie = map.createPane(PANE_SUPERFICIE_RUIDO);
    paneSuperficie.style.zIndex = String(Z_INDEX_SUPERFICIE_RUIDO);
    paneSuperficie.style.pointerEvents = "none";
    const paneCalles = map.createPane(PANE_CALLES);
    paneCalles.style.zIndex = String(Z_INDEX_CALLES);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      crossOrigin: true, // permite reutilizar las teselas al exportar el mapa como imagen
    }).addTo(map);

    if (proyecto.zona) {
      const capaZona = L.polygon(polygonALatLngs(proyecto.zona), estiloZona).addTo(map);
      zonaLayerRef.current = capaZona;
      map.fitBounds(capaZona.getBounds(), { padding: [30, 30] });
    }

    setCargandoCalles(true);
    clientAxios
      .get(`/proyectos/${proyectoId}/calles`)
      .then(({ data }) => {
        const cargadas = data.data.map((calleDb) => {
          const nivelRuido = calcularRuidoLocal(
            {
              pequeños: calleDb.trafico_vehiculos_pequenos,
              medianos: calleDb.trafico_vehiculos_medianos,
              grandes: calleDb.trafico_vehiculos_grandes,
            },
            calleDb.velocidadPromedio ?? 50,
            calleDb.tipoSuperficie || "asfalto_no_ranurado",
            calleDb.periodoConteo || "15_minutos"
          );
          const layer = crearCalleDobleTrazo(lineStringALatLngs(calleDb.trazo_calle), {
            color: nivelRuido > 0
              ? obtenerColorRuido(nivelRuido).color
              : calleDb.color_asignado || "#FF0000",
            weight: PESO_CALLE,
          }).addTo(map);

          const calleObj = { ...calleDb, nivelRuidoCalculado: nivelRuido, layer };
          layer.on("click", () => abrirModalParaEditarPorId(calleObj.id));
          return calleObj;
        });

        setCalles(cargadas);
        setErrorCalles("");
      })
      .catch((error) => {
        setErrorCalles(
          error.response?.data?.error || "No se pudieron cargar las calles del proyecto."
        );
      })
      .finally(() => setCargandoCalles(false));

    return () => {
      map.remove();
      mapInstance.current = null;
      zonaLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    if (!mostrarSuperficieRuido || !proyecto?.zona || calles.length === 0) return;

    const fuentes = construirFuentesRuido(calles);
    if (fuentes.length === 0) return;

    const capa = new CapaRuidoRaster(
      { calles: fuentes, zona: polygonALatLngs(proyecto.zona) },
      { pane: PANE_SUPERFICIE_RUIDO, opacidad: OPACIDAD_SUPERFICIE_RUIDO }
    ).addTo(map);
    superficieRuidoRef.current = capa;

    return () => {
      if (map.hasLayer(capa)) map.removeLayer(capa);
      if (superficieRuidoRef.current === capa) superficieRuidoRef.current = null;
    };
  }, [calles, proyecto?.zona, mostrarSuperficieRuido]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (delimitando === "area") {
      map.pm.enableDraw("Polygon");
    } else if (delimitando === "calle") {
      map.pm.setGlobalOptions({ finishOnEnter: true });
      map.pm.enableDraw("Line", {
        finishOn: "dblclick",
        templineStyle: estiloTemplineDibujo,
        hintlineStyle: { color: "#facc15", dashArray: "6, 6" },
      });
    } else if (delimitando === "mark") {
      map.pm.enableDraw("Marker");
    } else {
      map.pm.disableDraw();
    }
  }, [delimitando]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const dibujoTerminado = (e) => {
      if (e.shape === "Line") {
        const layer = e.layer;
        const trazo = layerALineString(layer);

        if (!proyecto.zona) {
          layer.remove();
          window.alert("Primero debes delimitar la zona del proyecto antes de trazar calles.");
          setDelimitando(null);
          return;
        }

        if (!calleEstaDentroDeZona(trazo, proyecto.zona)) {
          layer.remove();
          window.alert("La calle debe estar dentro del perímetro delimitado del proyecto.");
          setDelimitando(null);
          return;
        }

        // Se reemplaza la capa de Geoman por una con doble trazo en el pane de calles.
        const latlngsTrazo = layer.getLatLngs().map((punto) => [punto.lat, punto.lng]);
        layer.remove();
        const capaPendiente = crearCalleDobleTrazo(latlngsTrazo, estiloCallePendiente).addTo(map);

        setTrazoPendiente({ layer: capaPendiente, trazoGeoJSON: trazo });
        setDelimitando(null);
        return;
      }

      if (e.shape === "Polygon") {
        guardarZona(e.layer);
      }

      if (e.shape === "Marker") {
        const marcador = e.layer;
        setMarcadores((actuales) => [...actuales, { layer: marcador, parametroTest }]);
      }

      setDelimitando(null);
    };

    map.on("pm:create", dibujoTerminado);
    return () => map.off("pm:create", dibujoTerminado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parametroTest, proyecto]);

  const guardarZona = async (layer) => {
    const geojson = layerAPolygon(layer);

    try {
      const { data } = await clientAxios.put(`/proyectos/${proyectoId}`, { zona: geojson });
      setProyecto((actual) => ({ ...actual, zona: data.data.zona }));
      zonaLayerRef.current = layer;
    } catch (err) {
      layer.remove();
    }
  };

  const editarZona = () => {
    if (!zonaLayerRef.current) return;
    zonaLayerRef.current.pm.enable();
    setEditandoZona(true);
  };

  const guardarEdicionZona = async () => {
    if (!zonaLayerRef.current) return;

    const geojson = layerAPolygon(zonaLayerRef.current);

    try {
      const { data } = await clientAxios.put(`/proyectos/${proyectoId}`, { zona: geojson });
      setProyecto((actual) => ({ ...actual, zona: data.data.zona }));
      zonaLayerRef.current.pm.disable();
      setEditandoZona(false);
    } catch (err) {
      // se mantiene en modo edición para que el usuario reintente
    }
  };

  const cancelarEdicionZona = () => {
    if (!zonaLayerRef.current || !proyecto?.zona) return;

    zonaLayerRef.current.pm.disable();
    mapInstance.current.removeLayer(zonaLayerRef.current);

    const capaOriginal = L.polygon(polygonALatLngs(proyecto.zona), estiloZona).addTo(mapInstance.current);
    zonaLayerRef.current = capaOriginal;

    setEditandoZona(false);
  };

  const borrarZona = async () => {
    if (!zonaLayerRef.current) return;

    try {
      await clientAxios.put(`/proyectos/${proyectoId}`, { zona: null });
      mapInstance.current.removeLayer(zonaLayerRef.current);
      zonaLayerRef.current = null;
      setProyecto((actual) => ({ ...actual, zona: null }));
    } catch (err) {
      // no se pudo borrar; se deja como está
    }
  };

  const centrarEnZona = () => {
    if (!zonaLayerRef.current || !mapInstance.current) return;
    mapInstance.current.flyToBounds(zonaLayerRef.current.getBounds(), {
      padding: [40, 40],
      duration: 1,
    });
  };

  const resaltarCalle = (calle) => {
    quitarResaltadoCalle();
    if (!mapInstance.current) return;

    const halo = L.polyline(calle.layer.getLatLngs(), {
      pane: PANE_CALLES,
      color: "#ffffff",
      weight: 14,
      opacity: 0.7,
      interactive: false,
    }).addTo(mapInstance.current);

    halo.bringToBack();
    calle.layer.bringToFront();
    resaltadoLayerRef.current = halo;
  };

  const quitarResaltadoCalle = () => {
    if (resaltadoLayerRef.current && mapInstance.current) {
      mapInstance.current.removeLayer(resaltadoLayerRef.current);
    }
    resaltadoLayerRef.current = null;
  };

  const abrirModalParaEditarPorId = useCallback((calleId) => {
    if (modoOcupadoRef.current) return;

    const calleActual = callesRef.current.find((c) => c.id === calleId);
    if (!calleActual) return;

    resaltarCalle(calleActual);
    calleActual.layer.setStyle({ weight: PESO_CALLE_SELECCIONADA });

    setModalDatosIniciales(calleActual);
    setModalCalleAbierto(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirModalParaGuardarTrazo = () => {
    if (!trazoPendiente) return;
    setModalDatosIniciales(null);
    setModalCalleAbierto(true);
  };

  const cancelarTrazoPendiente = () => {
    if (!trazoPendiente) return;
    trazoPendiente.layer.remove();
    setTrazoPendiente(null);
  };

  const guardarCalleDesdeModal = async (datos) => {
    setErrorGuardarCalle("");
    try {
      if (modalDatosIniciales?.id) {
        const { data } = await clientAxios.put(
          `/proyectos/${proyectoId}/calles/${modalDatosIniciales.id}`,
          datos
        );

        const nivelRuido = data.data.nivelRuidoCalculado;
        modalDatosIniciales.layer.setStyle({
          color: nivelRuido > 0 ? obtenerColorRuido(nivelRuido).color : datos.color_asignado,
          weight: PESO_CALLE,
        });
        quitarResaltadoCalle();

        setCalles((actuales) =>
          actuales.map((c) => (c.id === modalDatosIniciales.id ? { ...c, ...data.data } : c))
        );
      } else {
        const layer = trazoPendiente.layer;

        const { data } = await clientAxios.post(`/proyectos/${proyectoId}/calles`, {
          ...datos,
          trazo_calle: trazoPendiente.trazoGeoJSON,
        });

        const nivelRuido = data.data.nivelRuidoCalculado;
        layer.setStyle({
          color: nivelRuido > 0 ? obtenerColorRuido(nivelRuido).color : datos.color_asignado,
          weight: PESO_CALLE,
          dashArray: null,
          opacity: 1,
        });

        const nuevaCalle = { ...data.data, layer };
        layer.on("click", () => abrirModalParaEditarPorId(nuevaCalle.id));

        setCalles((actuales) => [...actuales, nuevaCalle]);
        setTrazoPendiente(null);
      }

      setModalCalleAbierto(false);
      setModalDatosIniciales(null);
    } catch (err) {
      setErrorGuardarCalle(
        err.response?.data?.error || "No se pudo guardar la calle. Verifica los datos e intenta nuevamente."
      );
    }
  };

  const cancelarModalCalle = () => {
    if (!modalDatosIniciales) {
      cancelarTrazoPendiente();
    } else {
      modalDatosIniciales.layer.setStyle({ weight: PESO_CALLE });
      quitarResaltadoCalle();
    }

    setModalCalleAbierto(false);
    setModalDatosIniciales(null);
  };

  const eliminarCalleDesdeModal = async () => {
    if (!modalDatosIniciales?.id) return;

    setErrorGuardarCalle("");
    try {
      await clientAxios.delete(`/proyectos/${proyectoId}/calles/${modalDatosIniciales.id}`);
      mapInstance.current.removeLayer(modalDatosIniciales.layer);
      quitarResaltadoCalle();
      setCalles((actuales) => actuales.filter((c) => c.id !== modalDatosIniciales.id));
      setModalCalleAbierto(false);
      setModalDatosIniciales(null);
    } catch (err) {
      setErrorGuardarCalle(err.response?.data?.error || "No se pudo eliminar la calle.");
    }
  };

  const cambiarNumero = (e, setter) => {
    const valor = e.target.value.replace(/\D/g, "");
    setter(valor === "" ? 0 : Number(valor));
  };

  const buscarUbicacion = async () => {
    const texto = coordenadas.trim();
    if (!texto || buscando) return;

    const resultado = parsearComoCoordenadas(texto);

    if (resultado?.fueraDeRango) {
      setErrorBusqueda("Coordenadas fuera de rango. La latitud debe estar entre -90 y 90, y la longitud entre -180 y 180.");
      return;
    }

    if (resultado) {
      setErrorBusqueda("");
      mapInstance.current?.flyTo([resultado.lat, resultado.lng], 13);
      return;
    }

    setBuscando(true);
    setErrorBusqueda("");

    try {
      const respuesta = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(texto)}`
      );

      if (!respuesta.ok) {
        throw new Error("network");
      }

      const resultados = await respuesta.json();

      if (!resultados.length) {
        setErrorBusqueda("No se encontró esa ciudad, país o lugar. Verifica el nombre e intenta de nuevo.");
        return;
      }

      const { lat, lon, boundingbox } = resultados[0];

      let esAreaGrande = false;

      if (Array.isArray(boundingbox) && boundingbox.length === 4) {
        const [south, north, west, east] = boundingbox.map(Number);
        const alturaGrados = Math.abs(north - south);
        const anchoGrados = Math.abs(east - west);

        if (Math.max(alturaGrados, anchoGrados) > 2) {
          esAreaGrande = true;
          mapInstance.current?.flyToBounds(
            [
              [south, west],
              [north, east],
            ],
            { padding: [40, 40], duration: 1 }
          );
        }
      }

      if (!esAreaGrande) {
        mapInstance.current?.flyTo([Number(lat), Number(lon)], 13);
      }
    } catch (err) {
      setErrorBusqueda("No se pudo conectar con el servicio de búsqueda. Intenta nuevamente.");
    } finally {
      setBuscando(false);
    }
  };

  if (cargandoProyecto) {
    return (
      <main className="min-h-screen bg-dash-bg px-6 py-12 text-dash-text">
        <p>Cargando proyecto...</p>
      </main>
    );
  }

  if (!proyecto) {
    return (
      <main className="min-h-screen bg-[#D1DDF2] px-6 py-12 text-[#052B59]">
        <p>Proyecto no encontrado.</p>
        <button onClick={() => navigate("/proyectos")} className="mt-4 text-sm text-[#1C5DAC]t">
          Volver a proyectos
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#D1DDF2] px-6 py-8 font-sans text-[#052B59]">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/proyectos")}
          className="mb-6 text-sm text-[#4B5563] hover:text-[#1C5DAC]"
        >
          ← Volver a proyectos
        </button>

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <EstadoBadge estado={proyecto.estado} />
            <span className="text-xs text-[#4B5563]">Mapa con OpenStreetMap</span>
          </div>

          <h1 className="text-3xl font-semibold">{proyecto.nombre}</h1>

          {(proyecto.comuna || proyecto.region) && (
            <p className="mt-2 text-sm text-[#4B5563]">
              {[proyecto.comuna, proyecto.region].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                value={coordenadas}
                onChange={(e) => {
                  setCoordenadas(e.target.value);
                  setErrorBusqueda("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") buscarUbicacion();
                }}
                placeholder="Ej: Valdivia, Chile o -39.8142, -73.2459"
                className="flex-1 border border-slate-300 bg-white px-4 py-2.5 text-sm rounded-lg text-black outline-none placeholder:text-dash-text-soft focus:border-[#1C5DAC]"
              />

              <button
                onClick={buscarUbicacion}
                disabled={buscando}
                className="bg-[#1C5DAC] px-5 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 disabled:opacity-60"
              >
                {buscando ? "Buscando..." : "Buscar"}
              </button>

              <button
                onClick={centrarEnZona}
                disabled={!proyecto.zona}
                title={!proyecto.zona ? "Primero delimita una zona" : "Centrar el mapa en la zona delimitada"}
                className={`whitespace-nowrap border px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  proyecto.zona
                    ? "border-[#1C5DAC] text-[#1C5DAC] hover:bg-[#1C5DAC]/10"
                    : "cursor-not-allowed border-[#4B5563]/50 text-[#4B5563]/50"
                }`}
              >
                📍 Centrar en zona
              </button>
            </div>

            {errorBusqueda && <p className="mb-3 text-sm text-red-400">{errorBusqueda}</p>}

            {delimitando && (
              <div className="mb-3 flex items-center gap-2 border border-[#1C5DAC] bg-[#1C5DAC]/10 px-4 py-2 text-sm font-medium text-[#1C5DAC]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#1C5DAC]" />
                {delimitando === "area" && "Modo delimitación de zona activo"}
                {delimitando === "calle" && "Modo trazado de calle activo: Termina el trazado con Enter o con doble click"}
                {delimitando === "mark" && "Modo marcador activo: haz clic en el mapa para colocarlo"}
              </div>
            )}

            {editandoZona && (
              <div className="mb-3 flex items-center gap-2 border border-yellow-500 bg-yellow-500/70 px-4 py-2 text-sm font-medium text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
                Editando zona: arrastra los vértices y luego "Guardar zona"
              </div>
            )}

            {trazoPendiente && (
              <div className="mb-3 flex items-center gap-2 border border-[#1C5DAC] bg-[#1C5DAC]/10 px-4 py-2 text-sm font-medium text-[#1C5DAC]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#1C5DAC]" />
                Trazo listo — guarda los datos de la calle o cancélalo desde el panel lateral
              </div>
            )}

            <section className="relative h-[520px] overflow-hidden border border-dash-border">
              <div ref={mapRef} className="h-[520px] w-full" />
            </section>

            {errorCalles && <p className="mt-4 text-sm text-red-400">{errorCalles}</p>}
            {cargandoCalles && (
              <p className="mt-4 text-sm text-[#4B5563]">Cargando calles guardadas...</p>
            )}
          </div>

          <div className="flex w-64 flex-col gap-y-4">
            <div className="border border-slate-300 bg-white/70 rounded-lg p-3">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#243B53]">
                Zona de trabajo
              </h2>

              {!proyecto.zona && (
                <button
                  onClick={() => setDelimitando((actual) => (actual === "area" ? null : "area"))}
                  disabled={modoOcupado && delimitando !== "area"}
                  className={`w-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                    delimitando === "area"
                      ? "bg-[#154682] text-[#70adf7] ring-2 ring-[#70adf7] rounded-lg"
                      : "bg-[#1C5DAC] text-white hover:opacity-90"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {delimitando === "area" ? "Cancelar delimitación" : "Delimitar zona"}
                </button>
              )}

              {proyecto.zona && !editandoZona && (
                <div className="flex gap-2">
                  <button
                    onClick={editarZona}
                    disabled={modoOcupado}
                    className="flex-1 bg-[#1C5DAC] px-2 py-2 text-sm font-semibold rounded-lg text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Editar
                  </button>
                  <button
                    onClick={borrarZona}
                    disabled={modoOcupado}
                    className="flex-1 border border-red-500 px-2 py-2 text-sm font-semibold rounded-lg text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Borrar
                  </button>
                </div>
              )}

              {proyecto.zona && editandoZona && (
                <div className="flex gap-2">
                  <button
                    onClick={guardarEdicionZona}
                    className="flex-1 bg-[#1C5DAC] px-2 py-2 text-sm font-semibold rounded-lg text-white hover:opacity-90"
                  >
                    Guardar zona
                  </button>
                  <button
                    onClick={cancelarEdicionZona}
                    className="flex-1 border border-[#1C5DAC] rounded-lg px-2 py-2 text-sm font-semibold text-[#4B5563] hover:bg-[#1C5DAC]/20"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div className="h-px w-full bg-[#1C5DAC]" />

            <div className="border border-slate-300 bg-white/70 p-3 rounded-lg">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#052B59]">
                Calles
              </h2>

              {!trazoPendiente && delimitando !== "calle" && (
                <button
                  onClick={() => setDelimitando("calle")}
                  disabled={!proyecto.zona || modoOcupado}
                  title={!proyecto.zona ? "Primero delimita una zona" : undefined}
                  className="w-full bg-[#1C5DAC] px-2 py-2 text-sm font-semibold rounded-lg text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Crear calle
                </button>
              )}

              {!trazoPendiente && delimitando === "calle" && (
                <button
                  onClick={() => setDelimitando(null)}
                  className="w-full bg-[#1C5DAC] px-2 py-2 text-sm font-semibold rounded-lg text-white ring-2 ring-[#1C5DAC]"
                >
                  Cancelar trazado
                </button>
              )}

              {trazoPendiente && (
                <div className="flex gap-2">
                  <button
                    onClick={abrirModalParaGuardarTrazo}
                    className="flex-1 bg-[#1C5DAC] px-2 py-2 text-sm font-semibold rounded-lg text-white hover:opacity-90"
                  >
                    Guardar calle
                  </button>
                  <button
                    onClick={cancelarTrazoPendiente}
                    className="flex-1 border border-red-500 px-2 py-2 text-sm font-semibold rounded-lg text-red-400 hover:bg-red-500/10"
                  >
                    Cancelar trazado
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setDelimitando((actual) => (actual === "mark" ? null : "mark"))}
              disabled={modoOcupado && delimitando !== "mark"}
              className={`w-full px-2 py-2 text-sm font-semibold rounded-lg transition-colors ${
                delimitando === "mark"
                  ? "bg-[#154682] text-[#70adf7] ring-2 ring-[#1C5DAC]"
                  : "bg-[#154682] text-white hover:opacity-90"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {delimitando === "mark" ? "Dejar de añadir marcador" : "Añadir marcador"}
            </button>

            {delimitando === "mark" && (
              <div className="border border-slate-300 bg-white/70 rounded-lg p-4">
                <h2 className="mb-3 text-sm font-semibold">Parámetros del marcador</h2>
                <label className="flex items-center justify-between text-sm">
                  <span>Test</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={parametroTest}
                    onChange={(e) => cambiarNumero(e, setParametroTest)}
                    className="w-20 border border-[#154682] rounded-lg bg-white px-2 py-1 text-right text-[#154682] outline-none"
                  />
                </label>
              </div>
            )}

            <div className="border border-slate-300 bg-white/70 p-3 rounded-lg">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#154682]">
                Niveles de ruido dB(A)
              </h2>
              <div className="flex flex-col gap-1.5">
                {NIVELES_RUIDO.map(({ color, rango }) => (
                  <div key={color} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-3 w-6 border border-[#154682]/40"
                      style={{ backgroundColor: color }}
                    />
                    <span>{rango} dB(A)</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-[#154682]">
                Superficie continua RLS-90 / DIN 18005-2 desde 45 dB(A), con suma energética entre calles; no considera edificios ni terreno.
              </p>
              <button
                type="button"
                onClick={() => setMostrarSuperficieRuido((visible) => !visible)}
                disabled={!proyecto.zona || !hayTraficoRegistrado}
                className="mt-3 w-full border border-[#154682] px-2 py-2 text-sm font-semibold rounded-lg text-[#154682] hover:bg-[#154682]/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mostrarSuperficieRuido ? "Ocultar superficie" : "Mostrar superficie"}
              </button>
              <button
                type="button"
                onClick={exportarMapa}
                disabled={!proyecto.zona || !hayTraficoRegistrado || exportando}
                className="mt-2 w-full bg-[#154682] px-2 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {exportando ? "Generando vista previa…" : "Exportar mapa"}
              </button>
              {errorExportar && <p className="mt-2 text-xs text-red-400">{errorExportar}</p>}
            </div>

            <button
              type="button"
              onClick={() => setInstruccionesAbiertas(true)}
              className="w-full border border-[#154682] px-2 py-2 text-sm font-semibold rounded-lg text-[#154682] hover:bg-[#154682]/40"
            >
              Cómo usar el mapa
            </button>
          </div>
        </div>
      </div>

      <CalleModal
        abierto={modalCalleAbierto}
        datosIniciales={modalDatosIniciales}
        error={errorGuardarCalle}
        onGuardar={guardarCalleDesdeModal}
        onEliminar={eliminarCalleDesdeModal}
        onCancelar={cancelarModalCalle}
      />

      <ExportarMapaModal
        vista={vistaPrevia}
        descargando={descargando}
        error={errorDescarga}
        onDescargar={descargarVistaPrevia}
        onCerrar={cerrarVistaPrevia}
      />

      <InstruccionesMapaModal
        abierto={instruccionesAbiertas}
        onCerrar={() => setInstruccionesAbiertas(false)}
      />
    </main>
  );
};

export default MapaProyecto;