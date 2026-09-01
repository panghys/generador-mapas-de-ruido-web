// Frontend/src/components/proyecto/EstadoBadge.jsx
const estilos = {
  borrador: "bg-warn-soft text-warn",
  listo: "bg-accent-soft text-accent",
};

const etiquetas = {
  borrador: "Borrador",
  listo: "Listo",
};

const EstadoBadge = ({ estado }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${estilos[estado] || estilos.borrador}`}
  >
    {etiquetas[estado] || "Borrador"}
  </span>
);

export default EstadoBadge;