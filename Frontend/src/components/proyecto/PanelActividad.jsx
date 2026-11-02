import React from "react";

const getIconoActividad = (tipo) => {
  switch (tipo) {
    case "bloqueo":
      return <span className="text-amber-400">✏️</span>;
    case "edicion":
      return <span className="text-indigo-400">💾</span>;
    case "eliminacion":
      return <span className="text-red-400">🗑️</span>;
    case "conexion":
      return <span className="text-emerald-400">🟢</span>;
    case "desconexion":
      return <span className="text-slate-500">⚪</span>;
    default:
      return <span className="text-slate-400">ℹ️</span>;
  }
};

const formatearHora = (timestamp) => {
  if (!timestamp) return "";
  const fecha = new Date(timestamp);
  return fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const PanelActividad = ({ abierto, onCerrar, usuariosConectados = [], actividades = [] }) => {
  return (
    <>
      {/* Fondo tenue con transición suave (Fade) */}
      <div
        onClick={onCerrar}
        className={`fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[1490] transition-opacity duration-300 ease-out ${
          abierto ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer lateral con animación Slide-in / Slide-out */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-slate-900/95 border-l border-slate-800 text-slate-100 z-[1500] flex flex-col backdrop-blur-md transform transition-all duration-300 ease-in-out ${
          abierto
            ? "translate-x-0 opacity-100 shadow-2xl pointer-events-auto"
            : "translate-x-full opacity-0 shadow-none pointer-events-none"
        }`}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase">Trazabilidad en Vivo</h3>
          </div>
          <button
            onClick={onCerrar}
            className="text-slate-400 hover:text-white transition-colors text-lg font-bold p-1 leading-none rounded hover:bg-slate-800/60"
            title="Cerrar panel"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Usuarios activos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                En línea ahora ({usuariosConectados.length})
              </h4>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <div className="space-y-2">
              {usuariosConectados.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No hay colaboradores conectados.</p>
              ) : (
                usuariosConectados.map((usr, idx) => (
                  <div
                    key={`${usr.id}-${idx}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center font-bold text-xs text-indigo-300">
                      {usr.name ? usr.name.slice(0, 2).toUpperCase() : "US"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{usr.name}</p>
                      <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                        {usr.accion !== "Viendo el mapa" ? (
                          <span className="text-amber-400 font-medium">⚡ {usr.accion}</span>
                        ) : (
                          <span>Viendo el mapa</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Feed cronológico de cambios */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Historial de eventos
            </h4>

            {actividades.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Sin actividad registrada en esta sesión.</p>
            ) : (
              <div className="relative border-l border-slate-800 ml-2 space-y-4">
                {actividades.map((act) => (
                  <div key={act.id} className="relative pl-5 text-xs">
                    <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[8px]">
                      •
                    </div>

                    <div className="bg-slate-800/20 p-2 rounded border border-slate-800/60">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                        <span className="flex items-center gap-1">
                          {getIconoActividad(act.tipo)}
                          <strong className="text-slate-300 font-semibold">{act.usuario}</strong>
                        </span>
                        <span>{formatearHora(act.timestamp)}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{act.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500 text-center">
          Sesión sincronizada vía WebSocket
        </div>
      </aside>
    </>
  );
};

export default PanelActividad;