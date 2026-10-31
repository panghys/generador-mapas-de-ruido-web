import { createPortal } from "react-dom";
import { MODELO_CNOSSOS } from "./modeloRuido";

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

const pasosCNOSSOS = [
  {
    titulo: "Qué es CNOSSOS-EU",
    texto:
      "Es el método europeo de cálculo de ruido de tráfico. En lugar de un único valor en dB(A), calcula el ruido en 8 bandas de frecuencia (63 a 8000 Hz) separando la rodadura de los neumáticos y el motor, y luego lo pondera en dB(A).",
  },
  {
    titulo: "En qué se diferencia de RLS-90",
    texto:
      "Usa cuatro categorías de vehículo (livianos, medianos, pesados y motocicletas) en vez de tres, y el efecto de la velocidad se calcula por categoría y por banda. Además, la propagación depende de la frecuencia: los sonidos agudos se atenúan más con la distancia que los graves.",
  },
  {
    titulo: "1. Delimitar la zona y trazar calles",
    texto:
      "Funciona igual que en el modelo simple: \"Delimitar zona\" para el perímetro y \"Crear calle\" para trazar los tramos. Termina el trazo con doble clic o Enter y completa los datos de la calle.",
  },
  {
    titulo: "2. Ingresar el tráfico",
    texto:
      "En cada calle indica el conteo de livianos, medianos, pesados y motocicletas. El conteo puede ser de 15 minutos o de una hora, según el período elegido. La velocidad promedio se aplica a todas las categorías. El tipo de superficie no se usa en este modelo: se considera la superficie de referencia.",
  },
  {
    titulo: "3. Leer el resultado",
    texto:
      "El modal muestra el nivel estimado en dB(A) a 25 m de la calle, y ese valor define el color del trazo. La superficie de ruido suma la energía de todas las calles, banda por banda. Este modelo no incluye edificios, terreno ni atenuación urbana, por lo que el ruido alcanza distancias mayores que en RLS-90 y los valores no son directamente comparables entre ambos modelos.",
  },
  {
    titulo: "4. Editar, marcadores y búsqueda",
    texto:
      "Haz clic en una calle para editarla o eliminarla. \"Añadir marcador\" coloca un punto de referencia, y el buscador acepta ciudades, direcciones o coordenadas (ej: -39.8142, -73.2459).",
  },
  {
    titulo: "El modelo no se puede cambiar",
    texto:
      "El modelo de cálculo se elige al crear el proyecto. Para comparar ambos métodos, crea otro proyecto con el otro modelo.",
  },
];

const InstruccionesMapaModal = ({ abierto, modeloCalculo, onCerrar }) => {
  if (!abierto) return null;

  const esCNOSSOS = modeloCalculo === MODELO_CNOSSOS;
  const lista = esCNOSSOS ? pasosCNOSSOS : pasos;

  const contenido = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-[#052B59]/95 p-5 text-dash-text shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {esCNOSSOS ? "CÓMO USAR EL MAPA · CNOSSOS-EU" : "CÓMO USAR EL MAPA"}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="text-dash-text-soft hover:text-dash-text"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 text-sm">
          {lista.map(({ titulo, texto }) => (
            <section key={titulo}>
              <h3 className="mb-1 font-semibold text-[#70adf7]">{titulo}</h3>
              <p className="text-slate-300">{texto}</p>
            </section>
          ))}
        </div>

        <button
          type="button"
          onClick={onCerrar}
          className="mt-5 w-full bg-[#70adf7] px-3 py-2 text-sm font-semibold rounded-lg text-[#052B59] hover:opacity-90"
        >
          Entendido
        </button>
      </div>
    </div>
  );

  return createPortal(contenido, document.body);
};

export default InstruccionesMapaModal;