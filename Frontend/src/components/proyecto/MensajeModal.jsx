import { createPortal } from "react-dom";

const MensajeModal = ({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Continuar",
  onConfirmar,
  onCerrar,
}) => {
  if (!abierto) return null;

  const contenido = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-[#052B59]/95 p-5 text-dash-text shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="text-dash-text-soft hover:text-dash-text"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-slate-300">{mensaje}</p>

        {onConfirmar ? (
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 rounded-lg border border-[#70adf7] px-3 py-2 text-sm font-semibold text-[#70adf7] hover:bg-[#70adf7]/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onCerrar();
                onConfirmar();
              }}
              className="flex-1 rounded-lg bg-[#70adf7] px-3 py-2 text-sm font-semibold text-[#052B59] hover:opacity-90"
            >
              {textoConfirmar}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onCerrar}
            className="mt-5 w-full rounded-lg bg-[#70adf7] px-3 py-2 text-sm font-semibold text-[#052B59] hover:opacity-90"
          >
            Entendido
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(contenido, document.body);
};

export default MensajeModal;
