import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UserMenu = () => {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  const nombre = user.name || user.nombre || "Usuario";
  const correo = user.mail || user.email || "";

  useEffect(() => {
    if (!abierto) return;

    const clickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };

    const teclaEscape = (e) => {
      if (e.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", clickFuera);
    document.addEventListener("keydown", teclaEscape);

    return () => {
      document.removeEventListener("mousedown", clickFuera);
      document.removeEventListener("keydown", teclaEscape);
    };
  }, [abierto]);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-dash-surface text-dash-text-soft outline-none transition-colors hover:border-dash-accent hover:text-dash-accent focus-visible:ring-2 focus-visible:ring-dash-accent"
        aria-haspopup="true"
        aria-expanded={abierto}
        title={nombre}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
      </button>

      {abierto && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-white">{nombre}</p>
            {correo && <p className="truncate text-xs text-slate-400">{correo}</p>}
          </div>

          <div className="my-1 border-t border-slate-800" />

          <button
            type="button"
            onClick={cerrarSesion}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;