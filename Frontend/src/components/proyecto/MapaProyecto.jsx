import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import EstadoBadge from "./EstadoBadge";
import clientAxios from "../config/clienteAxios";

const MapaProyecto = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [proyecto, setProyecto] = useState(location.state?.proyecto || null);
  const [cargandoProyecto, setCargandoProyecto] = useState(!location.state?.proyecto);

  const [delimitando, setDelimitando] = useState(false);
  const [coordenadas, setCoordenadas] = useState("");
  const [errorCoordenadas, setErrorCoordenadas] = useState(false);
  const [buscando, setBuscando] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const cuadradoRef = useRef(null);

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
        attribution: "&copy; OpenStreetMap contributors",
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

    const clickMapa = (e) => {
      if (!delimitando) return;

      if (cuadradoRef.current) {
        map.removeLayer(cuadradoRef.current);
      }

      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      const tamaño = 0.002;

      const limites = [
        [lat - tamaño, lng - tamaño],
        [lat + tamaño, lng + tamaño],
      ];

      cuadradoRef.current = L.rectangle(limites, {
        color: "#2dd4bf",
        weight: 2,
        fillColor: "#2dd4bf",
        fillOpacity: 0.2,
      }).addTo(map);
    };

    map.on("click", clickMapa);

    return () => {
      map.off("click", clickMapa);
    };
  }, [delimitando]);

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

    // Caso 1: el usuario escribió coordenadas "lat, lng"
    const comoCoordenadas = parsearComoCoordenadas(texto);
    if (comoCoordenadas) {
      setErrorCoordenadas(false);
      mapInstance.current?.flyTo([comoCoordenadas.lat, comoCoordenadas.lng], 13);
      return;
    }

    // Caso 2: el usuario escribió un nombre de ciudad/localidad -> geocodificar
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

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
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

          <button
            onClick={() => setDelimitando((actual) => !actual)}
            className="bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:opacity-90"
          >
            {delimitando ? "Terminar delimitación" : "Delimitar zona"}
          </button>
        </div>

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

        <section className="relative min-h-[520px] overflow-hidden border border-dash-border">
          <div
            ref={mapRef}
            className="h-[520px] w-full"
          />
        </section>

        <p className="mt-4 text-sm text-dash-text-soft">
          {delimitando
            ? "Haz click en el mapa para colocar la zona."
            : "Selecciona Delimitar zona para comenzar a definir el área."}
        </p>
      </div>
    </main>
  );
};

export default MapaProyecto;