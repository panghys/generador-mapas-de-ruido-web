import { Link, useLocation } from "react-router-dom";
import UserMenu from "./layout/UserMenu";

const claseBoton = "inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white outline-none transition-colors hover:border-[#70adf7] hover:text-[#70adf7] focus-visible:ring-2 focus-visible:ring-[#70adf7]";

export default function Navbar() {
  const { pathname } = useLocation();
  const autenticado = Boolean(localStorage.getItem("token"));
  const enInicio = pathname.startsWith("/proyectos");
  const enComunidad = pathname.startsWith("/comunidad");
  return <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#052B59] shadow-md">
    <nav className="mx-auto flex min-h-24 w-full flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 xl:max-w-[1600px]">
      <div className="flex flex-wrap items-center gap-2">
        {autenticado && <Link to="/proyectos" aria-current={enInicio ? "page" : undefined} className={`${claseBoton} ${enInicio ? "border-[#70adf7] text-[#70adf7]" : ""}`}>
          <span aria-hidden="true">⌂</span><span>Inicio</span>
        </Link>}
        <Link to="/comunidad" aria-current={enComunidad ? "page" : undefined} className={`${claseBoton} ${enComunidad ? "border-[#70adf7] text-[#70adf7]" : ""}`}>
          <span aria-hidden="true">◎</span><span>Explorar comunidad</span>
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <a href="/Manual_de_usuario.pdf" target="_blank" rel="noopener noreferrer" title="Abrir el manual de usuario" className={claseBoton}>
          <span aria-hidden="true">▤</span><span>Manual de usuario</span>
        </a>
        {autenticado ? <UserMenu /> : <Link to="/login" className={claseBoton}>Iniciar sesión</Link>}
      </div>
    </nav>
  </header>;
}
