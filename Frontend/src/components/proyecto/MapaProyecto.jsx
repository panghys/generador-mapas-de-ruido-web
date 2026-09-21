import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import booleanWithin from "@turf/boolean-within";
import { lineString, polygon as turfPolygon } from "@turf/helpers";
import EstadoBadge from "./EstadoBadge";
import clientAxios from "../config/clienteAxios";
import CalleModal from "./CalleModal";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "@geoman-io/leaflet-geoman-free";

// ---- Helpers de conversión Leaflet <-> GeoJSON ----

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
  const anillo = layer.getLatLngs()[0]; // asumimos polígono sin huecos
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

// Valida que el trazo de la calle caiga completo dentro de la zona
const calleEstaDentroDeZona = (trazoGeoJSON, zonaGeoJSON) => {
  if (!zonaGeoJSON) return false;

  try {
    const linea = lineString(trazoGeoJSON.coordinates);
    const area = turfPolygon(zonaGeoJSON.coordinates);
    return booleanWithin(linea, area);
  } catch (err) {
    return false;
  }
};

const estiloZona = {
  color: "#2dd4bf",
  weight: 2,
  fillColor: "#2dd4bf",
  fillOpacity: 0.15,
};

// Estilo bien contrastante para que el trazo pendiente nunca pase desapercibido
const estiloCallePendiente = {
  color: "#facc15",
  weight: 6,
  dashArray: "10, 6",
  opacity: 1,
};

