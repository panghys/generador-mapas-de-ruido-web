import React from "react";
import { Navbar, Home, User, Paper, Proyecto, Login } from "./components"
import { BrowserRouter as Router, Routes , Route } from "react-router-dom";

const App = () => {
  return (
    <div className="bg-primary overflow-hidden">
      <Router>
        <div className="sm:px-16 px-6 flex justify-center items-center">
          <div className="xl:max-w-[1280px] w-full">
            <Navbar />
          </div>
        </div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/usuarios" element={<User />} />
          <Route path="/papers" element={<Paper />} />
          <Route path="/proyectos" element={<Proyecto />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App