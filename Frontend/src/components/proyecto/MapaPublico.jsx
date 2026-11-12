import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import clientAxios from "../config/clienteAxios";
import CapaRuidoRaster from "./CapaRuidoRaster";
import { NIVELES_RUIDO, obtenerColorRuido } from "./nivelesRuido";
import { calcularNivelEmision25 } from "./modeloRuido";
import { obtenerNivelEmisionCalle, obtenerBandasCalle } from "./ruidoPropagacion";
import { crearUrlVistaPrevia, descargarMapaRuido, generarMapaRuido } from "./exportarMapaRuido";
import ExportarMapaModal from "./ExportarMapaModal";
import PeekRating from "../ui/PeekRating";

const comoObjeto = (geojson) => { try { return typeof geojson === "string" ? JSON.parse(geojson) : geojson; } catch { return null; } };
const poligonoALatlng = (zona) => (comoObjeto(zona)?.coordinates?.[0] || []).map(([lng, lat]) => [lat, lng]);
const lineaALatlng = (calle) => (comoObjeto(calle.trazo_calle)?.coordinates || []).map(([lng, lat]) => [lat, lng]);

function prepararCalle(calle, modelo) {
  const nivel = calcularNivelEmision25(calle, modelo);
  return { ...calle, nivelRuidoCalculado: nivel, latlngs: lineaALatlng(calle) };
}

