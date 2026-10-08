import { createPortal } from "react-dom";

const DescripcionProyectoModal = ({ proyecto, onClose }) => {
  const contenido = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 animate-[fadeIn_0.15s_ease-out]"
      onClick={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="descripcion-proyecto-titulo"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="descripcion-proyecto-titulo" className="font-sans text-lg font-semibold text-[#052B59]">
              Descripción del proyecto
            </h2>
            <p className="mt-1 break-words text-sm font-medium text-[#1C5DAC]">
              {proyecto.nombre}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar descripción"
            className="shrink-0 rounded-lg px-2 py-1 text-xl leading-none text-[#4B5563] hover:bg-slate-100"
          >
            &times;
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          {proyecto.descripcion}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#1C5DAC] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1C5DAC]/90"
          >
            Cerrar
          </button>
        </div>
      </section>
    </div>
  );

  return createPortal(contenido, document.body);
};

export default DescripcionProyectoModal;
