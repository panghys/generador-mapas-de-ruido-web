import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import clientAxios from "../config/clienteAxios";
import CapaRuidoRaster from "./CapaRuidoRaster";
import { NIVELES_RUIDO, obtenerColorRuido } from "./nivelesRuido";
import { calcularRuidoLocal } from "./ruidoLocal";
import { obtenerNivelEmisionCalle } from "./ruidoPropagacion";
import { crearUrlVistaPrevia, descargarMapaRuido, generarMapaRuido } from "./exportarMapaRuido";
import ExportarMapaModal from "./ExportarMapaModal";

const comoObjeto = (geojson) => { try { return typeof geojson === "string" ? JSON.parse(geojson) : geojson; } catch { return null; } };
const poligonoALatlng = (zona) => (comoObjeto(zona)?.coordinates?.[0] || []).map(([lng, lat]) => [lat, lng]);
const lineaALatlng = (calle) => (comoObjeto(calle.trazo_calle)?.coordinates || []).map(([lng, lat]) => [lat, lng]);

function prepararCalle(calle) {
  const nivel = calcularRuidoLocal({
    pequeños: calle.trafico_vehiculos_pequenos,
    medianos: calle.trafico_vehiculos_medianos,
    grandes: calle.trafico_vehiculos_grandes,
  }, calle.velocidadPromedio ?? 50, calle.tipoSuperficie || "asfalto_no_ranurado", calle.periodoConteo || "15_minutos");
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
      .then(({ data }) => { setProyecto(data.data); setCalles((data.data.calles || []).map(prepararCalle)); })
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
      const capaZona = L.polygon(zona, { color: "#2dd4bf", weight: 2, fillOpacity: 0.08 }).addTo(mapa);
      mapa.fitBounds(capaZona.getBounds(), { padding: [35, 35] });
    }
    const lineas = calles.filter((c) => c.latlngs.length >= 2);
    lineas.forEach((calle) => {
      const color = calle.nivelRuidoCalculado > 0 ? obtenerColorRuido(calle.nivelRuidoCalculado).color : calle.color_asignado || "#eab308";
      L.polyline(calle.latlngs, { color: "#111827", weight: 6, interactive: false }).addTo(mapa);
      L.polyline(calle.latlngs, { color, weight: 3, interactive: true })
        .bindPopup(`<strong>${escapar(calle.nombre_calle || "Calle sin nombre")}</strong><br/>${Number(calle.nivelRuidoCalculado || 0).toFixed(1)} dB(A)`)
        .addTo(mapa);
    });
    return () => { mapa.remove(); mapaRef.current = null; };
  }, [proyecto, calles]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !mostrarRuido || !proyecto?.zona || !calles.length) return;
    const fuentes = calles.map((calle) => ({ latlngs: calle.latlngs, nivel: obtenerNivelEmisionCalle(calle) }))
      .filter((c) => c.latlngs.length >= 2 && Number.isFinite(c.nivel));
    if (!fuentes.length) return;
    const capa = new CapaRuidoRaster({ calles: fuentes, zona: poligonoALatlng(proyecto.zona) }, { pane: "superficieRuido", opacidad: 0.6 }).addTo(mapa);
    return () => { if (mapa.hasLayer(capa)) mapa.removeLayer(capa); };
  }, [proyecto, calles, mostrarRuido]);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  async function exportar() {
    if (!proyecto?.zona) return;
    setExportando(true);
    setErrorExportar("");
    try {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const fuentes = calles.map((calle) => ({ latlngs: calle.latlngs, nivel: obtenerNivelEmisionCalle(calle) }))
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

  if (cargando) return <main className="min-h-screen bg-[#0F1417] p-12 text-white">Cargando mapa público...</main>;
  if (error || !proyecto) return <main className="min-h-screen bg-[#0F1417] p-12 text-white"><p>{error || "Mapa no disponible."}</p><Link to="/comunidad" className="mt-4 inline-block text-teal-300 underline">Volver a la comunidad</Link></main>;
  return (
    <main className="min-h-screen bg-[#0F1417] px-5 py-10 text-white sm:px-10">
      <div className="mx-auto max-w-7xl">
        <Link to="/comunidad" className="text-sm text-teal-300 hover:underline">← Volver a la comunidad</Link>
        <div className="mb-7 mt-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-300">Solo lectura · Proyecto listo</span>
            <h1 className="mt-4 text-3xl font-bold">{proyecto.nombre}</h1>
            <p className="mt-2 text-sm text-slate-400">Por {proyecto.usuario?.name || "Comunidad"} · {[proyecto.comuna, proyecto.region].filter(Boolean).join(", ") || "Zona delimitada"}</p>
          </div>
          <button type="button" disabled={!proyecto.zona || !calles.length || exportando} onClick={exportar} className="rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-[#0F1417] hover:bg-teal-300 disabled:opacity-40">{exportando ? "Generando reporte..." : "Ver / descargar reporte del mapa"}</button>
        </div>
        {proyecto.descripcion && <p className="mb-6 max-w-3xl leading-7 text-slate-300">{proyecto.descripcion}</p>}
        {errorExportar && <p role="alert" className="mb-4 text-sm text-red-300">{errorExportar}</p>}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#171D21]">
            <div ref={mapaContenedor} className="h-[530px] w-full sm:h-[650px]" aria-label="Mapa acústico público, solo lectura" />
          </section>
          <aside className="h-fit space-y-5 rounded-2xl border border-white/10 bg-[#171D21] p-5">
            <div><h2 className="text-base font-semibold">Datos del estudio</h2><p className="mt-2 text-sm text-slate-400">{calles.length} calles registradas</p><p className="mt-1 text-sm text-slate-400">Sin permisos de edición</p></div>
            <button type="button" onClick={() => setMostrarRuido((v) => !v)} className="w-full rounded-lg border border-teal-400/50 p-3 text-sm font-semibold text-teal-300">{mostrarRuido ? "Ocultar" : "Mostrar"} superficie acústica</button>
            <div><h3 className="mb-3 text-sm font-semibold">Escala de niveles acústicos</h3>{NIVELES_RUIDO.map((nivel) => <div key={nivel.color} className="mb-2 flex items-center gap-2 text-xs text-slate-300"><span className="h-3 w-7 rounded" style={{ background: nivel.color }} />{nivel.rango} dB(A)</div>)}</div>
            <p className="text-xs leading-5 text-slate-500">Modelo RLS-90 / DIN 18005-2. Las calles se muestran en modo consulta; la visualización no permite crear, editar ni eliminar geometrías.</p>
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
