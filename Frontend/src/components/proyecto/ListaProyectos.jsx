// Frontend/src/components/proyecto/ListaProyectos.jsx
import ProyectoCard from "./ProyectoCard";

const ListaProyectos = ({ proyectos, onOpen, onDelete, onToggleEstado }) => {
  if (proyectos.length === 0) {
    return (
      <div className="border border-[#052B59] rounded-xl py-16 flex flex-col items-center justify-center text-center">
        <p className="text-[#052B59] font-medium mb-1">No existen proyectos todavía</p>
        <p className="text-[#4B5563] text-sm">Crea un proyecto nuevo</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {proyectos.map((proyecto) => (
        <ProyectoCard
          key={proyecto.id}
          proyecto={proyecto}
          onOpen={onOpen}
          onDelete={onDelete}
          onToggleEstado={onToggleEstado}
        />
      ))}
    </div>
  );
};

export default ListaProyectos;