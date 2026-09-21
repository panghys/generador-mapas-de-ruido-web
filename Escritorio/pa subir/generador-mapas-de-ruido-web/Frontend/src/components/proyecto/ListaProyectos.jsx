// Frontend/src/components/proyecto/ListaProyectos.jsx
import ProyectoCard from "./ProyectoCard";

const ListaProyectos = ({ proyectos, onOpen, onDelete }) => {
  if (proyectos.length === 0) {
    return (
      <div className="border border-dash-border rounded-xl py-16 flex flex-col items-center justify-center text-center">
        <p className="text-dash-text font-medium mb-1">No hay proyectos en este filtro</p>
        <p className="text-dash-text-soft text-sm">Prueba con otro filtro o crea un proyecto nuevo.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {proyectos.map((proyecto) => (
        <ProyectoCard key={proyecto.id} proyecto={proyecto} onOpen={onOpen} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default ListaProyectos;