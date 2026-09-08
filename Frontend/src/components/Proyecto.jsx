// Frontend/src/components/Proyecto.jsx
import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ListaProyectos from "./proyecto/ListaProyectos";
import ProyectoModal from "./proyecto/ProyectoModal";

const proyectosIniciales = [
  {
    id: 1,
    nombre: "Diagnóstico Isla Teja",
    descripcion: "Levantamiento de ruido en el sector universitario",
    estado: "listo",
    fecha_modificacion: "2026-08-20",
    region: "Los Ríos",
    comuna: "Valdivia",
    preview: "north",
  },
  {
    id: 2,
    nombre: "Corredor Ramón Picarte",
    descripcion: "Comparación de escenarios de velocidad máxima",
    estado: "borrador",
    fecha_modificacion: "2026-08-27",
    region: "Los Ríos",
    comuna: "Valdivia",
    preview: "river",
  },
];

const filtros = [
  { valor: "todos", label: "Todos" },
  { valor: "borrador", label: "Borrador" },
  { valor: "listo", label: "Listos" },
];

const Proyecto = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [proyectos, setProyectos] = useState(() => {
    const guardados = localStorage.getItem("proyectos");
    if (!guardados) return proyectosIniciales;

    const proyectosGuardados = JSON.parse(guardados);
    return [...new Map(proyectosGuardados.map((proyecto) => [proyecto.id, proyecto])).values()];
  });
  const [filtroActivo, setFiltroActivo] = useState("todos");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proyectoEditando, setProyectoEditando] = useState(null);

  const proyectosFiltrados = useMemo(
    () => (filtroActivo === "todos" ? proyectos : proyectos.filter((p) => p.estado === filtroActivo)),
    [proyectos, filtroActivo]
  );

  const listos = proyectos.filter((p) => p.estado === "listo").length;

  useEffect(() => {
    localStorage.setItem("proyectos", JSON.stringify(proyectos));
  }, [proyectos]);

  useEffect(() => {
    const proyectoCreado = location.state?.proyectoCreado;

    if (!proyectoCreado) return;

    setProyectos((prev) => {
      if (prev.some((proyecto) => proyecto.id === proyectoCreado.id)) return prev;
      return [...prev, proyectoCreado];
    });
    navigate("/proyectos", { replace: true, state: null });
  }, [location.state, navigate]);

  const handleNuevo = () => navigate("/proyectos/nuevo");

  const handleAbrir = (proyecto) => {
    navigate(`/proyectos/${proyecto.id}/mapa`, { state: { proyecto } });
  };

  const handleGuardar = (proyecto) => {
    if (proyecto.id) {
      setProyectos((prev) =>
        prev.map((p) => (p.id === proyecto.id ? { ...proyecto, fecha_modificacion: new Date().toISOString() } : p))
      );
    } else {
      setProyectos((prev) => [
        ...prev,
        { ...proyecto, id: Date.now(), fecha_modificacion: new Date().toISOString() },
      ]);
    }
    setModalAbierto(false);
  };

  return (
    <div className="min-h-screen bg-dash-bg font-sans px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-semibold text-dash-text">Mis proyectos</h1>
          <button
            onClick={handleNuevo}
            className="px-4 py-2 text-sm bg-dash-accent text-dash-bg font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            + Nuevo proyecto
          </button>
        </div>
        <p className="text-dash-text-soft text-sm mb-6">
          {proyectos.length} proyectos · {listos} listo{listos !== 1 ? "s" : ""}
        </p>

        <div className="flex gap-1 mb-6">
          {filtros.map((f) => (
            <button
              key={f.valor}
              onClick={() => setFiltroActivo(f.valor)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filtroActivo === f.valor
                  ? "bg-dash-accent-soft text-dash-accent"
                  : "text-dash-text-soft hover:text-dash-text"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <ListaProyectos proyectos={proyectosFiltrados} onOpen={handleAbrir} />
      </div>

      {modalAbierto && (
        <ProyectoModal
          proyecto={proyectoEditando}
          onClose={() => setModalAbierto(false)}
          onSave={handleGuardar}
        />
      )}
    </div>
  );
};

export default Proyecto;