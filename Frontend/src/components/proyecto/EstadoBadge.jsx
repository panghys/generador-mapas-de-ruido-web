// Frontend/src/components/proyecto/EstadoBadge.jsx
const config = {
  borrador: {
    label: "Borrador",
    text: "text-[#52697C]",
    bg: "bg-[#EDF2F6] border border-[#D9E2E9]",
    icon: (
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  procesando: {
    label: "Procesando",
    text: "text-amber-700",
    bg: "bg-amber-50 border border-amber-200",
    icon: (
      <svg viewBox="0 0 16 16" className="w-3 h-3 animate-spin" fill="none">
        <path d="M8 2a6 6 0 1 1-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  listo: {
    label: "Listo",
    text: "text-[#17654B]",
    bg: "bg-[#E9F8F1] border border-[#C7E9D7]",
    icon: (
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    label: "Error",
    text: "text-red-700",
    bg: "bg-red-50 border border-red-200",
    icon: (
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M8 5.5v3.5M8 11.2v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
};

const EstadoBadge = ({ estado }) => {
  const c = config[estado] || config.borrador;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.icon}
      {c.label}
    </span>
  );
};

export default EstadoBadge;