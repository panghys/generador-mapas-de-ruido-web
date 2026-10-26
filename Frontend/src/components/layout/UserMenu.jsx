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
        className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-1 pr-3 text-white outline-none transition-colors hover:border-[#70adf7] hover:text-[#70adf7] focus-visible:ring-2 focus-visible:ring-[#70adf7] sm:pr-4"
        aria-haspopup="true"
        aria-expanded={abierto}
        title={nombre}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1C5DAC]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </span>
        <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:block">{nombre}</span>
        <svg
          className={`hidden h-4 w-4 transition-transform sm:block ${abierto ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {abierto && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-white/15 bg-[#052B59] p-2 shadow-2xl">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-white">{nombre}</p>
            {correo && <p className="truncate text-xs text-slate-400">{correo}</p>}
          </div>

          <div className="my-1 border-t border-white/10" />

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