import { createPortal } from "react-dom";

const pasos = [
  {
    titulo: "1. Delimitar la zona",
    texto:
      "Haz clic en \"Delimitar zona\" y dibuja el perímetro del proyecto haciendo clic en el mapa. Cierra el polígono haciendo clic sobre el primer punto.",
  },
  {
    titulo: "2. Crear una calle",
    texto:
      "Haz clic en \"Crear calle\" y traza uno o varios tramos conectados dentro de la zona. Cada clic agrega un tramo nuevo; termina con doble clic o presionando Enter. Luego completa sus datos y guarda.",
  },
  {
    titulo: "3. Editar o eliminar una calle",
    texto:
      "Haz clic sobre cualquier calle ya trazada para abrir sus datos, modificarlos o eliminarla.",
  },
  {
    titulo: "4. Generar el mapa de ruido",
    texto:
      "Ingresa en cada calle el tráfico contado durante 15 minutos. El mapa colorea las calles y muestra la superficie estimada; puedes ocultar esta capa desde la leyenda.",
  },
  {
    titulo: "5. Añadir marcadores",
    texto: "Haz clic en \"Añadir marcador\" y luego en el mapa para colocar un punto de referencia.",
  },
  {
    titulo: "6. Buscar una ubicación",
    texto:
      "Escribe una ciudad, dirección o coordenadas (ej: -39.8142, -73.2459) en el buscador y presiona Enter o \"Buscar\".",
  },
];

const InstruccionesMapaModal = ({ abierto, onCerrar }) => {
  if (!abierto) return null;

  const contenido = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto border border-dash-border bg-[#162326] p-5 text-dash-text shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Cómo usar el mapa</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="text-dash-text-soft hover:text-dash-text"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 text-sm">
          {pasos.map(({ titulo, texto }) => (
            <section key={titulo}>
              <h3 className="mb-1 font-semibold text-dash-accent">{titulo}</h3>
              <p className="text-dash-text-soft">{texto}</p>
            </section>
          ))}
        </div>

        <button
          type="button"
          onClick={onCerrar}
          className="mt-5 w-full bg-dash-accent px-3 py-2 text-sm font-semibold text-dash-bg hover:opacity-90"
        >
          Entendido
        </button>
      </div>
    </div>
  );

  return createPortal(contenido, document.body);
};

export default InstruccionesMapaModal;