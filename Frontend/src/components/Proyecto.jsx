import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ListaProyectos from "./proyecto/ListaProyectos";
import clientAxios from "./config/clienteAxios";

const filtros = [
  { valor: "todos", label: "Todos" },
  { valor: "borrador", label: "Borrador" },
  { valor: "listo", label: "Listos" },
];

const Proyecto = () => {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("todos");

  const cargarProyectos = async () => {
    setCargando(true);
    setError("");
    try {
      const { data } = await clientAxios.get("/proyectos");
      setProyectos(data.data);
    } catch (err) {
      setError("No se pudieron cargar tus proyectos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProyectos();
  }, []);

  const proyectosFiltrados =
    filtroActivo === "todos" ? proyectos : proyectos.filter((p) => p.estado === filtroActivo);

  const listos = proyectos.filter((p) => p.estado === "listo").length;

  const handleNuevo = () => navigate("/proyectos/nuevo");

  const handleEliminar = async (proyectoId) => {
    try {
      await clientAxios.delete(`/proyectos/${proyectoId}`);
      setProyectos((prev) => prev.filter((p) => p.id !== proyectoId));
    } catch (err) {
      setError("No se pudo eliminar el proyecto.");
    }
  };

  const handleAbrir = (proyecto) => {
    navigate(`/proyectos/${proyecto.id}/mapa`, { state: { proyecto } });
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

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {cargando ? (
          <p className="text-dash-text-soft text-sm">Cargando proyectos...</p>
        ) : (
          <ListaProyectos proyectos={proyectosFiltrados} onOpen={handleAbrir} onDelete={handleEliminar} />
        )}
      </div>
    </div>
  );
};

export default Proyecto;