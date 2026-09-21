import React from "react";
import { Navbar, Home, User, Paper, Proyecto, ProyectoNuevo, MapaProyecto, Login } from "./components"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem("token");

  return token ? children : <Navigate to="/login" replace />;
};

const Entrada = () => (
  localStorage.getItem("token") ? <Navigate to="/proyectos" replace /> : <Login />
);

const AppRoutes = () => {
  const location = useLocation();

  return (
    <>
      {location.pathname !== "/login" && location.pathname !== "/" && <div className="sm:px-16 px-6 flex justify-center items-center"><div className="xl:max-w-[1280px] w-full"><Navbar /></div></div>}
      <Routes>
          <Route path="/" element={<Entrada />} />
          <Route path="/usuarios" element={<User />} />
          <Route path="/papers" element={<Paper />} />
          <Route path="/proyectos" element={<RutaProtegida><Proyecto /></RutaProtegida>} />
          <Route path="/proyectos/nuevo" element={<RutaProtegida><ProyectoNuevo /></RutaProtegida>} />
          <Route path="/proyectos/:id/mapa" element={<RutaProtegida><MapaProyecto /></RutaProtegida>} />
          <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <div className="bg-primary overflow-hidden">
      <Router>
        <AppRoutes />
      </Router>
    </div>
  );
};

export default App