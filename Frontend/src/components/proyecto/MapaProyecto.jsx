import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import EstadoBadge from "./EstadoBadge";
import clientAxios from "../config/clienteAxios";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "@geoman-io/leaflet-geoman-free";

const colores = [
  "#FF0000",
  "#0000FF",
  "#00AA00",
  "#FFFF00",
  "#FFA500",
  "#800080",
  "#000000",
  "#FFFFFF",
];

const MapaProyecto = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [proyecto, setProyecto] = useState(location.state?.proyecto || null);
  const [cargandoProyecto, setCargandoProyecto] = useState(
    !location.state?.proyecto
  );

  const [calles, setCalles] = useState([]);
  const [marcadores, setMarcadores] = useState([]);

  const [delimitando, setDelimitando] = useState(null);
  const [coordenadas, setCoordenadas] = useState("");
  const [errorCoordenadas, setErrorCoordenadas] = useState(false);
  const [buscando, setBuscando] = useState(false);

  const [delimitandoCalle, setDelimitandoCalle] = useState(false);
  const [delimitandoArea, setDelimitandoArea] = useState(false);
  const [delimitandoMarcador, setDelimitandoMarcador] = useState(false);

  const [calleSeleccionada, setCalleSeleccionada] = useState(null);
  const [editandoCalle, setEditandoCalle] = useState(false);

  const [colorCalle, setColorCalle] = useState("#FF0000");
  const [livianos, setLivianos] = useState(0);
  const [medianos, setMedianos] = useState(0);
  const [pesados, setPesados] = useState(0);
  const [testCalle, setTestCalle] = useState(0);

  const [parametroTest, setParametroTest] = useState(0);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (proyecto) return;

    clientAxios
      .get(`/proyectos/${id}`)
      .then(({ data }) => setProyecto(data.data))
      .catch(() => setProyecto(null))
      .finally(() => setCargandoProyecto(false));
  }, [id, proyecto]);

  useEffect(() => {
    if (!mapRef.current || !proyecto) return;

    const map = L.map(mapRef.current).setView(
      [-39.8142, -73.2459],
      13
    );

    mapInstance.current = map;

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "© OpenStreetMap contributors",
      }
    ).addTo(map);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [proyecto]);

  useEffect(() => {
    const map = mapInstance.current;

    if (!map) return;

    if (delimitando === "area") {
      map.pm.enableDraw("Polygon");
      setDelimitandoArea(true);
    } else {
      setDelimitandoArea(false);
    }

    if (delimitando === "calle") {
      map.pm.enableDraw("Line");
      setDelimitandoCalle(true);
    } else {
      setDelimitandoCalle(false);
    }

    if (delimitando === "mark") {
      map.pm.enableDraw("Marker");
      setDelimitandoMarcador(true);
    } else {
      setDelimitandoMarcador(false);
    }

    if (delimitando === null) {
      map.pm.disableDraw();
    }
  }, [delimitando, proyecto]);

  useEffect(() => {
    const map = mapInstance.current;

    if (!map) return;

    const dibujoTerminado = (e) => {
      if (e.shape === "Line") {
        const calle = e.layer;

        calle.setStyle({
          color: colorCalle,
          weight: 5,
        });

        const nuevaCalle = {
          layer: calle,
          color: colorCalle,
          vehiculos: {
            livianos: livianos,
            medianos: medianos,
            pesados: pesados,
          },
          test: testCalle,
        };

        setCalles((actuales) => [
          ...actuales,
          nuevaCalle,
        ]);

        calle.on("click", () => {
          setCalleSeleccionada(nuevaCalle);
        });
      }

      if (e.shape === "Marker") {
        const marcador = e.layer;

        const nuevoMarcador = {
          layer: marcador,
          parametroTest: parametroTest,
        };

        setMarcadores((actuales) => [
          ...actuales,
          nuevoMarcador,
        ]);
      }

      setDelimitando(null);
    };

    map.on("pm:create", dibujoTerminado);

    return () => {
      map.off("pm:create", dibujoTerminado);
    };
  }, [
    colorCalle,
    livianos,
    medianos,
    pesados,
    testCalle,
    parametroTest,
    proyecto,
  ]);

  useEffect(() => {
    const handlers = new Map();

    calles.forEach((calle) => {
      const handler = () => {
        setCalleSeleccionada(calle);
      };

      handlers.set(calle.layer, handler);
      calle.layer.on("click", handler);
    });

    return () => {
      handlers.forEach((handler, calle) => {
        calle.off("click", handler);
      });
    };
  }, [calles]);

  const comenzarEdicion = () => {
    if (!calleSeleccionada) return;

    setColorCalle(calleSeleccionada.color);
    setLivianos(calleSeleccionada.vehiculos.livianos);
    setMedianos(calleSeleccionada.vehiculos.medianos);
    setPesados(calleSeleccionada.vehiculos.pesados);
    setTestCalle(calleSeleccionada.test);

    calleSeleccionada.layer.pm.enable();

    setEditandoCalle(true);
    setDelimitando(null);
  };

  const guardarCambiosCalle = () => {
    if (!calleSeleccionada) return;

    calleSeleccionada.layer.setStyle({
      color: colorCalle,
      weight: 5,
    });

    setCalles((actuales) =>
      actuales.map((calle) =>
        calle === calleSeleccionada
          ? {
              ...calle,
              color: colorCalle,
              vehiculos: {
                livianos: livianos,
                medianos: medianos,
                pesados: pesados,
              },
              test: testCalle,
            }
          : calle
      )
    );

    calleSeleccionada.layer.pm.disable();

    setEditandoCalle(false);
  };

  const cancelarEdicionCalle = () => {
    if (!calleSeleccionada) return;

    calleSeleccionada.layer.pm.disable();

    setEditandoCalle(false);
  };

  const prepararNuevaCalle = () => {
    if (calleSeleccionada && editandoCalle) {
      calleSeleccionada.layer.pm.disable();
    }

    setCalleSeleccionada(null);
    setEditandoCalle(false);

    setColorCalle("#FF0000");
    setLivianos(0);
    setMedianos(0);
    setPesados(0);
    setTestCalle(0);

    setDelimitando((actual) =>
      actual === "calle" ? null : "calle"
    );
  };

  const cambiarNumero = (e, setter) => {
    const valor = e.target.value.replace(/\D/g, "");

    setter(valor === "" ? 0 : Number(valor));
  };

  const parsearComoCoordenadas = (texto) => {
    const partes = texto
      .split(",")
      .map((valor) => valor.trim());

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

      mapInstance.current?.flyTo(
        [comoCoordenadas.lat, comoCoordenadas.lng],
        13
      );

      return;
    }

    setBuscando(true);
    setErrorCoordenadas(false);

    try {
      const respuesta = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          texto
        )}`
      );

      if (!respuesta.ok) {
        throw new Error("Fallo la consulta de geocodificación");
      }

      const resultados = await respuesta.json();

      if (!resultados.length) {
        setErrorCoordenadas(true);
        return;
      }

      const { lat, lon } = resultados[0];

      mapInstance.current?.flyTo(
        [Number(lat), Number(lon)],
        13
      );
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

        <button
          onClick={() => navigate("/proyectos")}
          className="mt-4 text-sm text-dash-accent"
        >
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

            <span className="text-xs text-dash-text-soft">
              Mapa con OpenStreetMap
            </span>
          </div>

          <h1 className="text-3xl font-semibold">
            {proyecto.nombre}
          </h1>

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
                  if (e.key === "Enter") {
                    buscarUbicacion();
                  }
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
            </div>

            {errorCoordenadas && (
              <p className="mb-3 text-sm text-red-400">
                No se encontró esa coordenada o ubicación. Intenta con otro nombre o formato "lat, lng".
              </p>
            )}

            <section className="relative h-[520px] overflow-hidden border border-dash-border">
              <div
                ref={mapRef}
                className="h-[520px] w-full"
              />
            </section>

            <p className="mt-4 text-sm text-dash-text-soft">
              {delimitando === "calle"
                ? "Haz click en el mapa para comenzar a crear la calle."
                : delimitando === "area"
                ? "Haz click en el mapa para definir el área."
                : delimitando === "mark"
                ? "Haz click en el mapa para colocar el marcador."
                : calleSeleccionada
                ? "Calle seleccionada."
                : "Selecciona una herramienta para comenzar."}
            </p>
          </div>

          <div className="flex w-64 flex-col gap-y-3">
            {(delimitando === "calle" || editandoCalle) && (
              <div className="border border-dash-border bg-[#162326] p-4">
                <h2 className="mb-3 text-sm font-semibold">
                  Parámetros de calle
                </h2>

                <p className="mb-2 text-xs text-dash-text-soft">
                  Color
                </p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {colores.map((color) => (
                    <button
                      key={color}
                      onClick={() => setColorCalle(color)}
                      className="h-7 w-7 border-2"
                      style={{
                        backgroundColor: color,
                        borderColor:
                          colorCalle === color
                            ? "#ffffff"
                            : "#555555",
                      }}
                    />
                  ))}
                </div>

                <p className="mb-2 text-xs text-dash-text-soft">
                  Vehículos
                </p>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-between text-sm">
                    <span>Livianos</span>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={livianos}
                      onChange={(e) =>
                        cambiarNumero(e, setLivianos)
                      }
                      className="w-20 border border-dash-border bg-[#10191b] px-2 py-1 text-right text-white outline-none"
                    />
                  </label>

                  <label className="flex items-center justify-between text-sm">
                    <span>Medianos</span>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={medianos}
                      onChange={(e) =>
                        cambiarNumero(e, setMedianos)
                      }
                      className="w-20 border border-dash-border bg-[#10191b] px-2 py-1 text-right text-white outline-none"
                    />
                  </label>

                  <label className="flex items-center justify-between text-sm">
                    <span>Pesados</span>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={pesados}
                      onChange={(e) =>
                        cambiarNumero(e, setPesados)
                      }
                      className="w-20 border border-dash-border bg-[#10191b] px-2 py-1 text-right text-white outline-none"
                    />
                  </label>
                </div>

                <label className="mt-3 flex items-center justify-between text-sm">
                  <span>Test</span>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={testCalle}
                    onChange={(e) =>
                      cambiarNumero(e, setTestCalle)
                    }
                    className="w-20 border border-dash-border bg-[#10191b] px-2 py-1 text-right text-white outline-none"
                  />
                </label>

                {editandoCalle && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={guardarCambiosCalle}
                      className="flex-1 bg-dash-accent px-2 py-2 text-xs font-semibold text-dash-bg hover:opacity-90"
                    >
                      Guardar
                    </button>

                    <button
                      onClick={cancelarEdicionCalle}
                      className="flex-1 border border-dash-border px-2 py-2 text-xs font-semibold text-dash-text hover:bg-[#1d2c2f]"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}

            {delimitando === "mark" && (
              <div className="border border-dash-border bg-[#162326] p-4">
                <h2 className="mb-3 text-sm font-semibold">
                  Parámetros del marcador
                </h2>

                <label className="flex items-center justify-between text-sm">
                  <span>Test</span>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={parametroTest}
                    onChange={(e) =>
                      cambiarNumero(e, setParametroTest)
                    }
                    className="w-20 border border-dash-border bg-[#10191b] px-2 py-1 text-right text-white outline-none"
                  />
                </label>
              </div>
            )}

            <button
              onClick={() =>
                setDelimitando((actual) =>
                  actual === "area" ? null : "area"
                )
              }
              className="w-full bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:opacity-90"
            >
              {delimitandoArea
                ? "Terminar delimitación"
                : "Delimitar zona"}
            </button>

            <button
              onClick={prepararNuevaCalle}
              className="w-full bg-dash-accent px-2 py-2 text-sm font-semibold text-dash-bg hover:opacity-90"
            >
              {delimitandoCalle
                ? "Dejar de crear calle"
                : "Crear calle"}
            </button>

            <button
              onClick={() =>
                setDelimitando((actual) =>
                  actual === "mark" ? null : "mark"
                )
              }
              className="w-full bg-dash-accent px-2 py-2 text-sm font-semibold text-dash-bg hover:opacity-90"
            >
              {delimitandoMarcador
                ? "Dejar de añadir marcador"
                : "Añadir marcador"}
            </button>

            <button
              onClick={comenzarEdicion}
              disabled={!calleSeleccionada || editandoCalle}
              className={`w-full px-2 py-2 text-sm font-semibold ${
                !calleSeleccionada || editandoCalle
                  ? "cursor-not-allowed bg-gray-600 text-gray-400"
                  : "bg-dash-accent text-dash-bg hover:opacity-90"
              }`}
            >
              {editandoCalle
                ? "Editando calle"
                : "Editar calle"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MapaProyecto;