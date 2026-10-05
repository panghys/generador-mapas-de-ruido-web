// Frontend/src/components/proyecto/ProyectoCard.jsx
import { useState } from "react";
import EstadoBadge from "./EstadoBadge";
import DeleteConfirmModal from "./DeleteConfirmModal";
import MiniMapaPreview from "./MiniMapaPreview";

const formatFecha = (fecha) =>
  new Date(fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });

const ProyectoCard = ({ proyecto, onOpen, onDelete, onToggleEstado }) => {
  const [modalEliminacionAbierto, setModalEliminacionAbierto] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

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
      <div
        onClick={() => onOpen(proyecto)}
        className="text-left bg-[#1C5DAC] hover:bg-[#1C5DAC]/90 border border-[#4B5563] rounded-xl overflow-hidden transition-colors group cursor-pointer relative"
      >
        {/* Vista previa: mini-mapa de la zona delimitada, o placeholder si aún no existe */}
        <div className="relative h-[150px] border-b border-[#4B5563]">
          <MiniMapaPreview zona={proyecto.zona} proyectoId={proyecto.id} />

          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#1C5DAC]/70 px-2.5 py-1 text-xs font-light text-white backdrop-blur-sm">
            📍 {proyecto.comuna ? `${proyecto.comuna}, ${proyecto.region}` : "Ubicación pendiente"}
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <EstadoBadge estado={proyecto.estado} />
            <div className="flex items-center gap-2">
              {/* Toggle borrador ⇄ listo */}
              <button
                type="button"
                role="switch"
                aria-checked={esListo}
                aria-label={esListo ? "Volver a borrador" : "Marcar como listo"}
                title={esListo ? "Listo · clic para volver a borrador" : "Borrador · clic para marcar como listo"}
                onClick={handleToggleEstado}
                disabled={cambiandoEstado || proyecto.estado === "procesando"}
                className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-xs font-bold text-[#052B59] transition-colors hover:text-dash-text disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span
                  className={`relative inline-flex h-5 w-9 items-center border border-[#052B59] rounded-full transition-colors ${
                    esListo ? "bg-[#052B59]" : "bg-[#052B59]/40"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      esListo ? "translate-x-[18px]" : "translate-x-[2px]"
                    }`}
                  />
                </span>
                Listo
              </button>

              <button
                onClick={handleClickDelete}
                className="p-1.5 text-[#052B59] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Eliminar proyecto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* Flecha de navegación */}
              <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#052B59] opacity-0 group-hover:opacity-100 transition-opacity" fill="none">
                <path d="M6 3.5L10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <h3 className="text-white font-medium text-sm mb-1">{proyecto.nombre}</h3>
          <p className="text-[#052B59] text-sm mb-3 line-clamp-1">{proyecto.descripcion || "Sin descripción"}</p>

          <span className="font-mono text-xs text-white/80">
            {formatFecha(proyecto.fecha_modificacion)}
          </span>
        </div>
      </div>


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