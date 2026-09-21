// Frontend/src/components/proyecto/ProyectoModal.jsx
import { useState, useEffect } from "react";

const ProyectoModal = ({ proyecto, onClose, onSave }) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState("borrador");

  useEffect(() => {
    if (proyecto) {
      setNombre(proyecto.nombre);
      setDescripcion(proyecto.descripcion);
      setEstado(proyecto.estado);
    }
  }, [proyecto]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSave({ ...proyecto, nombre, descripcion, estado });
  };

  return (
    <div className="fixed inset-0 bg-ink/30 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-sm border border-line">
        <h2 className="font-sans font-semibold text-lg text-ink mb-5">
          {proyecto ? "Editar proyecto" : "Nuevo proyecto"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-ink-soft mb-1.5">Nombre</label>
            <input
              type="text"
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Diagnóstico Isla Teja"
              className="w-full px-3 py-2 rounded-lg border border-line text-ink text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-ink-soft mb-1.5">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve descripción del área o propósito del proyecto"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-line text-ink text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-ink-soft mb-1.5">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-line text-ink text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-white"
            >
              <option value="borrador">Borrador</option>
              <option value="listo">Listo</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              {proyecto ? "Guardar cambios" : "Crear proyecto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProyectoModal;