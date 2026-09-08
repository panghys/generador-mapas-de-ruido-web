import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import EstadoBadge from "./EstadoBadge";

const MapaProyecto = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const proyectos = JSON.parse(localStorage.getItem("proyectos") || "[]");
  const proyecto = location.state?.proyecto || proyectos.find((item) => String(item.id) === id);
  const [delimitando, setDelimitando] = useState(false);

  if (!proyecto) {
    return <main className="min-h-screen bg-dash-bg px-6 py-12 text-dash-text"><p>Proyecto no encontrado.</p><button onClick={() => navigate("/proyectos")} className="mt-4 text-sm text-dash-accent">Volver a proyectos</button></main>;
  }

  return (
    <main className="min-h-screen bg-dash-bg px-6 py-8 font-sans text-dash-text">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => navigate("/proyectos")} className="mb-6 text-sm text-dash-text-soft hover:text-dash-text">← Volver a proyectos</button>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><div className="mb-2 flex items-center gap-3"><EstadoBadge estado={proyecto.estado} /><span className="text-xs text-dash-text-soft">MVP sin conexión a Google Maps</span></div><h1 className="text-3xl font-semibold">{proyecto.nombre}</h1><p className="mt-2 text-sm text-dash-text-soft">{proyecto.comuna}, {proyecto.region}</p></div>
          <button onClick={() => setDelimitando((actual) => !actual)} className="bg-dash-accent px-4 py-2.5 text-sm font-semibold text-dash-bg hover:opacity-90">{delimitando ? "Terminar delimitación" : "Delimitar zona"}</button>
        </div>
        <section className="relative min-h-[520px] overflow-hidden border border-dash-border bg-[#162326]" style={{ backgroundImage: "linear-gradient(rgba(45,212,191,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,.08) 1px, transparent 1px)", backgroundSize: "52px 52px" }}>
          <div className="absolute left-[13%] top-[18%] h-24 w-[32%] rotate-12 border-2 border-dash-accent/60 bg-dash-accent/10" />
          <div className="absolute right-[15%] top-[35%] h-40 w-[28%] -rotate-6 border-2 border-amber-300/50 bg-amber-300/10" />
          <div className="absolute bottom-[15%] left-[38%] h-20 w-[35%] rotate-3 border-2 border-sky-300/40 bg-sky-300/10" />
          {delimitando && <div className="absolute left-[27%] top-[28%] h-48 w-[43%] rotate-2 border-2 border-dash-accent border-dashed bg-dash-accent/20" />}
          <div className="absolute bottom-5 left-5 border border-white/10 bg-[#10191c]/90 px-4 py-3 text-xs text-white/80"><p className="font-medium text-white">{proyecto.comuna}</p><p className="mt-1">Mapa de trabajo simulado</p></div>
          <div className="absolute right-5 top-5 flex flex-col border border-white/10 bg-[#10191c]/90 text-white/70"><button className="px-3 py-2 text-lg hover:text-white">+</button><button className="border-t border-white/10 px-3 py-2 text-lg hover:text-white">−</button></div>
        </section>
        <p className="mt-4 text-sm text-dash-text-soft">{delimitando ? "La zona resaltada representa el polígono que luego podrás ajustar sobre Google Maps." : "Selecciona Delimitar zona para previsualizar el área de medición."}</p>
      </div>
    </main>
  );
};

export default MapaProyecto;