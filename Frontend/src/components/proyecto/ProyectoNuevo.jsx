import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ProyectoNuevo = () => {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [region, setRegion] = useState("");
  const [comuna, setComuna] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState("borrador");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!nombre.trim() || !region || !comuna) {
      setError("Completa el nombre, la región y la comuna para continuar.");
      return;
    }

    navigate("/proyectos", {
      state: {
        proyectoCreado: {
          id: Date.now(),
          nombre: nombre.trim(),
          region,
          comuna,
          descripcion: descripcion.trim(),
          estado,
          fecha_modificacion: new Date().toISOString(),
        },
      },
    });
  };

  return (
    <main className="min-h-screen bg-dash-bg px-6 py-10 font-sans">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/proyectos")}
          className="mb-8 text-sm text-dash-text-soft transition-colors hover:text-dash-text"
        >
          ← Volver a proyectos
        </button>

        <div className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-dash-accent">Nuevo proyecto</p>
          <h1 className="text-3xl font-semibold text-dash-text">Crea un proyecto de ruido</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-dash-text-soft">
            Define los datos básicos para comenzar a preparar tu mapa y organizar sus mediciones.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="border border-dash-border bg-dash-surface p-6 shadow-sm sm:p-8">
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="region" className="mb-2 block text-sm font-medium text-dash-text">Región</label>
                <select id="region" value={region} onChange={(event) => setRegion(event.target.value)} className="w-full border border-dash-border bg-white px-3 py-2.5 text-sm text-dash-text outline-none focus:border-dash-accent">
                  <option value="">Selecciona una región</option>
                  <option>Los Ríos</option>
                  <option>Los Lagos</option>
                  <option>La Araucanía</option>
                  <option>Metropolitana</option>
                </select>
              </div>
              <div>
                <label htmlFor="comuna" className="mb-2 block text-sm font-medium text-dash-text">Comuna</label>
                <input id="comuna" value={comuna} onChange={(event) => setComuna(event.target.value)} placeholder="Ej: Valdivia" className="w-full border border-dash-border bg-white px-3 py-2.5 text-sm text-dash-text outline-none placeholder:text-dash-text-soft focus:border-dash-accent" />
              </div>
            </div>

            <div>
              <label htmlFor="nombre" className="mb-2 block text-sm font-medium text-dash-text">
                Nombre del proyecto
              </label>
              <input
                id="nombre"
                type="text"
                autoFocus
                value={nombre}
                onChange={(event) => {
                  setNombre(event.target.value);
                  setError("");
                }}
                placeholder="Ej: Diagnóstico Isla Teja"
                className="w-full border border-dash-border bg-white px-3 py-2.5 text-sm text-dash-text outline-none transition-colors placeholder:text-dash-text-soft focus:border-dash-accent"
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <div>
              <label htmlFor="descripcion" className="mb-2 block text-sm font-medium text-dash-text">
                Descripción
              </label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Breve descripción del área o propósito del proyecto"
                rows={5}
                className="w-full resize-none border border-dash-border bg-white px-3 py-2.5 text-sm text-dash-text outline-none transition-colors placeholder:text-dash-text-soft focus:border-dash-accent"
              />
            </div>

            <div>
              <label htmlFor="estado" className="mb-2 block text-sm font-medium text-dash-text">
                Estado inicial
              </label>
              <select
                id="estado"
                value={estado}
                onChange={(event) => setEstado(event.target.value)}
                className="w-full border border-dash-border bg-white px-3 py-2.5 text-sm text-dash-text outline-none focus:border-dash-accent"
              >
                <option value="borrador">Borrador</option>
                <option value="listo">Listo</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-dash-border pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/proyectos")}
              className="px-4 py-2.5 text-sm font-medium text-dash-text-soft transition-colors hover:text-dash-text"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-dash-accent px-5 py-2.5 text-sm font-medium text-dash-bg transition-opacity hover:opacity-90"
            >
              Crear proyecto
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default ProyectoNuevo;