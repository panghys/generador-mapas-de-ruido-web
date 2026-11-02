// Frontend/src/components/proyecto/ListaProyectos.jsx
import ProyectoCard from "./ProyectoCard";

const ListaProyectos = ({ proyectos, onOpen, onDelete, onToggleEstado, onTogglePublico }) => {
  if (proyectos.length === 0) {
    return (
      <div className="border border-dashed border-[#C7D9E5] rounded-2xl bg-white py-20 px-5 flex flex-col items-center justify-center text-center shadow-sm">
        <p className="text-[#153C5B] font-bold text-lg mb-2">No existen proyectos todavía</p>
        <p className="text-[#718397] text-sm">Crea un proyecto nuevo</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {proyectos.map((proyecto) => (
        <ProyectoCard
          key={proyecto.id}
          proyecto={proyecto}
          onOpen={onOpen}
          onDelete={onDelete}
          onToggleEstado={onToggleEstado}
          onTogglePublico={onTogglePublico}
        />
      ))}
    </div>
  );
};

export default ListaProyectos;