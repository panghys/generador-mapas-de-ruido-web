
import React from "react";
import GradientWaves from "./GradientWaves";
import "./FondoGradientWaves.css";

export default function FondoGradientWaves({ children }) {
  return (
    <div className="fondo-gradient-waves">

      {/* FONDO ANIMADO */}
      <div
        className="fondo-gradient-waves__escena"
        aria-hidden="true"
      >
        <GradientWaves
          className="h-full w-full"

          // Tres tonos con contraste definido
          horizonColor="#85C8EA"
          waveColor="#246DA9"
          crestColor="#D5F3FF"

          // Movimiento fluido
          speed={0.28}

          // Relieve marcado sin exceso de turbulencia
          amplitude={2.7}
          waveScale={0.65}
          waveRatio={0.9}
          swell={27}
          turbulence={12}

          // Perspectiva y profundidad
          tilt={(64 * Math.PI) / 180}
          zoom={1}
          height={5.5}
          fogDepth={27}

          // Apariencia
          detail="medium"
          brightness={1.05}
          opacity={1}
          grain={false}

          // No interferir con la interfaz
          mouseInteraction={false}
          parallaxStrength={0}
        />
      </div>

      {/* CONTENIDO POR ENCIMA DEL FONDO */}
      <div className="fondo-gradient-waves__contenido">
        {children}
      </div>

    </div>
  );
}
