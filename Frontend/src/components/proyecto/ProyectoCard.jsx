// Frontend/src/components/proyecto/ProyectoCard.jsx
import { useState } from "react";
import EstadoBadge from "./EstadoBadge";
import DeleteConfirmModal from "./DeleteConfirmModal";
import DescripcionProyectoModal from "./DescripcionProyectoModal";
import MiniMapaPreview from "./MiniMapaPreview";

const formatFecha = (fecha) =>
  new Date(fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });

const ProyectoCard = ({ proyecto, onOpen, onDelete, onToggleEstado, onTogglePublico }) => {
  const [modalEliminacionAbierto, setModalEliminacionAbierto] = useState(false);
  const [modalDescripcionAbierto, setModalDescripcionAbierto] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [cambiandoPublico, setCambiandoPublico] = useState(false);

  const esListo = proyecto.estado === "listo";

  // Alterna entre "borrador" y "listo" (finalizado). Un proyecto "procesando" no se toca.
  const handleToggleEstado = async (e) => {
    e.stopPropagation(); // el clic no debe abrir el proyecto
    setCambiandoEstado(true);
    try {
      await onToggleEstado(proyecto.id, esListo ? "borrador" : "listo");
    } finally {
      setCambiandoEstado(false);
    }
  };

  const handleTogglePublico = async (e) => {
    e.stopPropagation();
    if (!esListo || cambiandoPublico) return;
    setCambiandoPublico(true);
    try { await onTogglePublico(proyecto.id, !proyecto.es_publico); }
    finally { setCambiandoPublico(false); }
  };

  const handleEliminar = async () => {
    setEliminando(true);
    try {
      await onDelete(proyecto.id);
      setModalEliminacionAbierto(false);
    } finally {
      setEliminando(false);
    }
  };

  const handleClickDelete = (e) => {
    e.stopPropagation();
    setModalEliminacionAbierto(true);
  };

  return (
    <>
      <article
        onClick={() => onOpen(proyecto)}
        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#DCE5EC] bg-white text-left shadow-[0_6px_24px_rgba(19,54,83,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#B4CFDF] hover:shadow-[0_16px_36px_rgba(19,54,83,0.12)]"
      >
        {/* La vista previa real se conserva: no sustituimos MiniMapaPreview. */}
        <div className="relative h-[190px] overflow-hidden border-b border-[#E7EDF2] bg-[#EAF2F7]">
          <MiniMapaPreview zona={proyecto.zona} proyectoId={proyecto.id} />
          <span className="absolute bottom-3 left-3 right-3 w-fit max-w-[calc(100%-24px)] truncate rounded-lg border border-white/70 bg-white/95 px-3 py-1.5 text-[11px] font-bold text-[#155B91] shadow-sm backdrop-blur-sm">
            📍 {proyecto.comuna ? `${proyecto.comuna}, ${proyecto.region}` : "Ubicación pendiente"}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <EstadoBadge estado={proyecto.estado} />
            <div className="flex items-center gap-2">
              {/* Alternar borrador/listo, mismo handler original. */}
              <button
                type="button"
                role="switch"
                aria-checked={esListo}
                aria-label={esListo ? "Volver a borrador" : "Marcar como listo"}
                title={esListo ? "Listo · clic para volver a borrador" : "Borrador · clic para marcar como listo"}
                onClick={handleToggleEstado}
                disabled={cambiandoEstado || proyecto.estado === "procesando"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5EC] bg-[#F8FBFD] px-2.5 py-1.5 text-xs font-semibold text-[#52697C] transition-all hover:border-[#9DC5DD] hover:bg-[#EEF6FB] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${esListo ? "bg-[#155B91]" : "bg-[#BBCAD5]"}`}>
                  <span className={`absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${esListo ? "translate-x-4" : "translate-x-0"}`} />
                </span>
                <span className="hidden sm:inline">Estado</span>
              </button>
              <button
                type="button"
                onClick={handleClickDelete}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#F3D8DB] bg-[#FFF6F6] text-[#B84752] transition-colors hover:border-red-300 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-400"
                title="Eliminar proyecto"
                aria-label={`Eliminar proyecto ${proyecto.nombre}`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <h3 className="mb-2 break-words text-lg font-extrabold leading-snug text-[#153C5B]">{proyecto.nombre}</h3>
          <p className="mb-3 line-clamp-2 min-h-[40px] text-sm leading-5 text-[#617487]">
            {proyecto.descripcion || "Sin descripción"}
          </p>
          {proyecto.descripcion && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setModalDescripcionAbierto(true);
              }}
              className="mb-4 self-start text-xs font-bold text-[#155B91] underline-offset-4 transition-colors hover:text-[#0B3D62] hover:underline"
            >
              Ver descripción completa
            </button>
          )}

          <div className="mt-auto border-t border-[#EDF1F5] pt-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(proyecto.es_publico && esListo)}
                aria-label={proyecto.es_publico && esListo ? "Hacer privado" : "Publicar mapa"}
                title={!esListo ? "Marca primero el proyecto como Listo" : "Cambiar visibilidad del mapa"}
                disabled={!esListo || cambiandoPublico}
                onClick={handleTogglePublico}
                className="inline-flex min-h-[38px] max-w-full items-center gap-3 rounded-xl border border-[#DCE5EC] bg-[#F8FBFD] px-3 py-2 text-xs font-bold text-[#153C5B] transition-all hover:border-[#9CC7DD] hover:bg-[#EFF7FB] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span className="whitespace-nowrap">{proyecto.es_publico && esListo ? "🌐 Público" : "🔒 Privado"}</span>
                {/* Contenedor fijo: el círculo queda siempre DENTRO, sin encogerse. */}
                <span className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors ${proyecto.es_publico && esListo ? "bg-[#1EAB89]" : "bg-[#A5B4C0]"}`}>
                  <span className={`absolute left-1 top-1 block h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.18)] transition-transform duration-200 ${proyecto.es_publico && esListo ? "translate-x-5" : "translate-x-0"}`} />
                </span>
              </button>
              <span className="whitespace-nowrap text-xs font-medium text-[#8294A4]">
                {formatFecha(proyecto.fecha_modificacion)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[#EEF5FA] px-4 py-3 text-sm font-bold text-[#155B91] transition-colors group-hover:bg-[#DDECF6]">
              Abrir mapa de ruido
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </article>

      {modalDescripcionAbierto && (
        <DescripcionProyectoModal
          proyecto={proyecto}
          onClose={() => setModalDescripcionAbierto(false)}
        />
      )}

      {modalEliminacionAbierto && (
        <DeleteConfirmModal
          proyecto={proyecto}
          onConfirm={handleEliminar}
          onCancel={() => setModalEliminacionAbierto(false)}
          isLoading={eliminando}
        />
      )}
    </>
  );
};

export default ProyectoCard;