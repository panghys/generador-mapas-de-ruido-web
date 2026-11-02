import React, { useState, useEffect, useCallback } from "react";
import clientAxios from "../config/clienteAxios";

const ColaboradoresModal = ({ abierto, onCerrar, proyectoId, esPropietario }) => {
  const [colaboradores, setColaboradores] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("editor");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  const cargarColaboradores = useCallback(async () => {
    if (!proyectoId) return;
    setCargando(true);
    setError("");
    try {
      const { data } = await clientAxios.get(`/proyectos/${proyectoId}/colaboradores`);
      setColaboradores(data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar la lista de colaboradores");
    } finally {
      setCargando(false);
    }
  }, [proyectoId]);

  useEffect(() => {
    if (abierto) {
      cargarColaboradores();
      setEmail("");
      setError("");
      setMensajeExito("");
    }
  }, [abierto, cargarColaboradores]);

  if (!abierto) return null;

  const handleInvitar = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setProcesando(true);
    setError("");
    setMensajeExito("");

    try {
      await clientAxios.post(`/proyectos/${proyectoId}/colaboradores`, {
        mail: email.trim(),
        rol,
      });
      setMensajeExito("Colaborador agregado correctamente");
      setEmail("");
      cargarColaboradores();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo invitar al usuario");
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminar = async (usuarioId, nombre) => {
    if (!window.confirm(`¿Seguro que deseas revocar el acceso a ${nombre}?`)) return;

    setError("");
    setMensajeExito("");

    try {
      await clientAxios.delete(`/proyectos/${proyectoId}/colaboradores/${usuarioId}`);
      setMensajeExito("Acceso revocado correctamente");
      cargarColaboradores();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo remover al colaborador");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-base font-semibold text-white">Colaboradores del Proyecto</h3>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="text-slate-400 hover:text-white transition-colors text-xl font-bold p-1 leading-none"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-red-950/70 border border-red-800 text-red-200 text-xs rounded-lg">
              {error}
            </div>
          )}

          {mensajeExito && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs rounded-lg">
              {mensajeExito}
            </div>
          )}

          {/* Formulario de invitación */}
          {esPropietario ? (
            <form onSubmit={handleInvitar} className="space-y-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700/60">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Invitar colaborador por correo
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="usuario@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                />
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="editor">Editor</option>
                </select>
                <button
                  type="submit"
                  disabled={procesando}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap shadow-sm"
                >
                  {procesando ? "Agregando..." : "Invitar"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
              Solo el propietario del proyecto puede invitar o remover colaboradores.
            </div>
          )}

          {/* Listado de miembros */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Miembros con acceso ({colaboradores.length})
            </h4>

            {cargando ? (
              <p className="text-sm text-slate-400 py-4 text-center">Cargando colaboradores...</p>
            ) : colaboradores.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                Aún no hay colaboradores en este proyecto.
              </p>
            ) : (
              <ul className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
                {colaboradores.map((item) => {
                  const usuario = item.usuario || {};
                  return (
                    <li key={item.id} className="flex items-center justify-between p-3.5 hover:bg-slate-800/20 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{usuario.name || "Sin nombre"}</span>
                        <span className="text-xs text-slate-400">{usuario.mail}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          item.rol === "propietario"
                            ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                            : "bg-indigo-950/80 text-indigo-300 border border-indigo-800"
                        }`}>
                          {item.rol === "propietario" ? "Propietario" : "Editor"}
                        </span>

                        {esPropietario && item.rol !== "propietario" && (
                          <button
                            type="button"
                            onClick={() => handleEliminar(usuario.id, usuario.name)}
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-900/40 hover:bg-red-950/40 transition-colors"
                          >
                            Revocar
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColaboradoresModal;
