import { useState, useEffect, useRef, useCallback } from "react";
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
  const cargaProyectosRef = useRef(null);

  const cargarProyectos = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!cargaProyectosRef.current) {
      cargaProyectosRef.current = cargarProyectos().finally(() => {
        cargaProyectosRef.current = null;
      });
    }
  }, [cargarProyectos]);

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

  // El backend ya acepta { estado } en PUT /proyectos/:id (actualización parcial).
  const handleCambiarEstado = async (proyectoId, nuevoEstado) => {
    setError("");
    try {
      const { data } = await clientAxios.put(`/proyectos/${proyectoId}`, { estado: nuevoEstado });
      setProyectos((prev) =>
        prev.map((p) => (p.id === proyectoId ? { ...p, ...data.data } : p))
      );
    } catch (err) {
      setError("No se pudo cambiar el estado del proyecto.");
    }
  };

  const handleCambiarPublico = async (proyectoId, esPublico) => {
    setError("");
    try {
      const { data } = await clientAxios.put(`/proyectos/${proyectoId}`, { es_publico: esPublico });
      setProyectos((prev) => prev.map((p) => p.id === proyectoId ? { ...p, ...data.data } : p));
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo cambiar la privacidad del proyecto.");
    }
  };

  const handleAbrir = (proyecto) => {
    navigate(`/proyectos/${proyecto.id}/mapa`, { state: { proyecto } });
  };

  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-10 font-sans text-[#243447] sm:px-7 lg:py-12">
      {/* Fondo animado WebGL — sutil, decorativo, sin capturar interacción del mouse */}
      {/* <div className="pointer-events-none fixed inset-0 z-0">
        <GradientWaves
          horizonColor="#00dfc3"
          waveColor="#000000"
          crestColor="#e8e8e8"
          speed={0.55}
          amplitude={2.5}
          waveScale={0.65}
          swell={30}
          turbulence={20}
          tilt={1.15}
          zoom={1.1}
          height={5}
          fogDepth={16}
          detail="medium"
          brightness={0.7}
          opacity={0.45}
          mouseInteraction={false}
          parallaxStrength={0.35}
          grain
          grainIntensity={0.04}
        />
      </div>*/}
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-6 border-b border-[#DCE5EC] pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.17em] text-[#287EAB]">Gestión de estudios acústicos</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#153C5B] sm:text-4xl">Mis proyectos</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#617487]">
              Administra tus estudios, continúa tus mapas y comparte los proyectos con la comunidad.
            </p>
          </div>
          <button
            type="button"
            onClick={handleNuevo}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 self-start rounded-xl bg-[#155B91] px-5 py-3 text-sm font-bold text-white shadow-[0_7px_18px_rgba(21,91,145,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#104A75] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155B91] focus-visible:ring-offset-2"
          >
            <span className="text-xl leading-none" aria-hidden="true">+</span>
            Nuevo proyecto
          </button>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#DCE5EC] bg-white px-5 py-5 shadow-[0_4px_18px_rgba(19,54,83,0.04)]">
            <p className="text-xs font-bold uppercase tracking-wide text-[#718397]">Total de proyectos</p>
            <p className="mt-3 text-3xl font-extrabold text-[#153C5B]">{proyectos.length}</p>
          </div>
          <div className="rounded-2xl border border-[#DCE5EC] bg-white px-5 py-5 shadow-[0_4px_18px_rgba(19,54,83,0.04)]">
            <p className="text-xs font-bold uppercase tracking-wide text-[#718397]">Finalizados</p>
            <p className="mt-3 text-3xl font-extrabold text-[#17654B]">{listos}</p>
          </div>
          <div className="rounded-2xl border border-[#DCE5EC] bg-white px-5 py-5 shadow-[0_4px_18px_rgba(19,54,83,0.04)]">
            <p className="text-xs font-bold uppercase tracking-wide text-[#718397]">Borradores</p>
            <p className="mt-3 text-3xl font-extrabold text-[#155B91]">{proyectos.filter((p) => p.estado === "borrador").length}</p>
          </div>
        </div>

        <section className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#153C5B]">Mis Proyectos</h2>
            <p className="mt-1 text-sm text-[#718397]">Selecciona un proyecto para abrir su mapa.</p>
          </div>
          <div className="inline-flex flex-wrap gap-1.5 rounded-xl border border-[#DCE5EC] bg-white p-1.5 shadow-sm" aria-label="Filtrar proyectos">
            {filtros.map((f) => (
              <button
                key={f.valor}
                type="button"
                onClick={() => setFiltroActivo(f.valor)}
                aria-pressed={filtroActivo === f.valor}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155B91] ${
                  filtroActivo === f.valor
                    ? "bg-[#155B91] text-white shadow-sm"
                    : "text-[#617487] hover:bg-[#F0F6FA] hover:text-[#155B91]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

        {cargando ? (
          <div className="rounded-2xl border border-[#DCE5EC] bg-white p-10 text-center text-sm text-[#617487]" role="status">
            Cargando proyectos...
          </div>
        ) : (
          <ListaProyectos
            proyectos={proyectosFiltrados}
            onOpen={handleAbrir}
            onDelete={handleEliminar}
            onToggleEstado={handleCambiarEstado}
            onTogglePublico={handleCambiarPublico}
          />
        )}
      </div>
    </main>
  );
};

export default Proyecto;