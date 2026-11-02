
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UserMenu = () => {
  const navigate = useNavigate();

  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  // ======================================
  // DATOS DEL USUARIO
  // ======================================

  const user = (() => {
    try {
      return (
        JSON.parse(localStorage.getItem("user")) || {}
      );
    } catch {
      return {};
    }
  })();

  const nombre =
    user.name || user.nombre || "Usuario";

  const correo =
    user.mail || user.email || "";

  const inicial = nombre.charAt(0).toUpperCase();

  // ======================================
  // CERRAR MENÚ AL HACER CLIC FUERA
  // O PRESIONAR ESCAPE
  // ======================================

  useEffect(() => {
    if (!abierto) return;

    const clickFuera = (e) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target)
      ) {
        setAbierto(false);
      }
    };

    const teclaEscape = (e) => {
      if (e.key === "Escape") {
        setAbierto(false);
      }
    };

    document.addEventListener(
      "mousedown",
      clickFuera
    );

    document.addEventListener(
      "keydown",
      teclaEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        clickFuera
      );

      document.removeEventListener(
        "keydown",
        teclaEscape
      );
    };
  }, [abierto]);

  // ======================================
  // CERRAR SESIÓN
  // ======================================

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  // ======================================
  // INTERFAZ
  // ======================================

  return (
    <div
      className="relative z-[60]"
      ref={contenedorRef}
    >

      {/* ======================================
          BOTÓN DE PERFIL
      ====================================== */}

      <button
        type="button"
        onClick={() =>
          setAbierto((actual) => !actual)
        }
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Menú de usuario: ${nombre}`}
        title={nombre}
        className={`group inline-flex min-h-[43px] items-center gap-2 rounded-xl border bg-white py-1 pl-1 pr-2 shadow-[0_2px_8px_rgba(13,53,89,0.04)] outline-none transition-all duration-200 hover:border-[#9CC7DD] hover:bg-[#F6FAFD] hover:shadow-[0_5px_14px_rgba(13,53,89,0.08)] focus-visible:ring-2 focus-visible:ring-[#287EAB] sm:pr-3 ${
          abierto
            ? "border-[#94BFD9] bg-[#F2F8FC]"
            : "border-[#D5E2EC]"
        }`}
      >

        {/* AVATAR */}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#287EAB] to-[#0D3559] text-sm font-extrabold text-white shadow-sm">
          {inicial}
        </span>

        {/* INFORMACIÓN DEL USUARIO */}
        <span className="hidden min-w-0 flex-col items-start text-left leading-tight sm:flex">

          <span className="max-w-[135px] truncate text-[12px] font-bold text-[#153C5B]">
            {nombre}
          </span>

          <span className="mt-0.5 text-[10px] font-medium text-[#8093A3]">
            Mi cuenta
          </span>
        </span>

        {/* FLECHA */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`text-[#718397] transition-transform duration-200 ${
            abierto ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* ======================================
          MENÚ DESPLEGABLE
      ====================================== */}

      {abierto && (
        <div
          role="menu"
          aria-label="Opciones de usuario"
          className="absolute right-0 top-[calc(100%+12px)] z-[70] w-[min(310px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#D8E5EE] bg-white shadow-[0_22px_55px_rgba(13,53,89,0.18)]"
        >

          {/* FRANJA DECORATIVA */}
          <div className="h-1.5 bg-gradient-to-r from-[#0D3559] via-[#287EAB] to-[#8CCCE5]" />

          {/* DATOS DEL USUARIO */}
          <div className="flex items-center gap-3 px-5 py-5">

            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FA] text-lg font-extrabold text-[#155B91]">
              {inicial}
            </span>

            <div className="min-w-0 flex-1">

              <p className="truncate text-[14px] font-bold text-[#153C5B]">
                {nombre}
              </p>

              {correo && (
                <p className="mt-1 truncate text-xs text-[#718397]">
                  {correo}
                </p>
              )}
            </div>
          </div>

          <div className="mx-4 border-t border-[#E7EDF3]" />

          {/* CERRAR SESIÓN */}
          <div className="p-3">

            <button
              type="button"
              role="menuitem"
              onClick={cerrarSesion}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-[#B4434B] outline-none transition-all duration-200 hover:bg-[#FFF2F3] hover:text-[#982B35] focus-visible:ring-2 focus-visible:ring-[#D96C77]"
            >

              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF0F1]">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M17 16l4-4m0 0l-4-4m4 4H9" />
                  <path d="M13 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3" />
                </svg>
              </span>

              <span>Cerrar sesión</span>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-auto opacity-60"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default UserMenu;
