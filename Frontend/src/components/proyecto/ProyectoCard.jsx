// Frontend/src/components/proyecto/ProyectoCard.jsx
import EstadoBadge from "./EstadoBadge";

const formatFecha = (fecha) =>
  new Date(fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });

const ProyectoCard = ({ proyecto, onOpen }) => {
  return (
    <button
      onClick={() => onOpen(proyecto)}
      className="text-left bg-dash-surface hover:bg-dash-surface-hover border border-dash-border rounded-xl overflow-hidden transition-colors group"
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
          <svg viewBox="0 0 16 16" className="w-4 h-4 text-dash-text-soft opacity-0 group-hover:opacity-100 transition-opacity" fill="none">
            <path d="M6 3.5L10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h3 className="text-dash-text font-medium text-sm mb-1">{proyecto.nombre}</h3>
        <p className="text-dash-text-soft text-sm mb-1 line-clamp-1">{proyecto.descripcion || "Sin descripción"}</p>
        <p className="mb-3 text-xs text-dash-text-soft">{proyecto.comuna ? `${proyecto.comuna}, ${proyecto.region}` : "Ubicación pendiente"}</p>

        <span className="font-mono text-xs text-dash-text-soft">
          {formatFecha(proyecto.fecha_modificacion)}
        </span>
      </div>
    </button>
  );
};

export default ProyectoCard;