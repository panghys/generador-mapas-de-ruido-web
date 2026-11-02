
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import clientAxios from "../config/clienteAxios";
import CircularCarousel from "../CircularCarousel";

import { calcularRuidoLocal } from "./ruidoLocal";
import { obtenerNivelEmisionCalle } from "./ruidoPropagacion";
import {
  generarMapaRuido,
  crearUrlVistaPrevia,
} from "./exportarMapaRuido";

const leer = (valor) => {
  try {
    return typeof valor === "string" ? JSON.parse(valor) : valor;
  } catch {
    return null;
  }
};

const fecha = (valor) =>
  valor
    ? new Date(valor).toLocaleDateString("es-CL")
    : "Sin fecha";

// Genera una imagen del mapa acústico real.
async function crearMiniatura(proyecto) {
  const zona = (
    leer(proyecto.zona)?.coordinates?.[0] || []
  ).map(([lng, lat]) => [lat, lng]);

  const calles = (proyecto.calles || []).map((calle) => {
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

    return {
      ...calle,
      nivelRuidoCalculado: nivel,
      latlngs: (
        leer(calle.trazo_calle)?.coordinates || []
      ).map(([lng, lat]) => [lat, lng]),
    };
  });

  const fuentes = calles
    .map((calle) => ({
      latlngs: calle.latlngs,
      nivel: obtenerNivelEmisionCalle(calle),
    }))
    .filter(
      (calle) =>
        calle.latlngs.length >= 2 &&
        Number.isFinite(calle.nivel)
    );

  if (zona.length < 3 || !fuentes.length) {
    return null;
  }

  const resultado = await generarMapaRuido({
    nombre: proyecto.nombre,
    calles: fuentes,
    zona,
  });

  return crearUrlVistaPrevia(resultado);
}

// Permite buscar proyectos por ubicación geográfica.
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

