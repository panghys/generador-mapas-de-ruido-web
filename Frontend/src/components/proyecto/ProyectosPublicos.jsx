
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

// Convierte un GeoJSON que puede venir como texto u objeto.
function comoObjeto(valor) {
  try {
    return typeof valor === "string" ? JSON.parse(valor) : valor;
  } catch {
    return null;
  }
}

// Convierte el polígono de la zona al formato de Leaflet.
function poligonoALatLng(zona) {
  const objeto = comoObjeto(zona);

  return (objeto?.coordinates?.[0] || []).map(
    ([lng, lat]) => [lat, lng]
  );
}

// Convierte el trazado de una calle al formato de Leaflet.
function lineaALatLng(calle) {
  const objeto = comoObjeto(calle.trazo_calle);

  return (objeto?.coordinates || []).map(
    ([lng, lat]) => [lat, lng]
  );
}

// Prepara los datos acústicos igual que en MapaPublico.jsx.
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

  return {
    ...calle,
    nivelRuidoCalculado: nivel,
    latlngs: lineaALatLng(calle),
  };
}

// Busca las coordenadas de una ubicación escrita por el usuario.
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
    throw new Error("No se pudo buscar la ubicación.");
  }

  const datos = await respuesta.json();

  if (!datos.length) return null;

  return {
    lat: Number(datos[0].lat),
    lng: Number(datos[0].lon),
    nombre: datos[0].display_name,
  };
}

// Genera una imagen a partir de los datos reales del proyecto.
async function generarMiniatura(proyecto) {
  const calles = (proyecto.calles || []).map(prepararCalle);

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

  const zona = poligonoALatLng(proyecto.zona);

  if (zona.length < 3 || fuentes.length === 0) {
    return null;
  }

  const resultado = await generarMapaRuido({
    nombre: proyecto.nombre,
    calles: fuentes,
    zona,
  });

  return crearUrlVistaPrevia(resultado);
}

