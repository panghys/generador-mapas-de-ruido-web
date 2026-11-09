import { useState } from "react";
import { useNavigate } from "react-router-dom";
import clientAxios from "../config/clienteAxios";

const ProyectoNuevo = () => {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState("borrador");
  const [modeloCalculo, setModeloCalculo] = useState("RLS90");
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
        modeloCalculo,
      });
      navigate("/proyectos");
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo crear el proyecto. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-10 font-sans text-[#243447] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate("/proyectos")}
          className="mb-8 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#617487] transition-colors hover:bg-[#EAF4FA] hover:text-[#155B91] focus-visible:ring-2 focus-visible:ring-[#155B91]"
        >
          <span aria-hidden="true">←</span> Volver a proyectos
        </button>

        <header className="mb-8 border-b border-[#DCE5EC] pb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.17em] text-[#287EAB]">Configuración inicial del estudio</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#153C5B] sm:text-4xl">Crear un proyecto de ruido</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#617487]">
            Define el nombre y la descripción para comenzar. La ubicación se define más adelante, delimitando la zona directamente en el mapa.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-[#DCE5EC] bg-white shadow-[0_10px_34px_rgba(19,54,83,0.07)]">
          <div className="border-b border-[#E7EDF2] bg-[#F9FBFD] px-6 py-6 sm:px-9">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF4FA] text-lg font-bold text-[#155B91]">1</span>
            <h2 className="mt-3 text-lg font-bold text-[#153C5B]">Información general</h2>
            <p className="mt-1 text-sm text-[#718397]">Completa los datos principales del proyecto.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-9">
            <div className="space-y-7">
              <div>
                <label htmlFor="nombre" className="mb-2 block text-sm font-bold text-[#153C5B]">Nombre del proyecto <span className="text-red-500">*</span></label>
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
                  className="w-full rounded-xl border border-[#D6E2EA] bg-[#FAFCFE] px-4 py-3 text-sm text-[#243447] outline-none transition-all placeholder:text-[#99A9B5] focus:border-[#287EAB] focus:bg-white focus:ring-4 focus:ring-[#287EAB]/10"
                />
                {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
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

            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-[#052B59]">Modelo de cálculo</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    valor: "RLS90",
                    titulo: "RLS-90",
                    detalle: "Método simplificado: nivel único en dB(A) a 25 m según flujo, porcentaje de pesados, velocidad y superficie.",
                  },
                  {
                    valor: "CNOSSOS",
                    titulo: "CNOSSOS-EU",
                    detalle: "Método europeo por bandas de octava con cuatro categorías de vehículo (livianos, medianos, pesados y motocicletas).",
                  },
                ].map((opcion) => (
                  <label
                    key={opcion.valor}
                    className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors ${
                      modeloCalculo === opcion.valor
                        ? "border-[#1C5DAC] bg-[#1C5DAC]/5"
                        : "border-slate-300 hover:border-[#1C5DAC]/60"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-[#052B59]">
                      <input
                        type="radio"
                        name="modeloCalculo"
                        value={opcion.valor}
                        checked={modeloCalculo === opcion.valor}
                        onChange={() => setModeloCalculo(opcion.valor)}
                        className="accent-[#1C5DAC]"
                      />
                      {opcion.titulo}
                    </span>
                    <span className="text-xs leading-5 text-[#4B5563]">{opcion.detalle}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#4B5563]">El modelo no se puede cambiar después de crear el proyecto.</p>
            </fieldset>
              <div>
                <label htmlFor="descripcion" className="mb-2 block text-sm font-bold text-[#153C5B]">Descripción</label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  placeholder="Breve descripción del área o propósito del proyecto"
                  rows={5}
                  className="w-full resize-y rounded-xl border border-[#D6E2EA] bg-[#FAFCFE] px-4 py-3 text-sm leading-6 text-[#243447] outline-none transition-all placeholder:text-[#99A9B5] focus:border-[#287EAB] focus:bg-white focus:ring-4 focus:ring-[#287EAB]/10"
                />
              </div>

              <div>
                <label htmlFor="estado" className="mb-2 block text-sm font-bold text-[#153C5B]">Estado inicial</label>
                <select
                  id="estado"
                  value={estado}
                  onChange={(event) => setEstado(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-[#D6E2EA] bg-[#FAFCFE] px-4 py-3 text-sm font-medium text-[#243447] outline-none transition-all focus:border-[#287EAB] focus:ring-4 focus:ring-[#287EAB]/10"
                >
                  <option value="borrador">Borrador</option>
                  <option value="listo">Listo</option>
                </select>
                <p className="mt-2 text-xs text-[#8294A4]">Puedes modificar el estado después desde Mis Proyectos.</p>
              </div>
            </div>

            <div className="mt-9 flex flex-col-reverse gap-3 border-t border-[#E7EDF2] pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/proyectos")}
                className="rounded-xl border border-[#D6E2EA] bg-white px-6 py-3 text-sm font-bold text-[#617487] transition-colors hover:border-[#9CC7DD] hover:bg-[#F1F7FB] hover:text-[#155B91]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="rounded-xl bg-[#155B91] px-7 py-3 text-sm font-bold text-white shadow-[0_6px_18px_rgba(21,91,145,0.2)] transition-all hover:bg-[#104A75] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[#155B91] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando ? "Creando..." : "Crear proyecto"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ProyectoNuevo;