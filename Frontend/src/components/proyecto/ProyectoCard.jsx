// Frontend/src/components/proyecto/ProyectoCard.jsx
import { useState } from "react";
import EstadoBadge from "./EstadoBadge";
import DeleteConfirmModal from "./DeleteConfirmModal";

const formatFecha = (fecha) =>
  new Date(fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });

const ProyectoCard = ({ proyecto, onOpen, onDelete }) => {
  const [modalEliminacionAbierto, setModalEliminacionAbierto] = useState(false);
  const [eliminando, setEliminando] = useState(false);

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
        className="text-left bg-dash-surface hover:bg-dash-surface-hover border border-dash-border rounded-xl overflow-hidden transition-colors group cursor-pointer relative"
      >
        {/* Zona de vista previa del mapa — placeholder hasta que exista el cálculo real */}
        <div className={`aspect-[16/7] flex items-center justify-center border-b border-dash-border ${proyecto.preview === "river" ? "bg-[linear-gradient(135deg,#183b43_0%,#1a252a_42%,#0d171b_43%,#14282b_100%)]" : "bg-[linear-gradient(135deg,#254d4c_0%,#1a302f_36%,#142026_37%,#10171b_100%)]"}`}>
          {proyecto.preview_url ? (
            <img src={proyecto.preview_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center"><div className="mx-auto mb-2 h-8 w-8 rounded-full border border-dash-accent/50 bg-dash-accent/10" /><span className="text-xs text-white/70">Vista previa del mapa</span></div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <EstadoBadge estado={proyecto.estado} />
            <div className="flex items-center gap-2">
              {/* Botón de eliminar con icono de papelera */}
              <button
                onClick={handleClickDelete}
                className="p-1.5 text-dash-text-soft hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Eliminar proyecto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* Flecha de navegación */}
              <svg viewBox="0 0 16 16" className="w-4 h-4 text-dash-text-soft opacity-0 group-hover:opacity-100 transition-opacity" fill="none">
                <path d="M6 3.5L10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <h3 className="text-dash-text font-medium text-sm mb-1">{proyecto.nombre}</h3>
          <p className="text-dash-text-soft text-sm mb-1 line-clamp-1">{proyecto.descripcion || "Sin descripción"}</p>
          <p className="mb-3 text-xs text-dash-text-soft">{proyecto.comuna ? `${proyecto.comuna}, ${proyecto.region}` : "Ubicación pendiente"}</p>

          <span className="font-mono text-xs text-dash-text-soft">
            {formatFecha(proyecto.fecha_modificacion)}
          </span>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
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