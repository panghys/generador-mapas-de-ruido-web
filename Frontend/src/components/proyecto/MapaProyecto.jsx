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
import { crearCeldasMapaRuido } from "./ruidoHeatmap";
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

const estiloCallePendiente = {
  color: "#facc15",
  weight: 6,
  dashArray: "10, 6",
  opacity: 1,
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

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
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
          const layer = L.polyline(lineStringALatLngs(calleDb.trazo_calle), {
            color: nivelRuido > 0
              ? obtenerColorRuido(nivelRuido).color
              : calleDb.color_asignado || "#FF0000",
            weight: 5,
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

    if (superficieRuidoRef.current) {
      map.removeLayer(superficieRuidoRef.current);
      superficieRuidoRef.current = null;
    }
    if (!mostrarSuperficieRuido || !proyecto?.zona || calles.length === 0) return;

    const panelRuido = map.getPane("superficieRuido") || map.createPane("superficieRuido");
    panelRuido.style.zIndex = "350";
    const celdas = crearCeldasMapaRuido(calles, proyecto.zona);
    if (celdas.length === 0) return;

    const capas = L.featureGroup(
      celdas.map((feature) =>
        L.geoJSON(feature, {
          pane: "superficieRuido",
          interactive: false,
          style: ({ properties }) => ({
            color: properties.color,
            fillColor: properties.color,
            fillOpacity: 0.42,
            opacity: 0,
            weight: 0,
          }),
        })
      )
    ).addTo(map);
    superficieRuidoRef.current = capas;

    return () => {
      if (map.hasLayer(capas)) map.removeLayer(capas);
      if (superficieRuidoRef.current === capas) superficieRuidoRef.current = null;
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
        templineStyle: estiloCallePendiente,
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

        layer.setStyle(estiloCallePendiente);
        layer.bringToFront();

        setTrazoPendiente({ layer, trazoGeoJSON: trazo });
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
      color: "#ffffff",
      weight: 12,
      opacity: 0.55,
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
    calleActual.layer.setStyle({ weight: 8 });

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
          weight: 5,
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
          weight: 5,
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
      modalDatosIniciales.layer.setStyle({ weight: 5 });
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
      <main className="min-h-screen bg-dash-bg px-6 py-12 text-dash-text">
        <p>Proyecto no encontrado.</p>
        <button onClick={() => navigate("/proyectos")} className="mt-4 text-sm text-dash-accent">
          Volver a proyectos
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-dash-bg px-6 py-8 font-sans text-dash-text">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/proyectos")}
          className="mb-6 text-sm text-dash-text-soft hover:text-dash-text"
        >
          ← Volver a proyectos
        </button>

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <EstadoBadge estado={proyecto.estado} />
            <span className="text-xs text-dash-text-soft">Mapa con OpenStreetMap</span>
          </div>

          <h1 className="text-3xl font-semibold">{proyecto.nombre}</h1>

          {(proyecto.comuna || proyecto.region) && (
            <p className="mt-2 text-sm text-dash-text-soft">
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
                className="flex-1 border border-dash-border bg-[#162326] px-4 py-2.5 text-sm text-white outline-none placeholder:text-dash-text-soft focus:border-dash-accent"
              />

              <button
                onClick={buscarUbicacion}
                disabled={buscando}
                className="bg-dash-accent px-5 py-2.5 text-sm font-semibold text-dash-bg hover:opacity-90 disabled:opacity-60"
              >
                {buscando ? "Buscando..." : "Buscar"}
              </button>

              <button
                onClick={centrarEnZona}
                disabled={!proyecto.zona}
                title={!proyecto.zona ? "Primero delimita una zona" : "Centrar el mapa en la zona delimitada"}
                className={`whitespace-nowrap border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  proyecto.zona
                    ? "border-dash-accent text-dash-accent hover:bg-dash-accent/10"
                    : "cursor-not-allowed border-dash-border text-dash-text-soft/50"
                }`}
              >
                📍 Centrar en zona
              </button>
            </div>

            {errorBusqueda && <p className="mb-3 text-sm text-red-400">{errorBusqueda}</p>}

            {delimitando && (
              <div className="mb-3 flex items-center gap-2 border border-dash-accent bg-dash-accent/10 px-4 py-2 text-sm font-medium text-dash-accent">
                <span className="h-2 w-2 animate-pulse rounded-full bg-dash-accent" />
                {delimitando === "area" && "Modo delimitación de zona activo"}
                {delimitando === "calle" && "Modo trazado de calle activo: Termina el trazado con Enter o con doble click"}
                {delimitando === "mark" && "Modo marcador activo: haz clic en el mapa para colocarlo"}
              </div>
            )}

            {editandoZona && (
              <div className="mb-3 flex items-center gap-2 border border-yellow-500 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
                Editando zona: arrastra los vértices y luego "Guardar zona"
              </div>
            )}

            {trazoPendiente && (
              <div className="mb-3 flex items-center gap-2 border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Trazo listo — guarda los datos de la calle o cancélalo desde el panel lateral
              </div>
            )}

            <section className="relative h-[520px] overflow-hidden border border-dash-border">
              <div ref={mapRef} className="h-[520px] w-full" />
            </section>

            {errorCalles && <p className="mt-4 text-sm text-red-400">{errorCalles}</p>}
            {cargandoCalles && (
              <p className="mt-4 text-sm text-dash-text-soft">Cargando calles guardadas...</p>
            )}
          </div>

          <div className="flex w-64 flex-col gap-y-4">
            <div className="border border-dash-border bg-[#101b1d] p-3">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-dash-text-soft">
                Zona de trabajo
              </h2>

              {!proyecto.zona && (
                <button
                  onClick={() => setDelimitando((actual) => (actual === "area" ? null : "area"))}
                  disabled={modoOcupado && delimitando !== "area"}
                  className={`w-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                    delimitando === "area"
                      ? "bg-dash-bg text-dash-accent ring-2 ring-dash-accent"
                      : "bg-dash-accent text-dash-bg hover:opacity-90"
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
                    className="flex-1 bg-dash-accent px-2 py-2 text-sm font-semibold text-dash-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Editar
                  </button>
                  <button
                    onClick={borrarZona}
                    disabled={modoOcupado}
                    className="flex-1 border border-red-500 px-2 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Borrar
                  </button>
                </div>
              )}

              {proyecto.zona && editandoZona && (
                <div className="flex gap-2">
                  <button
                    onClick={guardarEdicionZona}
                    className="flex-1 bg-dash-accent px-2 py-2 text-sm font-semibold text-dash-bg hover:opacity-90"
                  >
                    Guardar zona
                  </button>
                  <button
                    onClick={cancelarEdicionZona}
                    className="flex-1 border border-dash-border px-2 py-2 text-sm font-semibold text-dash-text hover:bg-[#1d2c2f]"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div className="h-px w-full bg-dash-border" />

            <div className="border border-dash-border bg-[#101b1d] p-3">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-dash-text-soft">Calles</h2>

              {!trazoPendiente && delimitando !== "calle" && (
                <button
                  onClick={() => setDelimitando("calle")}
                  disabled={!proyecto.zona || modoOcupado}
                  title={!proyecto.zona ? "Primero delimita una zona" : undefined}
                  className="w-full bg-dash-accent px-2 py-2 text-sm font-semibold text-dash-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Crear calle
                </button>
              )}

              {!trazoPendiente && delimitando === "calle" && (
                <button
                  onClick={() => setDelimitando(null)}
                  className="w-full bg-dash-bg px-2 py-2 text-sm font-semibold text-dash-accent ring-2 ring-dash-accent"
                >
                  Cancelar trazado
                </button>
              )}

              {trazoPendiente && (
                <div className="flex gap-2">
                  <button
                    onClick={abrirModalParaGuardarTrazo}
                    className="flex-1 bg-dash-accent px-2 py-2 text-sm font-semibold text-dash-bg hover:opacity-90"
                  >
                    Guardar calle
                  </button>
                  <button
                    onClick={cancelarTrazoPendiente}
                    className="flex-1 border border-red-500 px-2 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10"
                  >
                    Cancelar trazado
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setDelimitando((actual) => (actual === "mark" ? null : "mark"))}
              disabled={modoOcupado && delimitando !== "mark"}
              className={`w-full px-2 py-2 text-sm font-semibold transition-colors ${
                delimitando === "mark"
                  ? "bg-dash-bg text-dash-accent ring-2 ring-dash-accent"
                  : "bg-dash-accent text-dash-bg hover:opacity-90"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {delimitando === "mark" ? "Dejar de añadir marcador" : "Añadir marcador"}
            </button>

            {delimitando === "mark" && (
              <div className="border border-dash-border bg-[#162326] p-4">
                <h2 className="mb-3 text-sm font-semibold">Parámetros del marcador</h2>
                <label className="flex items-center justify-between text-sm">
                  <span>Test</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={parametroTest}
                    onChange={(e) => cambiarNumero(e, setParametroTest)}
                    className="w-20 border border-dash-border bg-[#10191b] px-2 py-1 text-right text-white outline-none"
                  />
                </label>
              </div>
            )}

            <div className="border border-dash-border bg-[#101b1d] p-3">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-dash-text-soft">
                Niveles de ruido
              </h2>
              <div className="flex flex-col gap-2">
                {NIVELES_RUIDO.map(({ color, etiqueta }) => (
                  <div key={color} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                    <span>{etiqueta}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-dash-text-soft">
                Se muestran celdas desde 45 dB(A). La propagación no considera edificios ni terreno.
              </p>
              <button
                type="button"
                onClick={() => setMostrarSuperficieRuido((visible) => !visible)}
                disabled={!proyecto.zona || !hayTraficoRegistrado}
                className="mt-3 w-full border border-dash-border px-2 py-2 text-sm font-semibold text-dash-text hover:bg-[#1d2c2f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mostrarSuperficieRuido ? "Ocultar superficie" : "Mostrar superficie"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setInstruccionesAbiertas(true)}
              className="w-full border border-dash-border px-2 py-2 text-sm font-semibold text-dash-text hover:bg-[#1d2c2f]"
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

      <InstruccionesMapaModal
        abierto={instruccionesAbiertas}
        onCerrar={() => setInstruccionesAbiertas(false)}
      />
    </main>
  );
};

export default MapaProyecto;