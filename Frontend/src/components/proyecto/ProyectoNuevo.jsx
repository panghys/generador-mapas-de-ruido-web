import { useState } from "react";
import { useNavigate } from "react-router-dom";
import clientAxios from "../config/clienteAxios";

const ProyectoNuevo = () => {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState("borrador");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!nombre.trim()) {
      setError("Completa el nombre del proyecto para continuar.");
      return;
    }

    setEnviando(true);
    setError("");

    try {
      await clientAxios.post("/proyectos", {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        estado,
      });
      navigate("/proyectos");
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo crear el proyecto. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#D1DDF2] px-6 py-10 font-sans">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/proyectos")}
          className="mb-8 text-sm text-[#4B5563] transition-colors hover:text-[#1C5DAC]"
        >
          ← Volver a proyectos
        </button>

        <div className="mb-8">
          <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-[#1C5DAC]">Nuevo proyecto</p>
          <h1 className="text-3xl font-semibold text-[#052B59]">Crea un proyecto de ruido</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#4B5563]">
            Define el nombre y la descripción para comenzar. La ubicación se define más adelante, delimitando la zona directamente en el mapa.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="border border-slate-300 bg-white p-6 rounded-lg shadow-sm sm:p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="nombre" className="mb-2 block text-sm font-medium text-[#052B59]">
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
                className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#1C5DAC]"
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <div>
              <label htmlFor="descripcion" className="mb-2 block text-sm font-medium text-[#052B59]">
                Descripción
              </label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Breve descripción del área o propósito del proyecto"
                rows={5}
                className="w-full resize-none border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#1C5DAC]"
              />
            </div>

            <div>
              <label htmlFor="estado" className="mb-2 block text-sm font-medium text-[#052B59]">
                Estado inicial
              </label>
              <select
                id="estado"
                value={estado}
                onChange={(event) => setEstado(event.target.value)}
                className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1C5DAC]"
              >
                <option value="borrador">Borrador</option>
                <option value="listo">Listo</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/proyectos")}
              className="px-4 py-2.5 text-sm font-medium text-[#4E5662] transition-colors hover:text-[#1C5DAC]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="bg-[#1C5DAC] px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {enviando ? "Creando..." : "Crear proyecto"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default ProyectoNuevo;