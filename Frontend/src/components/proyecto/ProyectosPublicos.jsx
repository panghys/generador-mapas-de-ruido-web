
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import clientAxios from "../config/clienteAxios";
import CircularCarousel from "../CircularCarousel";

import MapaRuidoPreview from "./MapaRuidoPreview";

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

const fecha = (valor) => {
  if (!valor) return "Sin fecha";

  const objeto = new Date(valor);

  return Number.isNaN(objeto.getTime())
    ? "Sin fecha"
    : objeto.toLocaleDateString("es-CL");
};

// Convertir un lugar escrito en coordenadas.
async function geocodificar(texto, signal) {
  const url = new URL(
    "https://nominatim.openstreetmap.org/search"
  );

  url.searchParams.set("q", texto);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const respuesta = await fetch(url, {
    signal,
    headers: {
      "Accept-Language": "es",
    },
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo buscar la ubicación");
  }

  const datos = await respuesta.json();

  return datos[0]
    ? {
        lat: Number(datos[0].lat),
        lng: Number(datos[0].lon),
        nombre: datos[0].display_name,
      }
    : null;
}

// =====================================================
// PANTALLA DE CARGA
// =====================================================

function PantallaCarga() {
  return (
    <div className="flex min-h-[calc(100vh-100px)] flex-col items-center justify-center bg-[#F4F7FA] px-6">
      <div
        className="flex items-center justify-center gap-3"
        role="status"
        aria-label="Cargando proyectos públicos"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              backgroundColor: "#155B91",
              animation: "puntosCarga 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-[#153C5B]">
        Cargando comunidad
      </h2>

      <p className="mt-2 text-center text-sm text-[#718397]">
        Estamos cargando los proyectos públicos...
      </p>

      <style>
        {`
          @keyframes puntosCarga {
            0%, 60%, 100% {
              transform: scale(1);
              opacity: 0.5;
            }
            30% {
              transform: scale(1.45);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function ProyectosPublicos() {
  const navigate = useNavigate();

  const [todos, setTodos] = useState([]);
  const [resultados, setResultados] = useState([]);

  const [texto, setTexto] = useState("");
  const [radio, setRadio] = useState(30);
  const [ubicacion, setUbicacion] = useState("");

  const [cargando, setCargando] = useState(true);
  const [buscando, setBuscando] = useState(false);

  const [error, setError] = useState("");
  const [indiceActivo, setIndiceActivo] = useState(0);

  // =====================================================
  // 1. CARGAR PROYECTOS PÚBLICOS
  // =====================================================

  useEffect(() => {
    const controlador = new AbortController();

    async function cargarProyectos() {
      try {
        setCargando(true);
        setError("");

        const respuesta = await clientAxios.get(
          "/proyectos/publicos",
          {
            signal: controlador.signal,
          }
        );

        if (controlador.signal.aborted) return;

        const lista = respuesta.data.data || [];

        setTodos(lista);
        setResultados(lista);
      } catch (err) {
        if (
          err.name !== "CanceledError" &&
          err.name !== "AbortError"
        ) {
          setError(
            "No se pudieron cargar los proyectos públicos."
          );
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargarProyectos();

    return () => controlador.abort();
  }, []);

  // =====================================================
  // 2. BUSCADOR DEL DASHBOARD
  // =====================================================

  useEffect(() => {
    if (cargando) return;

    const controlador = new AbortController();

    const timer = setTimeout(async () => {
      const q = texto.trim();

      setUbicacion("");
      setError("");

      if (!q) {
        setResultados(todos);
        setBuscando(false);
        return;
      }

      setBuscando(true);

      try {
        // Buscar coincidencias por texto.
        const respuestaTexto = await clientAxios.get(
          "/proyectos/publicos",
          {
            params: { q },
            signal: controlador.signal,
          }
        );

        const mapasTexto = respuestaTexto.data.data || [];

        // Buscar SIEMPRE por ubicación geográfica.
        let mapasCercanos = [];
        let lugarEncontrado = null;

        try {
          lugarEncontrado = await geocodificar(
            q,
            controlador.signal
          );

          if (lugarEncontrado) {
            const respuestaGeo = await clientAxios.get(
              "/proyectos/publicos",
              {
                params: {
                  lat: lugarEncontrado.lat,
                  lng: lugarEncontrado.lng,
                  radio,
                },
                signal: controlador.signal,
              }
            );

            mapasCercanos = respuestaGeo.data.data || [];
          }
        } catch (errorGeo) {
          if (controlador.signal.aborted) return;

          console.warn(
            "Búsqueda geográfica no disponible:",
            errorGeo
          );
        }

        if (controlador.signal.aborted) return;

        // Unir resultados sin duplicados.
        const proyectosUnicos = new Map();

        mapasCercanos.forEach((mapa) => {
          proyectosUnicos.set(mapa.id, mapa);
        });

        mapasTexto.forEach((mapa) => {
          if (!proyectosUnicos.has(mapa.id)) {
            proyectosUnicos.set(mapa.id, mapa);
          }
        });

        // Ordenar por distancia geográfica.
        const listaFinal = Array.from(
          proyectosUnicos.values()
        ).sort((a, b) => {
          const distanciaA =
            a.distancia_km == null
              ? Infinity
              : Number(a.distancia_km);

          const distanciaB =
            b.distancia_km == null
              ? Infinity
              : Number(b.distancia_km);

          return distanciaA - distanciaB;
        });

        setResultados(listaFinal);

        if (lugarEncontrado) {
          setUbicacion(lugarEncontrado.nombre);
        }
      } catch (err) {
        if (
          err.name !== "CanceledError" &&
          err.name !== "AbortError" &&
          !controlador.signal.aborted
        ) {
          setError("No se pudo completar la búsqueda.");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setBuscando(false);
        }
      }
    }, texto.trim() ? 600 : 0);

    return () => {
      clearTimeout(timer);
      controlador.abort();
    };
  }, [texto, radio, todos, cargando]);

  // =====================================================
  // 3. DATOS DEL CARRUSEL
  // =====================================================

  const destacados = useMemo(() => {
    return todos.slice(0, 8).map((mapa) => ({
      id: mapa.id,
      title: mapa.nombre,
      subtitle:
        [mapa.comuna, mapa.region]
          .filter(Boolean)
          .join(", ") || "Estudio acústico",
    }));
  }, [todos]);

  const abrirProyecto = (id) => {
    if (id !== undefined && id !== null) {
      navigate(`/comunidad/${id}`);
    }
  };

  // =====================================================
  // 4. PANTALLA DE CARGA INICIAL
  // =====================================================

  if (cargando) {
    return <PantallaCarga />;
  }

  // =====================================================
  // 5. INTERFAZ DE COMUNIDAD
  // =====================================================

  return (
    <main className="min-h-screen bg-[#F4F7FA] text-[#243447]">

      <div className="h-1.5 w-full bg-[#155B91]" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">

        {/* ENCABEZADO */}

        <header className="mb-10 border-b border-[#DCE5EC] pb-8">

          <div className="mb-4 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#287EAB]" />

            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#287EAB]">
              Plataforma de mapas de ruido
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#153C5B] sm:text-4xl">
            Comunidad de mapas acústicos
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#617487] sm:text-base">
            Explora proyectos de cartografía acústica
            compartidos por la comunidad. Consulta los
            mapas de ruido generados y accede a sus
            reportes públicos.
          </p>
        </header>

        {/* ==========================================
            CARRUSEL DECORATIVO
            ========================================== */}

        {destacados.length > 0 && (
          <section className="mb-12 overflow-hidden rounded-2xl border border-[#DCE5EC] bg-white shadow-[0_8px_28px_rgba(19,54,83,0.06)]">

            <div className="border-b border-[#E7EDF2] px-6 py-5 text-center">

              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#287EAB]">
                Galería de proyectos
              </span>

              <h2 className="mt-2 text-xl font-bold text-[#153C5B]">
                Mapas destacados
              </h2>

              <p className="mt-2 text-sm text-[#718397]">
                Explora los estudios acústicos de nuestra comunidad.
              </p>
            </div>

            <div className="mx-auto max-w-4xl px-3 pt-3 sm:px-6">

              <div className="relative h-[340px] w-full sm:h-[380px]">

                <CircularCarousel
                  items={destacados}
                  renderItem={(item) => (
                    <MapaRuidoPreview
                      proyectoId={item.id}
                      className="h-full w-full"
                    />
                  )}
                  preset="orbit"
                  intro="none"
                  cardWidth={250}
                  aspectRatio={1.15}
                  gap={18}
                  curve={0}
                  tilt={0}
                  perspective={1500}
                  autoplay="drift"
                  speed={4}
                  direction="left"
                  captions
                  draggable
                  snap
                  pauseOnHover
                  focusOnClick
                  parallax={0.12}
                  stretch={0.1}
                  depthFade={0.2}
                  fadeColor="#FFFFFF"
                  innerShade={0.15}
                  cornerRadius={10}
                  onChange={setIndiceActivo}
                  onItemClick={(item) => {
                    abrirProyecto(item?.id);
                  }}
                />
              </div>
            </div>

            <div className="border-t border-[#EDF1F5] bg-[#F9FBFD] px-5 py-4 text-center">

              <p className="text-sm font-semibold text-[#153C5B]">
                {destacados[indiceActivo]?.title ||
                  "Mapas públicos"}
              </p>

              <p className="mt-1 text-xs text-[#718397]">
                Arrastra para explorar · Haz clic para abrir
              </p>
            </div>
          </section>
        )}

        {/* ==========================================
            ENCABEZADO DEL DASHBOARD
            ========================================== */}

        <section className="mb-7">

          <div className="mb-6 flex flex-col justify-between gap-3 border-b border-[#DCE5EC] pb-5 sm:flex-row sm:items-end">

            <div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#287EAB]">
                Catálogo público
              </span>

              <h2 className="mt-2 text-2xl font-bold text-[#153C5B]">
                Explorar mapas de ruido
              </h2>

              <p className="mt-2 text-sm text-[#718397]">
                Encuentra estudios acústicos por nombre
                o ubicación geográfica.
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full border border-[#CFE2EE] bg-[#EAF4FA] px-4 py-2 text-xs font-semibold text-[#155B91]">
              {todos.length} proyectos públicos
            </span>
          </div>

          {/* ==========================================
              BUSCADOR
              ========================================== */}

          <div className="rounded-2xl border border-[#DCE5EC] bg-white p-5 shadow-[0_4px_18px_rgba(19,54,83,0.04)]">

            <label
              htmlFor="buscar-mapas-publicos"
              className="mb-3 block text-sm font-semibold text-[#153C5B]"
            >
              Buscar en el catálogo
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">

              <div className="relative flex-1">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8294A4]"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>

                <input
                  id="buscar-mapas-publicos"
                  type="search"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Buscar por nombre, comuna o lugar..."
                  className="w-full rounded-xl border border-[#D7E1E9] bg-[#FAFCFE] py-3 pl-12 pr-4 text-sm text-[#243447] outline-none transition focus:border-[#287EAB] focus:ring-2 focus:ring-[#287EAB]/10"
                />
              </div>

              <label className="flex items-center justify-between gap-3 rounded-xl border border-[#D7E1E9] bg-[#FAFCFE] px-4 text-sm text-[#52697C]">

                Radio geográfico

                <select
                  value={radio}
                  onChange={(e) =>
                    setRadio(Number(e.target.value))
                  }
                  className="cursor-pointer bg-transparent py-3 font-semibold text-[#155B91] outline-none"
                >
                  {[5, 10, 30, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} km
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {ubicacion && (
              <p className="mt-3 text-xs font-medium text-[#287EAB]">
                Resultados cercanos a {ubicacion}
              </p>
            )}

            <p className="mt-3 text-xs text-[#8A9BA9]">
              La búsqueda filtra los mapas del catálogo.
              La galería superior permanece independiente.
            </p>
          </div>
        </section>

        {/* ==========================================
            ESTADO DE RESULTADOS
            ========================================== */}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

          <p className="text-sm font-medium text-[#617487]">
            {buscando
              ? "Buscando proyectos..."
              : `${resultados.length} ${
                  resultados.length === 1
                    ? "mapa disponible"
                    : "mapas disponibles"
                }`}
          </p>

        </div>

        {/* SIN RESULTADOS */}

        {!buscando &&
          resultados.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#CEDBE5] bg-white px-6 py-16 text-center">

              <h3 className="text-lg font-semibold text-[#153C5B]">
                No encontramos mapas
              </h3>

              <p className="mt-2 text-sm text-[#718397]">
                Prueba con otro nombre de proyecto
                o una ubicación diferente.
              </p>
            </div>
          )}

        {/* ==========================================
            DASHBOARD DE MAPAS
            ========================================== */}

        <section
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Dashboard de mapas públicos"
        >

          {resultados.map((mapa) => (
            <article
              key={mapa.id}
              className="group overflow-hidden rounded-2xl border border-[#DCE5EC] bg-white shadow-[0_5px_20px_rgba(19,54,83,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#B7D1E2] hover:shadow-[0_14px_32px_rgba(19,54,83,0.10)]"
            >

              {/* PREVISUALIZACIÓN DEL MAPA DE CALOR */}

              <div className="relative h-60 overflow-hidden border-b border-[#E7EDF2] bg-[#EDF3F7]">
                <MapaRuidoPreview
                  proyectoId={mapa.id}
                  className="h-full w-full"
                />

                <span className="absolute left-4 top-4 rounded-md border border-[#DCE5EC] bg-white/95 px-3 py-1.5 text-[11px] font-bold text-[#155B91] shadow-sm">
                  MAPA PÚBLICO
                </span>
              </div>

              {/* INFORMACIÓN DEL PROYECTO */}

              <div className="p-6">

                <div className="mb-3 flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-[#3A9B73]" />

                  <span className="text-xs font-semibold text-[#3A8067]">
                    Proyecto finalizado
                  </span>
                </div>

                <h3 className="text-lg font-bold leading-snug text-[#153C5B]">
                  {mapa.nombre}
                </h3>

                <div className="mt-3 flex items-start gap-2 text-sm text-[#617487]">

                  <span aria-hidden="true">📍</span>

                  <span>
                    {[mapa.comuna, mapa.region]
                      .filter(Boolean)
                      .join(", ") ||
                      "Ubicación no especificada"}
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 min-h-[60px] text-sm leading-6 text-[#718397]">
                  {mapa.descripcion ||
                    "Estudio acústico compartido con la comunidad para consulta pública."}
                </p>

                <div className="mt-5 border-t border-[#EDF1F5] pt-4">

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8294A4]">

                    <span>
                      {mapa.usuario?.name || "Comunidad"}
                    </span>

                    <span>
                      {fecha(mapa.fecha_modificacion)}
                    </span>
                  </div>

                  {mapa.distancia_km != null && (
                    <p className="mt-2 text-xs font-medium text-[#287EAB]">
                      Aprox. {mapa.distancia_km} km
                      del lugar buscado
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    abrirProyecto(mapa.id)
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#155B91] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0F456E] focus:outline-none focus:ring-2 focus:ring-[#287EAB] focus:ring-offset-2"
                >
                  Ver mapa y reporte

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </section>

        {/* PIE DE COMUNIDAD */}

        <footer className="mt-14 border-t border-[#DCE5EC] pt-6">
          <p className="text-center text-xs leading-6 text-[#8294A4]">
            Plataforma de mapas de ruido ·
            Consulta pública de estudios acústicos
          </p>
        </footer>
      </div>
    </main>
  );
}
