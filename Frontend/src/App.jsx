
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  Navbar,
  User,
  Paper,
  Proyecto,
  ProyectoNuevo,
  MapaProyecto,
  Login,
} from "./components";

import ProyectosPublicos from "./components/proyecto/ProyectosPublicos";
import MapaPublico from "./components/proyecto/MapaPublico";
import FondoGradientWaves from "./components/ui/FondoGradientWaves";

// Se mantienen las verificaciones y rutas originales.
const RutaProtegida = ({ children }) =>
  localStorage.getItem("token")
    ? children
    : <Navigate to="/login" replace />;

const Entrada = () =>
  localStorage.getItem("token")
    ? <Navigate to="/proyectos" replace />
    : <Login />;

function AppRoutes() {
  const { pathname } = useLocation();

  const mostrarNavbar =
    pathname !== "/" && pathname !== "/login";

  // Fondo SOLO en las pantallas solicitadas.
  const mostrarGradientWaves =
    pathname === "/proyectos" ||
    pathname === "/proyectos/nuevo" ||
    /^\/proyectos\/[^/]+\/mapa\/?$/.test(pathname) ||
    pathname === "/comunidad";

  const contenido = (
    <Routes>
      <Route path="/" element={<Entrada />} />

      <Route
        path="/usuarios"
        element={<RutaProtegida><User /></RutaProtegida>}
      />

      <Route
        path="/papers"
        element={<RutaProtegida><Paper /></RutaProtegida>}
      />

      <Route
        path="/proyectos"
        element={<RutaProtegida><Proyecto /></RutaProtegida>}
      />

      <Route
        path="/proyectos/nuevo"
        element={<RutaProtegida><ProyectoNuevo /></RutaProtegida>}
      />

      <Route
        path="/proyectos/:id/mapa"
        element={<RutaProtegida><MapaProyecto /></RutaProtegida>}
      />

      <Route
        path="/comunidad"
        element={<ProyectosPublicos />}
      />

      <Route
        path="/comunidad/:id"
        element={<MapaPublico />}
      />

      <Route
        path="/login"
        element={<Login />}
      />
    </Routes>
  );

  return (
    <>
      {mostrarNavbar && <Navbar />}

      {mostrarGradientWaves ? (
        <FondoGradientWaves>
          {contenido}
        </FondoGradientWaves>
      ) : (
        contenido
      )}
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F4F7FA]">
      <Router>
        <AppRoutes />
      </Router>
    </div>
  );
}