export default function ProyectosPublicos() {
  const navigate = useNavigate();

  // Todos los proyectos públicos.
  const [todos, setTodos] = useState([]);

  // Proyectos que aparecen en el dashboard.
  const [resultados, setResultados] = useState([]);

  // Imágenes reales de los mapas acústicos.
  const [miniaturas, setMiniaturas] = useState({});

  // Buscador.
  const [texto, setTexto] = useState("");
  const [radio, setRadio] = useState(30);
  const [ubicacion, setUbicacion] = useState("");

  // Estados de carga.
  const [cargando, setCargando] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");

  // Carrusel.
  const [indiceActivo, setIndiceActivo] = useState(0);

  const urlsRef = useRef({});

  // =====================================================
  // 1. CARGAR TODOS LOS PROYECTOS PÚBLICOS
  // =====================================================

  useEffect(() => {
    const controlador = new AbortController();

    async function cargarProyectos() {
      try {
        setCargando(true);

        const respuesta = await clientAxios.get(
          "/proyectos/publicos",
          {
            signal: controlador.signal,
          }
        );

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
  // 2. BUSCADOR EXCLUSIVO DEL DASHBOARD
  // =====================================================

  useEffect(() => {
    if (cargando) return;

    const controlador = new AbortController();

    const timer = setTimeout(async () => {
      const q = texto.trim();

      setUbicacion("");
      setError("");

      // Sin búsqueda: mostrar todos los proyectos.
      if (!q) {
        setResultados(todos);
        setBuscando(false);
        return;
      }

      setBuscando(true);

      try {
        // Primero buscar por texto.
        const respuesta = await clientAxios.get(
          "/proyectos/publicos",
          {
            params: { q },
            signal: controlador.signal,
          }
        );

        let lista = respuesta.data.data || [];

        // Si no hay coincidencias, intentar por ubicación.
        if (!lista.length) {
          const lugar = await geocodificar(
            q,
            controlador.signal
          );

          if (lugar) {
            const cerca = await clientAxios.get(
              "/proyectos/publicos",
              {
                params: {
                  lat: lugar.lat,
                  lng: lugar.lng,
                  radio,
                },
                signal: controlador.signal,
              }
            );

            lista = (cerca.data.data || []).sort(
              (a, b) =>
                Number(a.distancia_km ?? Infinity) -
                Number(b.distancia_km ?? Infinity)
            );

            if (!controlador.signal.aborted) {
              setUbicacion(lugar.nombre);
            }
          }
        }

        if (!controlador.signal.aborted) {
          setResultados(lista);
        }
      } catch (err) {
        if (
          err.name !== "CanceledError" &&
          err.name !== "AbortError"
        ) {
          setError(
            "No se pudo completar la búsqueda."
          );
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
  // 3. GENERAR MINIATURAS REALES DE LOS MAPAS
  // =====================================================

  useEffect(() => {
    let cancelado = false;
    const controlador = new AbortController();

    async function cargarMiniaturas() {
      setGenerando(true);

      for (const mapa of todos) {
        if (cancelado) break;

        // No generar dos veces la misma imagen.
        if (urlsRef.current[mapa.id]) continue;

        try {
          const respuesta = await clientAxios.get(
            `/proyectos/publicos/${mapa.id}`,
            {
              signal: controlador.signal,
            }
          );

          const url = await crearMiniatura(
            respuesta.data.data
          );

          if (cancelado) {
            if (url?.startsWith("blob:")) {
              URL.revokeObjectURL(url);
            }
            break;
          }

          if (url) {
            urlsRef.current[mapa.id] = url;

            setMiniaturas((anteriores) => ({
              ...anteriores,
              [mapa.id]: url,
            }));
          }
        } catch (err) {
          if (!cancelado) {
            console.error(
              "Miniatura no disponible:",
              mapa.id,
              err
            );
          }
        }
      }

      if (!cancelado) {
        setGenerando(false);
      }
    }

    cargarMiniaturas();

    return () => {
      cancelado = true;
      controlador.abort();
    };
  }, [todos]);

  // Liberar imágenes temporales.
  useEffect(() => {
    return () => {
      Object.values(urlsRef.current).forEach((url) => {
        if (url?.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // =====================================================
  // 4. DATOS DEL CARRUSEL
  // =====================================================

  // Importante:
  // El carrusel utiliza TODOS los proyectos,
  // no los resultados del buscador.
  const destacados = useMemo(() => {
    return todos
      .filter((mapa) => miniaturas[mapa.id])
      .map((mapa) => ({
        id: mapa.id,
        src: miniaturas[mapa.id],
        alt: `Mapa acústico de ${mapa.nombre}`,
        title: mapa.nombre,
        subtitle:
          [mapa.comuna, mapa.region]
            .filter(Boolean)
            .join(", ") || "Estudio acústico",
      }));
  }, [todos, miniaturas]);

  // =====================================================
  // 5. INTERFAZ
  // =====================================================

  return (
    <main className="min-h-screen bg-[#0F1417] px-4 py-10 text-[#EDEFF0] sm:px-8">
      <div className="mx-auto max-w-7xl">

        {/* ENCABEZADO */}

        <header className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[.22em] text-teal-400">
            Explorar · Comunidad
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Mapas públicos de la comunidad
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            Descubre mapas acústicos y consulta sus
            reportes públicos.
          </p>
        </header>

        {/* ==========================================
            CARRUSEL DECORATIVO
            ========================================== */}

        {destacados.length > 0 && (
          <section className="mx-auto mb-10 max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#171D21] px-3 py-5 sm:px-6">

            <div className="text-center">
              <h2 className="text-lg font-semibold">
                Mapas destacados
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Gira el carrusel y selecciona un proyecto
                para explorarlo
              </p>
            </div>

            <div className="relative mx-auto h-[310px] w-full sm:h-[350px]">
              <CircularCarousel
                items={destacados}
                preset="orbit"
                intro="assemble"
                cardWidth={185}
                aspectRatio={1.25}
                gap={22}
                curve={0}
                tilt={-8}
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
                depthFade={0.3}
                fadeColor="#171D21"
                innerShade={0.3}
                cornerRadius={12}
                onChange={setIndiceActivo}
                onItemClick={(item) => {
                  if (item?.id != null) {
                    navigate(`/comunidad/${item.id}`);
                  }
                }}
              />
            </div>

            <p className="mt-1 text-center text-xs text-slate-500">
              {destacados[indiceActivo]?.title ||
                "Mapas públicos"}
            </p>
          </section>
        )}

        {/* ==========================================
            BUSCADOR DEL DASHBOARD
            ========================================== */}

        <section className="mb-6 rounded-2xl border border-white/10 bg-[#171D21] p-5">

          <h2 className="mb-3 text-xl font-semibold">
            Explorar todos los mapas
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row">

            <input
              type="search"
              aria-label="Buscar proyectos del dashboard"
              value={texto}
              onChange={(e) =>
                setTexto(e.target.value)
              }
              placeholder="Buscar por nombre, descripción, comuna o lugar..."
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#0F1417] px-4 py-3 text-sm text-white outline-none focus:border-teal-400"
            />

            <label className="flex items-center gap-3 rounded-xl border border-white/10 px-4 text-sm text-slate-300">
              Radio geográfico

              <select
                value={radio}
                onChange={(e) =>
                  setRadio(Number(e.target.value))
                }
                className="bg-[#171D21] py-3 text-white"
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
            <p className="mt-2 text-xs text-teal-300">
              Resultados cercanos a {ubicacion}
            </p>
          )}
        </section>

        {/* ERRORES */}

        {error && (
          <p
            role="alert"
            className="mb-4 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {/* ESTADO DEL DASHBOARD */}

        <div className="mb-5 flex items-center justify-between gap-3">

          <p className="text-sm text-slate-400">
            {cargando || buscando
              ? "Buscando..."
              : `${resultados.length} mapa(s) en el dashboard`}
          </p>

          {generando && (
            <p className="text-xs text-teal-300">
              Generando vistas previas...
            </p>
          )}
        </div>

        {/* SIN RESULTADOS */}

        {!cargando &&
          !buscando &&
          resultados.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/20 p-12 text-center text-slate-400">
              No se encontraron mapas para esta búsqueda.
            </p>
          )}

        {/* ==========================================
            DASHBOARD DE MAPAS PÚBLICOS
            ========================================== */}

        <section
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Dashboard de mapas públicos"
        >
          {resultados.map((mapa) => (
            <article
              key={mapa.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#171D21]"
            >

              {/* MAPA COMPLETO SIN DISTORSIÓN */}

              <div className="flex h-56 items-center justify-center bg-[#10171B] p-3">

                {miniaturas[mapa.id] ? (
                  <img
                    src={miniaturas[mapa.id]}
                    alt={`Mapa acústico completo de ${mapa.nombre}`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-center text-xs text-slate-500">
                    {generando
                      ? "Preparando mapa..."
                      : "Vista previa no disponible"}
                  </span>
                )}
              </div>

              {/* INFORMACIÓN DEL PROYECTO */}

              <div className="p-5">

                <span className="text-xs font-semibold text-teal-300">
                  Público · Listo
                </span>

                <h3 className="mt-2 text-lg font-semibold text-white">
                  {mapa.nombre}
                </h3>

                <p className="mt-2 text-xs text-slate-400">
                  📍{" "}
                  {[mapa.comuna, mapa.region]
                    .filter(Boolean)
                    .join(", ") ||
                    "Ubicación no especificada"}
                </p>

                <p className="mt-3 line-clamp-2 min-h-10 text-sm text-slate-400">
                  {mapa.descripcion ||
                    "Estudio acústico sin descripción."}
                </p>

                <p className="mt-3 text-xs text-slate-500">
                  Por{" "}
                  {mapa.usuario?.name || "Comunidad"}
                  {" · "}
                  {fecha(mapa.fecha_modificacion)}
                </p>

                {mapa.distancia_km != null && (
                  <p className="mt-2 text-xs text-teal-300">
                    Aprox. {mapa.distancia_km} km
                    del lugar buscado
                  </p>
                )}

                {/* BOTÓN PARA ABRIR EL REPORTE */}

                <button
                  type="button"
                  onClick={() =>
                    navigate(`/comunidad/${mapa.id}`)
                  }
                  className="mt-5 w-full rounded-xl bg-teal-400 px-4 py-3 text-sm font-bold text-[#0F1417] hover:bg-teal-300"
                >
                  Ver mapa completo y reporte →
                </button>
              </div>
            </article>
          ))}
        </section>

      </div>
    </main>
  );
}
