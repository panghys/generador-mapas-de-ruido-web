import { useNavigate } from "react-router-dom";
import { icon } from "../assets";

function Navbar() {
  const navigate = useNavigate();

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <nav className="w-full flex py-6 justify-between items-center navbar">
      <a href="/">
        <img src={icon} alt="hoobank" className="w-[50px] h-[50px]"/>
      </a>
      <button
        type="button"
        onClick={cerrarSesion}
        className="border border-dash-border px-3 py-2 text-sm text-dash-text-soft transition-colors hover:border-dash-accent hover:text-dash-accent"
      >
        Cerrar sesión
      </button>
    </nav>
  );
};

export default Navbar;