export default function MapaPublico() {
  const { id } = useParams();
  const [proyecto, setProyecto] = useState(null);
  const [calles, setCalles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mostrarRuido, setMostrarRuido] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState("");
  const [vista, setVista] = useState(null);
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState("");
  const [guardandoValoracion, setGuardandoValoracion] = useState(false);
  const [errorValoracion, setErrorValoracion] = useState("");
  const [mensajeValoracion, setMensajeValoracion] = useState("");
  const tieneSesion = Boolean(localStorage.getItem("token"));
  const mapaContenedor = useRef(null);
  const mapaRef = useRef(null);
  const urlRef = useRef(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setCargando(true);
    setProyecto(null);
    setCalles([]);
    setError("");
    clientAxios.get(`/proyectos/publicos/${id}`, { signal: ctrl.signal })
      .then(({ data }) => { setProyecto(data.data); setCalles((data.data.calles || []).map((calle) => prepararCalle(calle, data.data.modeloCalculo))); })
      .catch((err) => { if (err.name !== "CanceledError") setError("Este mapa no está disponible públicamente o fue retirado de la comunidad."); })
      .finally(() => { if (!ctrl.signal.aborted) setCargando(false); });
    return () => ctrl.abort();
  }, [id]);

  useEffect(() => {
    if (!proyecto || !mapaContenedor.current) return;
    const mapa = L.map(mapaContenedor.current, { zoomControl: true, preferCanvas: true }).setView([-39.82, -73.24], 12);
    mapaRef.current = mapa;
    const paneRuido = mapa.createPane("superficieRuido");
    paneRuido.style.zIndex = "350";
    paneRuido.style.pointerEvents = "none";
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", crossOrigin: true }).addTo(mapa);
    const zona = poligonoALatlng(proyecto.zona);
    if (zona.length >= 3) {
      const capaZona = L.polygon(zona, { color: "#287EAB", weight: 2, fillColor: "#287EAB", fillOpacity: 0.08 }).addTo(mapa);
      mapa.fitBounds(capaZona.getBounds(), { padding: [35, 35] });
    }
    const lineas = calles.filter((c) => c.latlngs.length >= 2);
    lineas.forEach((calle) => {
      const color = calle.nivelRuidoCalculado > 0 ? obtenerColorRuido(calle.nivelRuidoCalculado).color : calle.color_asignado || "#eab308";
      L.polyline(calle.latlngs, { color: "#153C5B", weight: 6, opacity: 0.95, interactive: false }).addTo(mapa);
      L.polyline(calle.latlngs, { color, weight: 3, interactive: true })
        .bindPopup(`<strong>${escapar(calle.nombre_calle || "Calle sin nombre")}</strong><br/>${Number(calle.nivelRuidoCalculado || 0).toFixed(1)} dB(A)`)
        .addTo(mapa);
    });
    return () => { mapa.remove(); mapaRef.current = null; };
  }, [proyecto, calles]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !mostrarRuido || !proyecto?.zona || !calles.length) return;
    const fuentes = calles.map((calle) => ({ latlngs: calle.latlngs, nivel: obtenerNivelEmisionCalle(calle, proyecto.modeloCalculo), bandasA: obtenerBandasCalle(calle, proyecto.modeloCalculo) }))
      .filter((c) => c.latlngs.length >= 2 && Number.isFinite(c.nivel));
    if (!fuentes.length) return;
    const capa = new CapaRuidoRaster({ calles: fuentes, zona: poligonoALatlng(proyecto.zona) }, { pane: "superficieRuido", opacidad: 0.6 }).addTo(mapa);
    return () => { if (mapa.hasLayer(capa)) mapa.removeLayer(capa); };
  }, [proyecto, calles, mostrarRuido]);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  async function guardarValoracion(puntuacion) {
    if (!tieneSesion || guardandoValoracion || !proyecto) return;

    const yaHabiaValorado = Number(proyecto.mi_valoracion) > 0;
    setGuardandoValoracion(true);
    setErrorValoracion("");
    setMensajeValoracion("");

    try {
      const respuesta = await clientAxios.post(
        `/proyectos/publicos/${id}/valoracion`,
        { puntuacion }
      );

      if (!respuesta.data?.status || !respuesta.data?.data) {
        throw new Error("No se pudo confirmar la valoración.");
      }

      setProyecto((actual) => ({ ...actual, ...respuesta.data.data }));
      setMensajeValoracion(
        yaHabiaValorado
          ? "Tu valoración se actualizó correctamente."
          : "¡Gracias! Tu valoración se guardó correctamente."
      );
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setErrorValoracion(
          "Tu sesión no es válida o expiró. Inicia sesión nuevamente para valorar."
        );
      } else {
        setErrorValoracion(
          err.response?.data?.error ||
            err.message ||
            "No se pudo guardar tu valoración. Inténtalo nuevamente."
        );
      }
    } finally {
      setGuardandoValoracion(false);
    }
  }

  async function exportar() {
    if (!proyecto?.zona) return;
    setExportando(true);
    setErrorExportar("");
    try {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const fuentes = calles.map((calle) => ({ latlngs: calle.latlngs, nivel: obtenerNivelEmisionCalle(calle, proyecto.modeloCalculo), bandasA: obtenerBandasCalle(calle, proyecto.modeloCalculo) }))
        .filter((c) => c.latlngs.length >= 2 && Number.isFinite(c.nivel));
      const resultado = await generarMapaRuido({ nombre: proyecto.nombre, calles: fuentes, zona: poligonoALatlng(proyecto.zona) });
      const url = await crearUrlVistaPrevia(resultado);
      urlRef.current = url;
      setVista({ url, ancho: resultado.ancho, alto: resultado.alto, resultado });
    } catch (err) { setErrorExportar(err.message || "No se pudo generar el mapa."); }
    finally { setExportando(false); }
  }

  async function descargar() {
    if (!vista) return;
    setDescargando(true);
    setErrorDescarga("");
    try { await descargarMapaRuido(vista.resultado, "png"); }
    catch (err) { setErrorDescarga(err.message || "No se pudo descargar el mapa."); }
    finally { setDescargando(false); }
  }

  function cerrarVista() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setVista(null);
  }

  if (cargando) return <main className="min-h-screen bg-[#F4F7FA] p-12 text-[#153C5B]">Cargando mapa público...</main>;
  if (error || !proyecto) return <main className="min-h-screen bg-[#F4F7FA] p-12 text-[#243447]"><p>{error || "Mapa no disponible."}</p><Link to="/comunidad" className="mt-4 inline-block text-[#155B91] underline">Volver a la comunidad</Link></main>;
  return (
    <main className="min-h-screen bg-[#F4F7FA] text-[#243447]">
      <div className="h-1.5 w-full bg-[#155B91]" />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-10">
        <Link to="/comunidad" className="text-sm font-medium text-[#155B91] hover:underline">← Volver a la comunidad</Link>
        <div className="mb-7 mt-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="rounded-full border border-[#CFE2EE] bg-[#EAF4FA] px-3 py-1 text-xs font-semibold text-[#155B91]">Solo lectura · Proyecto listo</span>
            <h1 className="mt-4 text-3xl font-bold text-[#153C5B]">{proyecto.nombre}</h1>
            <p className="mt-2 text-sm text-[#617487]">Por {proyecto.usuario?.name || "Comunidad"} · {[proyecto.comuna, proyecto.region].filter(Boolean).join(", ") || "Zona delimitada"}</p>
          </div>
          <button type="button" disabled={!proyecto.zona || !calles.length || exportando} onClick={exportar} className="rounded-xl bg-[#155B91] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0F456E] disabled:opacity-40">{exportando ? "Generando reporte..." : "Ver / descargar reporte del mapa"}</button>
        </div>
        {proyecto.descripcion && <p className="mb-6 max-w-3xl leading-7 text-[#617487]">{proyecto.descripcion}</p>}
        {errorExportar && <p role="alert" className="mb-4 text-sm text-red-700">{errorExportar}</p>}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
          <section className="overflow-hidden rounded-2xl border border-[#DCE5EC] bg-white shadow-[0_8px_28px_rgba(19,54,83,0.06)]">
            <div ref={mapaContenedor} className="h-[530px] w-full bg-[#EDF3F7] sm:h-[650px]" aria-label="Mapa acústico público, solo lectura" />
          </section>
          <aside className="h-fit space-y-5 rounded-2xl border border-[#DCE5EC] bg-white p-5 shadow-[0_4px_18px_rgba(19,54,83,0.04)]">
            <section className="rounded-xl border border-[#DCE5EC] bg-[#F9FBFD] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#287EAB]">
                    Valoración de la comunidad
                  </p>
                  <p className="mt-1 text-sm text-[#718397]">
                    {Number(proyecto.cantidad_valoraciones || 0)} {Number(proyecto.cantidad_valoraciones || 0) === 1 ? "valoración" : "valoraciones"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold leading-none text-[#153C5B]">
                    {Number(proyecto.cantidad_valoraciones || 0) > 0
                      ? Number(proyecto.valoracion_promedio || 0).toFixed(1)
                      : "—"}
                  </span>
                  <span className="ml-1 text-xs font-medium text-[#8294A4]">/ 5</span>
                </div>
              </div>

              <div className="mt-3">
                <PeekRating
                  value={Number(proyecto.valoracion_promedio || 0)}
                  readOnly
                  showTip={false}
                  size={20}
                  ariaLabel="Promedio de valoración de la comunidad"
                />
              </div>

              <div className="mt-4 border-t border-[#E7EDF2] pt-4">
                {tieneSesion ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#153C5B]">Tu valoración</p>
                      {Number(proyecto.mi_valoracion) > 0 && (
                        <span className="text-[11px] font-semibold text-[#3A8067]">Puedes actualizarla</span>
                      )}
                    </div>
                    <div className="mt-2">
                      <PeekRating
                        value={Number(proyecto.mi_valoracion || 0)}
                        onChange={guardarValoracion}
                        disabled={guardandoValoracion}
                        size={29}
                        labels={["Muy malo", "Malo", "Regular", "Bueno", "Excelente"]}
                        ariaLabel="Selecciona tu valoración para este mapa"
                      />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#8294A4]">
                      {guardandoValoracion
                        ? "Guardando tu valoración..."
                        : Number(proyecto.mi_valoracion) > 0
                          ? `Ya valoraste este mapa con ${proyecto.mi_valoracion} de 5 estrellas. Puedes cambiar tu puntuación.`
                          : "Selecciona de 1 a 5 estrellas para valorar este mapa."}
                    </p>
                  </>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-[#153C5B]">
                      ¿Qué te pareció este mapa?
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#8294A4]">
                      Inicia sesión para dejar tu valoración y ayudar a la comunidad.
                    </p>
                    <Link
                      to="/login"
                      className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#155B91] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#0F456E] focus:outline-none focus:ring-2 focus:ring-[#287EAB] focus:ring-offset-2"
                    >
                      Iniciar sesión para valorar
                    </Link>
                  </div>
                )}
              </div>

              {mensajeValoracion && (
                <p role="status" className="mt-3 rounded-lg border border-[#CFE8DC] bg-[#F0F8F4] px-3 py-2 text-xs font-medium text-[#287653]">
                  {mensajeValoracion}
                </p>
              )}
              {errorValoracion && (
                <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                  {errorValoracion}
                </p>
              )}
            </section>

            <div><h2 className="text-base font-semibold text-[#153C5B]">Datos del estudio</h2><p className="mt-2 text-sm text-[#718397]">{calles.length} calles registradas</p><p className="mt-1 text-sm text-[#718397]">Sin permisos de edición</p></div>
            <button type="button" onClick={() => setMostrarRuido((v) => !v)} className="w-full rounded-lg border border-[#CFE2EE] bg-[#EAF4FA] p-3 text-sm font-semibold text-[#155B91] transition-colors hover:bg-[#DDECF5]">{mostrarRuido ? "Ocultar" : "Mostrar"} superficie acústica</button>
            <div><h3 className="mb-3 text-sm font-semibold text-[#153C5B]">Escala de niveles acústicos</h3>{NIVELES_RUIDO.map((nivel) => <div key={nivel.color} className="mb-2 flex items-center gap-2 text-xs text-[#52697C]"><span className="h-3 w-7 rounded" style={{ background: nivel.color }} />{nivel.rango} dB(A)</div>)}</div>
            <p className="text-xs leading-5 text-[#8294A4]">Modelo RLS-90 / DIN 18005-2. Las calles se muestran en modo consulta; la visualización no permite crear, editar ni eliminar geometrías.</p>
          </aside>
        </div>
      </div>
      <ExportarMapaModal vista={vista} descargando={descargando} error={errorDescarga} onDescargar={descargar} onCerrar={cerrarVista} />
    </main>
  );
}

function escapar(valor) {
  return String(valor).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