export default function ProyectosPublicos() {
  const navigate = useNavigate();

  const [texto, setTexto] = useState("");
  const [radio, setRadio] = useState(30);

  const [mapas, setMapas] = useState([]);
  const [miniaturas, setMiniaturas] = useState({});

  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);

  const [error, setError] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [modo, setModo] = useState("recientes");

  const [seleccionado, setSeleccionado] = useState(null);

  const ultimaBusqueda = useRef(0);
  const miniaturasRef = useRef({});

  // 1. Obtener los proyectos públicos.
  useEffect(() => {
    const controlador = new AbortController();
    const solicitud = ++ultimaBusqueda.current;

    const temporizador = window.setTimeout(async () => {
      setCargando(true);
      setError("");
      setUbicacion("");

      try {
        const q = texto.trim();

        const respuesta = await clientAxios.get(
          "/proyectos/publicos",
          {
            params: { q },
            signal: controlador.signal,
          }
        );

        let datos = respuesta.data.data || [];
        let orden = "recientes";

        // Si no encuentra coincidencias textuales,
        // intenta buscar por ubicación geográfica.
        if (q && datos.length === 0) {
          const lugar = await geocodificar(
            q,
            controlador.signal
          );

          if (lugar) {
            const respuestaUbicacion = await clientAxios.get(
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

            datos = respuestaUbicacion.data.data || [];

            datos.sort(
              (a, b) =>
                Number(a.distancia_km ?? Infinity) -
                Number(b.distancia_km ?? Infinity)
            );

            orden = "cercanos";
            setUbicacion(lugar.nombre);
          }
        }

        if (solicitud === ultimaBusqueda.current) {
          setMapas(datos);
          setModo(orden);
          setSeleccionado(null);
        }
      } catch (err) {
        if (
          err.name !== "CanceledError" &&
          err.name !== "AbortError" &&
          solicitud === ultimaBusqueda.current
        ) {
          console.error("Error buscando proyectos:", err);

          setError(
            "No se pudieron cargar los mapas públicos."
          );
          setMapas([]);
        }
      } finally {
        if (solicitud === ultimaBusqueda.current) {
          setCargando(false);
        }
      }
    }, texto.trim() ? 650 : 0);

    return () => {
      window.clearTimeout(temporizador);
      controlador.abort();
    };
  }, [texto, radio]);

  // 2. Generar las imágenes reales de los mapas.
  useEffect(() => {
    if (!mapas.length) {
      setGenerando(false);
      return;
    }

    let cancelado = false;
    const controlador = new AbortController();

    async function cargarMiniaturas() {
      setGenerando(true);

      // Se procesan una a una para no generar
      // demasiados mapas simultáneamente.
      for (const mapa of mapas) {
        if (cancelado) break;

        const id = mapa.id;

        // Evitar generar nuevamente una imagen existente.
        if (miniaturasRef.current[id]) continue;

        try {
          const respuesta = await clientAxios.get(
            `/proyectos/publicos/${id}`,
            {
              signal: controlador.signal,
            }
          );

          if (cancelado) break;

          const proyectoCompleto = respuesta.data.data;

          const url = await generarMiniatura(
            proyectoCompleto
          );

          if (cancelado) {
            if (url) URL.revokeObjectURL(url);
            break;
          }

          if (url) {
            miniaturasRef.current[id] = url;

            setMiniaturas((anteriores) => ({
              ...anteriores,
              [id]: url,
            }));
          }
        } catch (err) {
          if (!cancelado) {
            console.error(
              `No se pudo generar la miniatura del proyecto ${id}:`,
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
  }, [mapas]);

  // Liberar las imágenes temporales al salir.
  useEffect(() => {
    return () => {
      Object.values(miniaturasRef.current).forEach(
        (url) => URL.revokeObjectURL(url)
      );
    };
  }, []);

  // 3. Construir los elementos del CircularCarousel.
  const items = useMemo(() => {
    return mapas
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
  }, [mapas, miniaturas]);

  // Información del proyecto actualmente seleccionado.
  const proyectoSeleccionado = useMemo(() => {
    if (seleccionado !== null) {
      return mapas.find(
        (mapa) => mapa.id === seleccionado
      );
    }

    return mapas.find(
      (mapa) => mapa.id === items[0]?.id
    );
  }, [mapas, seleccionado, items]);

  const abrirProyecto = (id) => {
    if (id === undefined || id === null) return;

    navigate(`/comunidad/${id}`);
  };

  return (
    <main className="min-h-screen bg-[#0F1417] px-5 py-12 text-[#EDEFF0] sm:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Encabezado */}
        <header className="mb-9">
          <p className="mb-2 text-xs font-bold uppercase tracking-[.22em] text-teal-400">
            Explorar · Comunidad
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Mapas públicos de la comunidad
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Explora estudios acústicos compartidos por la
            comunidad. Visualiza sus mapas de ruido y consulta
            sus reportes sin modificar los proyectos originales.
          </p>
        </header>

        {/* Buscador */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-[#171D21] p-5 shadow-xl">
          <label
            htmlFor="buscar-comunidad"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Buscar mapas o lugares
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="buscar-comunidad"
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Nombre, descripción, comuna o lugar..."
              maxLength={120}
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#0F1417] px-4 py-3 text-sm text-white outline-none focus:border-teal-400"
            />

            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 text-sm text-slate-300">
              Radio geográfico

              <select
                value={radio}
                onChange={(e) =>
                  setRadio(Number(e.target.value))
                }
                className="bg-transparent py-3 text-white outline-none"
              >
                {[5, 10, 30, 50, 100].map((n) => (
                  <option
                    key={n}
                    value={n}
                    className="bg-[#171D21]"
                  >
                    {n} km
                  </option>
                ))}
              </select>
            </label>
          </div>

          {ubicacion && (
            <p className="mt-3 text-xs text-teal-300">
              Resultados cercanos a {ubicacion} · {radio} km
            </p>
          )}
        </section>

        {/* Estado */}
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            {cargando
              ? "Buscando mapas..."
              : `${mapas.length} mapa${
                  mapas.length === 1 ? "" : "s"
                } disponible${
                  mapas.length === 1 ? "" : "s"
                }`}
          </p>

          {!cargando && (
            <span className="text-xs text-slate-500">
              {modo === "cercanos"
                ? "Ordenados por cercanía"
                : "Proyectos públicos y listos"}
            </span>
          )}
        </div>

        {/* Sin resultados */}
        {!cargando && mapas.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/20 px-5 py-20 text-center text-slate-400">
            No encontramos mapas para esta búsqueda.
            Prueba con otro nombre o una ubicación cercana.
          </div>
        )}

        {/* Generación de miniaturas */}
        {!cargando && generando && (
          <div className="mb-5 flex items-center gap-3 text-sm text-teal-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
            Generando vistas previas de los mapas acústicos...
          </div>
        )}

        {/* Carrusel circular 3D */}
        {!cargando && items.length > 0 && (
          <section
            aria-label="Carrusel de mapas públicos"
            className="overflow-hidden rounded-3xl border border-white/10 bg-[#171D21] px-2 py-8 shadow-2xl sm:px-6"
          >
            <div className="mb-2 text-center">
              <h2 className="text-xl font-semibold text-white">
                Explora los mapas
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Arrastra para girar el carrusel o selecciona
                una tarjeta para abrir el proyecto.
              </p>
            </div>

            <div
              style={{
                width: "100%",
                height: "560px",
                position: "relative",
              }}
            >
              <CircularCarousel
                items={items}
                preset="panorama"
                intro="assemble"
                cardWidth={264}
                aspectRatio={1}
                speed={4}
                captions={true}
                gap={30}
                tilt={0}
                curve={1}
                perspective={1800}
                autoplay="drift"
                interval={3}
                direction="left"
                momentum={0.66}
                snap
                pauseOnHover
                focusOnClick
                draggable
                parallax={0.35}
                stretch={0.49}
                fadeColor="#171D21"
                depthFade={0.51}
                innerShade={0.76}
                cornerRadius={17}
                onChange={(index) => {
                  const item = items[index];

                  if (item) {
                    setSeleccionado(item.id);
                  }
                }}
                onItemClick={(item) => {
                  abrirProyecto(item?.id);
                }}
              />
            </div>
          </section>
        )}

        {/* Información del proyecto seleccionado */}
        {!cargando && proyectoSeleccionado && (
          <section className="mx-auto mt-8 max-w-3xl rounded-2xl border border-white/10 bg-[#171D21] p-6 shadow-xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-300">
                Público · Listo
              </span>

              <span className="text-xs text-slate-500">
                Proyecto #{proyectoSeleccionado.id}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white">
              {proyectoSeleccionado.nombre}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {proyectoSeleccionado.descripcion ||
                "Proyecto de estudio acústico sin descripción."}
            </p>

            <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-300">
              <span>
                📍{" "}
                {[
                  proyectoSeleccionado.comuna,
                  proyectoSeleccionado.region,
                ]
                  .filter(Boolean)
                  .join(", ") || "Ubicación no especificada"}
              </span>

              <span>
                Por{" "}
                {proyectoSeleccionado.usuario?.name ||
                  "Comunidad"}
              </span>
            </div>

            {proyectoSeleccionado.distancia_km != null && (
              <p className="mt-3 text-sm text-teal-300">
                Aprox.{" "}
                {Number(
                  proyectoSeleccionado.distancia_km
                ).toFixed(1)}{" "}
                km del lugar buscado
              </p>
            )}

            <button
              type="button"
              onClick={() =>
                abrirProyecto(proyectoSeleccionado.id)
              }
              className="mt-6 w-full rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-[#0F1417] transition-colors hover:bg-teal-300"
            >
              Ver mapa completo y reporte →
            </button>
          </section>
        )}

        {/* Mensaje si no se pudo generar ninguna imagen */}
        {!cargando &&
          !generando &&
          mapas.length > 0 &&
          items.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#171D21] p-8 text-center">
              <p className="text-slate-300">
                No se pudieron generar las vistas previas
                de estos proyectos.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Puedes consultar sus mapas completos
                directamente.
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {mapas.map((mapa) => (
                  <button
                    key={mapa.id}
                    type="button"
                    onClick={() => abrirProyecto(mapa.id)}
                    className="rounded-xl border border-teal-400/30 px-4 py-2 text-sm text-teal-300 hover:bg-teal-400/10"
                  >
                    {mapa.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
      </div>
    </main>
  );
}