const MapaProyecto = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: proyectoId } = useParams();

  const [proyecto, setProyecto] = useState(location.state?.proyecto || null);
  const [cargandoProyecto, setCargandoProyecto] = useState(!location.state?.proyecto);
  const [cargandoCalles, setCargandoCalles] = useState(false);

  const [calles, setCalles] = useState([]);
  const [marcadores, setMarcadores] = useState([]);

  const [delimitando, setDelimitando] = useState(null); // "area" | "calle" | "mark" | null
  const [coordenadas, setCoordenadas] = useState("");
  const [errorCoordenadas, setErrorCoordenadas] = useState(false);
  const [buscando, setBuscando] = useState(false);

  // Trazo recién dibujado, válido, pero aún no confirmado/guardado por el usuario
  const [trazoPendiente, setTrazoPendiente] = useState(null); // { layer, trazoGeoJSON } | null

  const [modalCalleAbierto, setModalCalleAbierto] = useState(false);
  const [modalDatosIniciales, setModalDatosIniciales] = useState(null);

  const [editandoZona, setEditandoZona] = useState(false);

  const [parametroTest, setParametroTest] = useState(0);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const zonaLayerRef = useRef(null);

  // Mientras haya cualquier acción activa se bloquean las demás, para que no se pisen
  const modoOcupado =
    delimitando !== null || editandoZona || modalCalleAbierto || trazoPendiente !== null;

  // Trae el proyecto si no llegó por navegación (ej: recarga directa)
  useEffect(() => {
    if (proyecto) return;

    clientAxios
      .get(`/proyectos/${proyectoId}`)
      .then(({ data }) => setProyecto(data.data))
      .catch(() => setProyecto(null))
      .finally(() => setCargandoProyecto(false));
  }, [proyectoId, proyecto]);

  // Crea el mapa UNA sola vez, dibuja la zona guardada y carga las calles guardadas.
  // Depende de proyectoId (estable), no del objeto proyecto completo, para no
  // recrear el mapa cada vez que se guarda la zona o se edita una calle.
  useEffect(() => {
    if (!mapRef.current || !proyectoId || !proyecto) return;

    const map = L.map(mapRef.current).setView([-39.8142, -73.2459], 13);
    mapInstance.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    if (proyecto.zona) {
      const capaZona = L.polygon(polygonALatLngs(proyecto.zona), estiloZona).addTo(map);
      zonaLayerRef.current = capaZona;
    }

    setCargandoCalles(true);
    clientAxios
      .get(`/proyectos/${proyectoId}/calles`)
      .then(({ data }) => {
        const cargadas = data.data.map((calleDb) => {
          const layer = L.polyline(lineStringALatLngs(calleDb.trazo_calle), {
            color: calleDb.color_asignado || "#FF0000",
            weight: 5,
          }).addTo(map);

          const calleObj = { ...calleDb, layer };
          layer.on("click", () => abrirModalParaEditar(calleObj));
          return calleObj;
        });

        setCalles(cargadas);
      })
      .catch(() => {})
      .finally(() => setCargandoCalles(false));

    return () => {
      map.remove();
      mapInstance.current = null;
      zonaLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  // Activa/desactiva las herramientas de dibujo de Geoman según el modo elegido
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (delimitando === "area") {
      map.pm.enableDraw("Polygon");
    } else if (delimitando === "calle") {
      map.pm.enableDraw("Line");
    } else if (delimitando === "mark") {
      map.pm.enableDraw("Marker");
    } else {
      map.pm.disableDraw();
    }
  }, [delimitando]);

  // Reacciona cuando Geoman termina un dibujo (línea, polígono o marcador)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const dibujoTerminado = (e) => {
      if (e.shape === "Line") {
        const layer = e.layer;
        const trazo = layerALineString(layer);

        // Sin zona delimitada no se puede validar contención -> se rechaza
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

        // El trazo queda visible y resaltado; el usuario decide guardar o cancelar
        // desde los botones del panel lateral — el modal ya NO se abre automático.
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

  // ---- Zona del proyecto ----

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

  // ---- Calles ----

  const abrirModalParaEditar = (calle) => {
    if (modoOcupado) return; // evita abrir el modal si hay otra acción en curso

    calle.layer.bringToFront();
    calle.layer.setStyle({ weight: 8 }); // resalta la línea seleccionada

    setModalDatosIniciales(calle);
    setModalCalleAbierto(true);
  };

  const abrirModalParaGuardarTrazo = () => {
    if (!trazoPendiente) return;
    setModalDatosIniciales(null); // modo creación
    setModalCalleAbierto(true);
  };

  const cancelarTrazoPendiente = () => {
    if (!trazoPendiente) return;
    trazoPendiente.layer.remove();
    setTrazoPendiente(null);
  };

  const guardarCalleDesdeModal = async (datos) => {
    try {
      if (modalDatosIniciales?.id) {
        // edición de una calle existente
        const { data } = await clientAxios.put(
          `/proyectos/${proyectoId}/calles/${modalDatosIniciales.id}`,
          datos
        );

        modalDatosIniciales.layer.setStyle({ color: datos.color_asignado, weight: 5 });

        setCalles((actuales) =>
          actuales.map((c) => (c.id === modalDatosIniciales.id ? { ...c, ...data.data } : c))
        );
      } else {
        // confirmación de un trazo pendiente
        const layer = trazoPendiente.layer;

        const { data } = await clientAxios.post(`/proyectos/${proyectoId}/calles`, {
          ...datos,
          trazo_calle: trazoPendiente.trazoGeoJSON,
        });

        layer.setStyle({ color: datos.color_asignado, weight: 5, dashArray: null, opacity: 1 });

        const nuevaCalle = { ...data.data, layer };
        layer.on("click", () => abrirModalParaEditar(nuevaCalle));

        setCalles((actuales) => [...actuales, nuevaCalle]);
        setTrazoPendiente(null);
      }

      setModalCalleAbierto(false);
      setModalDatosIniciales(null);
    } catch (err) {
      // se deja el modal abierto para que el usuario reintente
    }
  };

  const cancelarModalCalle = () => {
    if (!modalDatosIniciales) {
      // se estaba confirmando un trazo nuevo: descarta el trazo pendiente sin tocar la BD
      cancelarTrazoPendiente();
    } else {
      // era edición: solo se quita el resaltado, nada se pierde
      modalDatosIniciales.layer.setStyle({ weight: 5 });
    }

    setModalCalleAbierto(false);
    setModalDatosIniciales(null);
  };

  const eliminarCalleDesdeModal = async () => {
    if (!modalDatosIniciales?.id) return;

    try {
      await clientAxios.delete(`/proyectos/${proyectoId}/calles/${modalDatosIniciales.id}`);
      mapInstance.current.removeLayer(modalDatosIniciales.layer);
      setCalles((actuales) => actuales.filter((c) => c.id !== modalDatosIniciales.id));
      setModalCalleAbierto(false);
      setModalDatosIniciales(null);
    } catch (err) {
      // no se pudo eliminar; el modal se deja abierto
    }
  };

  const cambiarNumero = (e, setter) => {
    const valor = e.target.value.replace(/\D/g, "");
    setter(valor === "" ? 0 : Number(valor));
  };

  // ---- Buscador de ciudad / coordenadas ----

  const parsearComoCoordenadas = (texto) => {
    const partes = texto.split(",").map((valor) => valor.trim());
    if (partes.length !== 2) return null;

    const lat = Number(partes[0]);
    const lng = Number(partes[1]);

    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    if (lat < -90 || lat > 90) return null;
    if (lng < -180 || lng > 180) return null;

    return { lat, lng };
  };

  const buscarUbicacion = async () => {
    const texto = coordenadas.trim();
    if (!texto) return;

    const comoCoordenadas = parsearComoCoordenadas(texto);
    if (comoCoordenadas) {
      setErrorCoordenadas(false);
      mapInstance.current?.flyTo([comoCoordenadas.lat, comoCoordenadas.lng], 13);
      return;
    }

    setBuscando(true);
    setErrorCoordenadas(false);

    try {
      const respuesta = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(texto)}`
      );

      if (!respuesta.ok) throw new Error("Fallo la consulta de geocodificación");

      const resultados = await respuesta.json();

      if (!resultados.length) {
        setErrorCoordenadas(true);
        return;
      }

      const { lat, lon } = resultados[0];
      mapInstance.current?.flyTo([Number(lat), Number(lon)], 13);
    } catch (err) {
      setErrorCoordenadas(true);
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
          <p className="mt-2 text-sm text-dash-text-soft">
            {proyecto.comuna}, {proyecto.region}
          </p>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                value={coordenadas}
                onChange={(e) => {
                  setCoordenadas(e.target.value);
                  setErrorCoordenadas(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") buscarUbicacion();
                }}
                placeholder="Ej: Valdivia, Osorno o -39.8142, -73.2459"
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

            {errorCoordenadas && (
              <p className="mb-3 text-sm text-red-400">
                No se encontró esa coordenada o ubicación. Intenta con otro nombre o formato "lat, lng".
              </p>
            )}

            {delimitando && (
              <div className="mb-3 flex items-center gap-2 border border-dash-accent bg-dash-accent/10 px-4 py-2 text-sm font-medium text-dash-accent">
                <span className="h-2 w-2 animate-pulse rounded-full bg-dash-accent" />
                {delimitando === "area" && "Modo delimitación activo: haz clic en el mapa para trazar la zona"}
                {delimitando === "calle" && "Modo trazado de calle activo: haz clic en el mapa para dibujar la calle"}
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
          </div>
        </div>
      </div>

      <CalleModal
        abierto={modalCalleAbierto}
        datosIniciales={modalDatosIniciales}
        onGuardar={guardarCalleDesdeModal}
        onEliminar={eliminarCalleDesdeModal}
        onCancelar={cancelarModalCalle}
      />
    </main>
  );
};

export default MapaProyecto;