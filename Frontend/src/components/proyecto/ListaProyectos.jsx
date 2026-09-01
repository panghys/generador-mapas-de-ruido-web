// Frontend/src/components/proyecto/ListaProyectos.jsx
import EstadoBadge from "./EstadoBadge";

const formatFecha = (fecha) =>
  new Date(fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });

const ListaProyectos = ({ proyectos, onEdit, onDelete }) => {
  if (proyectos.length === 0) {
    return (
      <div className="border border-line rounded-2xl py-16 flex flex-col items-center justify-center text-center">
        <p className="text-ink font-medium mb-1">Aún no tienes proyectos</p>
        <p className="text-ink-soft text-sm">Crea el primero para empezar a mapear una zona.</p>
      </div>
    );
  }

  return (
    <div className="border border-line rounded-2xl overflow-hidden">
      {proyectos.map((proyecto, i) => (
        <div
          key={proyecto.id}
          className={`group flex items-center justify-between px-5 py-4 hover:bg-paper/60 transition-colors ${
            i !== proyectos.length - 1 ? "border-b border-line" : ""
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-ink font-medium text-sm truncate">{proyecto.nombre}</h3>
              <EstadoBadge estado={proyecto.estado} />
            </div>
            <p className="text-ink-soft text-sm truncate">{proyecto.descripcion || "Sin descripción"}</p>
          </div>

          <div className="flex items-center gap-4 pl-4 shrink-0">
            <span className="font-mono text-xs text-ink-soft hidden sm:block">
              {formatFecha(proyecto.fecha_modificacion)}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(proyecto)}
                className="text-xs text-ink-soft hover:text-accent px-2 py-1"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(proyecto.id)}
                className="text-xs text-ink-soft hover:text-red-600 px-2 py-1"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListaProyectos;