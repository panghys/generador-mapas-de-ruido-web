import { useState } from "react";

const limitar = (valor, minimo, maximo) =>
  Math.min(maximo, Math.max(minimo, valor));

/**
 * Selector de estrellas inspirado en PeekRating.
 * No requiere librerías externas y funciona en modo interactivo o de solo lectura.
 */
export default function PeekRating({
  value,
  defaultValue = 0,
  onChange,
  onPreview,
  count = 5,
  labels = [],
  activeColor = "#E5A52B",
  idleColor = "#CBD5E1",
  size = 25,
  showTip = true,
  allowClear = false,
  readOnly = false,
  disabled = false,
  ariaLabel = "Valoración",
  className = "",
}) {
  const [valorInterno, setValorInterno] = useState(defaultValue);
  const [hovered, setHovered] = useState(null);
  const controlado = value !== undefined;
  const actual = limitar(
    Number(controlado ? value : valorInterno) || 0,
    0,
    count
  );
  const mostrado = hovered === null ? actual : hovered + 1;
  const interactivo = !readOnly && !disabled;

  function seleccionar(siguiente) {
    if (!interactivo) return;
    const nuevoValor = allowClear && siguiente === actual ? 0 : siguiente;

    if (!controlado) setValorInterno(nuevoValor);
    onChange?.(nuevoValor);
    setHovered(null);
    onPreview?.(null);
  }

  function previsualizar(indice) {
    if (!interactivo) return;
    setHovered(indice);
    onPreview?.(indice === null ? null : indice + 1);
  }

  return (
    <div
      className={`inline-flex min-w-0 items-center gap-1 ${className}`}
      role={interactivo ? "radiogroup" : "img"}
      aria-label={
        interactivo
          ? ariaLabel
          : `${ariaLabel}: ${actual} de ${count} estrellas`
      }
      onMouseLeave={() => previsualizar(null)}
    >
      {Array.from({ length: count }, (_, indice) => {
        const activo = indice < Math.round(mostrado);
        const fraccion = limitar(mostrado - indice, 0, 1);
        const etiqueta = labels[indice] || `${indice + 1} de ${count} estrellas`;
        const estilo = {
          width: size,
          height: size,
          color: activo ? activeColor : idleColor,
        };

        if (interactivo) {
          return (
            <button
              key={indice}
              type="button"
              role="radio"
              aria-checked={actual === indice + 1}
              aria-label={etiqueta}
              title={etiqueta}
              disabled={disabled}
              onMouseEnter={() => previsualizar(indice)}
              onFocus={() => previsualizar(indice)}
              onBlur={() => previsualizar(null)}
              onClick={() => seleccionar(indice + 1)}
              className="flex shrink-0 items-center justify-center rounded-md transition-transform duration-200 hover:-translate-y-0.5 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#287EAB] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
              style={estilo}
            >
              <svg
                viewBox="0 0 24 24"
                width={size}
                height={size}
                aria-hidden="true"
                fill="currentColor"
              >
                <path d="m12 2.8 2.86 5.8 6.4.93-4.63 4.51 1.09 6.37L12 17.4l-5.72 3.01 1.09-6.37-4.63-4.51 6.4-.93L12 2.8Z" />
              </svg>
            </button>
          );
        }

        return (
          <span
            key={indice}
            className="relative inline-flex shrink-0 items-center justify-center"
            style={{ width: size, height: size, color: idleColor }}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              width={size}
              height={size}
              fill="currentColor"
            >
              <path d="m12 2.8 2.86 5.8 6.4.93-4.63 4.51 1.09 6.37L12 17.4l-5.72 3.01 1.09-6.37-4.63-4.51 6.4-.93L12 2.8Z" />
            </svg>
            {fraccion > 0 && (
              <svg
                viewBox="0 0 24 24"
                width={size}
                height={size}
                fill={activeColor}
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - fraccion * 100}% 0 0)` }}
              >
                <path d="m12 2.8 2.86 5.8 6.4.93-4.63 4.51 1.09 6.37L12 17.4l-5.72 3.01 1.09-6.37-4.63-4.51 6.4-.93L12 2.8Z" />
              </svg>
            )}
          </span>
        );
      })}

      {showTip && interactivo && hovered !== null && (
        <span className="ml-1 whitespace-nowrap rounded-full bg-[#153C5B] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
          {labels[hovered] || `${hovered + 1} / ${count}`}
        </span>
      )}
    </div>
  );
}
