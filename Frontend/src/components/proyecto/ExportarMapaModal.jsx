import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Vista previa de la imagen exportada, con las opciones de descargar o volver.
 * `vista` = { url, ancho, alto } (null/undefined = cerrado).
 */
const ExportarMapaModal = ({ vista, descargando, error, onDescargar, onCerrar }) => {
  useEffect(() => {
    if (!vista) return undefined;
    const alPresionarTecla = (evento) => {
      if (evento.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPresionarTecla);
    return () => window.removeEventListener("keydown", alPresionarTecla);
  }, [vista, onCerrar]);

  if (!vista) return null;

  const contenido = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Vista previa de la exportación"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col border border-dash-border bg-[#162326] p-5 text-dash-text shadow-2xl"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Vista previa de la exportación</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-dash-text-soft hover:text-dash-text"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto border border-dash-border bg-white">
          <img
            src={vista.url}
            alt="Mapa de ruido exportado"
            width={vista.ancho}
            height={vista.alto}
            className="mx-auto block h-auto max-h-[68vh] w-auto max-w-full object-contain"
          />
        </div>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onDescargar}
            disabled={descargando}
            className="flex-1 bg-dash-accent px-3 py-2 text-sm font-semibold text-dash-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {descargando ? "Descargando…" : "Descargar PNG"}
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 border border-dash-border px-3 py-2 text-sm font-semibold text-dash-text hover:bg-[#1d2c2f]"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(contenido, document.body);
};

export default ExportarMapaModal;
