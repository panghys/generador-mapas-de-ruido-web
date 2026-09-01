// Frontend/src/components/Proyecto.jsx
import { useState } from "react";
import ListaProyectos from "./proyecto/ListaProyectos";
import ProyectoModal from "./proyecto/ProyectoModal";

const proyectosIniciales = [
  {
    id: 1,
    nombre: "Diagnóstico Isla Teja",
    descripcion: "Levantamiento de ruido en el sector universitario",
    estado: "listo",
    fecha_modificacion: "2026-08-20",
  },
  {
    id: 2,
    nombre: "Corredor Ramón Picarte",
    descripcion: "Comparación de escenarios de velocidad máxima",
    estado: "borrador",
    fecha_modificacion: "2026-08-27",
  },
];

const Proyecto = () => {
  const [proyectos, setProyectos] = useState(proyectosIniciales);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proyectoEditando, setProyectoEditando] = useState(null);

  const handleNuevo = () => {
    setProyectoEditando(null);
    setModalAbierto(true);
  };

  const handleEditar = (proyecto) => {
    setProyectoEditando(proyecto);
    setModalAbierto(true);
  };

  const handleGuardar = (proyecto) => {
    if (proyecto.id) {
      setProyectos((prev) =>
        prev.map((p) => (p.id === proyecto.id ? { ...proyecto, fecha_modificacion: new Date().toISOString() } : p))
      );
    } else {
      setProyectos((prev) => [
        ...prev,
        { ...proyecto, id: Date.now(), fecha_modificacion: new Date().toISOString() },
      ]);
    }
    setModalAbierto(false);
  };

  const handleEliminar = (id) => {
    setProyectos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-paper font-sans px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-ink">Mis proyectos</h1>
          <button
            onClick={handleNuevo}
            className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            + Nuevo proyecto
          </button>
        </div>

        <ListaProyectos proyectos={proyectos} onEdit={handleEditar} onDelete={handleEliminar} />
      </div>

      {modalAbierto && (
        <ProyectoModal
          proyecto={proyectoEditando}
          onClose={() => setModalAbierto(false)}
          onSave={handleGuardar}
        />
      )}
    </div>
  );
};

export default Proyecto;