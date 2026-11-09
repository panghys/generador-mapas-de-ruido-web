
import { Link, useLocation } from "react-router-dom";
import UserMenu from "./layout/UserMenu";

// Estilos compartidos para los enlaces de navegación.
const claseEnlace =
  "group relative inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#287EAB] focus-visible:ring-offset-2";

const claseActivo =
  "bg-[#EAF3FA] text-[#155B91]";

const claseInactivo =
  "text-[#52697C] hover:bg-[#F1F6FA] hover:text-[#155B91]";

export default function Navbar() {
  const { pathname } = useLocation();

  const autenticado = Boolean(
    localStorage.getItem("token")
  );

  const enInicio = pathname.startsWith("/proyectos");
  const enComunidad = pathname.startsWith("/comunidad");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#D8E4ED] bg-white shadow-[0_5px_22px_rgba(13,53,89,0.08)]">

      {/* ======================================
          FRANJA INSTITUCIONAL SUPERIOR
      ====================================== */}

      <div className="bg-[#0D3559] text-white">

        <div className="mx-auto flex min-h-[34px] max-w-[1500px] items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-10">

          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6BD5E8]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#E2EEF7] sm:text-[11px]">
              Generador de mapas de ruido
            </span>
          </div>

         
        </div>
      </div>

      {/* ======================================
          NAVEGACIÓN PRINCIPAL
      ====================================== */}

      <nav
        className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10"
        aria-label="Navegación principal"
      >

        <div className="flex min-h-[80px] flex-wrap items-center justify-between gap-x-5 gap-y-2 py-3 lg:flex-nowrap lg:gap-8 lg:py-0">

          {/* ======================================
              IDENTIDAD DE LA PLATAFORMA
          ====================================== */}

          <Link
            to={autenticado ? "/proyectos" : "/comunidad"}
            className="group order-1 flex shrink-0 items-center gap-3 outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-[#287EAB]"
            title="NoiseMap"
          >

            {/* ÍCONO */}
           <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#155B91] to-[#0D3559] p-2 shadow-[0_5px_12px_rgba(21,91,145,0.20)] transition-transform duration-200 group-hover:-translate-y-0.5">
              <img
                src="/icono.png"
                alt="Icono Mapas de Ruido"
                className="h-6 w-6 object-contain"
              />
            </span>

            {/* NOMBRE */}
            <span className="flex flex-col leading-tight">
              <span className="text-[20px] font-extrabold tracking-[-0.045em] text-[#153C5B] transition-colors group-hover:text-[#155B91]">
                NoiseMap
              </span>

              <span className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-[0.10em] text-[#8193A3] sm:block">
                Cartografía acústica
              </span>
            </span>
          </Link>

          {/* ======================================
              ENLACES DEL NAVBAR
          ====================================== */}

          <div className="order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-[#E7EDF3] pt-2 lg:order-2 lg:w-auto lg:flex-1 lg:justify-center lg:overflow-visible lg:border-0 lg:pt-0">

            {/* MIS PROYECTOS */}
            {autenticado && (
              <Link
                to="/proyectos"
                aria-current={
                  enInicio ? "page" : undefined
                }
                className={`${claseEnlace} ${
                  enInicio ? claseActivo : claseInactivo
                }`}
              >

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
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="16"
                    rx="2"
                  />
                  <path d="M3 10h18" />
                  <path d="M8 5V3" />
                  <path d="M16 5V3" />
                </svg>

                <span>Mis proyectos</span>

                {/* Indicador de página activa */}
                {enInicio && (
                  <span className="absolute bottom-0 left-4 right-4 h-[3px] rounded-t-full bg-[#155B91]" />
                )}
              </Link>
            )}

            {/* COMUNIDAD */}
            <Link
              to="/comunidad"
              aria-current={
                enComunidad ? "page" : undefined
              }
              className={`${claseEnlace} ${
                enComunidad
                  ? claseActivo
                  : claseInactivo
              }`}
            >

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
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3a14 14 0 0 1 0 18" />
                <path d="M12 3a14 14 0 0 0 0 18" />
              </svg>

              <span>Explorar comunidad</span>

              {enComunidad && (
                <span className="absolute bottom-0 left-4 right-4 h-[3px] rounded-t-full bg-[#155B91]" />
              )}
            </Link>
          </div>

          {/* ======================================
              ACCIONES DE USUARIO
          ====================================== */}

          <div className="order-2 flex shrink-0 items-center gap-2 sm:gap-3 lg:order-3">

            {/* MANUAL DE USUARIO */}
            <a
              href="/Manual_de_usuario.pdf"
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir el manual de usuario"
              className="group inline-flex min-h-[43px] items-center justify-center gap-2 rounded-xl border border-[#D5E2EC] bg-white px-3 py-2.5 text-[12px] font-bold text-[#3C617D] shadow-[0_2px_6px_rgba(13,53,89,0.03)] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[#A6C7DD] hover:bg-[#F2F8FC] hover:text-[#155B91] hover:shadow-[0_5px_14px_rgba(13,53,89,0.08)] focus-visible:ring-2 focus-visible:ring-[#287EAB] sm:px-4"
            >

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
                <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
                <path d="M9 7h6" />
                <path d="M9 11h6" />
              </svg>

              <span className="hidden sm:inline">
                Manual de usuario
              </span>
              <span className="sm:hidden">
                Manual
              </span>
            </a>

            {/* PERFIL O INICIO DE SESIÓN */}
            {autenticado ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                className="inline-flex min-h-[43px] items-center justify-center gap-2 rounded-xl bg-[#155B91] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_5px_14px_rgba(21,91,145,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#104875] hover:shadow-[0_8px_20px_rgba(21,91,145,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#287EAB] focus-visible:ring-offset-2"
              >
                Iniciar sesión
              </Link>
            )}
          </div>

        </div>
      </nav>

      {/* LÍNEA INSTITUCIONAL INFERIOR */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#0D3559] via-[#287EAB] to-[#8CCCE5]" />

    </header>
  );
}
