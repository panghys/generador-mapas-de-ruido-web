import { Link, useLocation } from "react-router-dom";
import UserMenu from "./layout/UserMenu";

const claseBoton =
  "inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white outline-none transition-colors hover:border-[#70adf7] hover:text-[#70adf7] focus-visible:ring-2 focus-visible:ring-[#70adf7]";

function Navbar() {
  const { pathname } = useLocation();
  const enInicio = pathname === "/proyectos";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#052B59] shadow-md">
      <nav className="mx-auto flex h-24 w-full items-center justify-between gap-5 px-4 sm:px-0 xl:max-w-[1600px]">
        <div className="flex items-center">
          <Link
            to="/proyectos"
            aria-current={enInicio ? "page" : undefined}
            className={`${claseBoton} ${enInicio ? "border-[#70adf7] text-[#70adf7]" : ""}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"
              />
            </svg>
            <span>Inicio</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/Manual_de_usuario.pdf"
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir el manual de usuario"
            className={claseBoton}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span>Manual de usuario</span>
          </a>
          <UserMenu />
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
