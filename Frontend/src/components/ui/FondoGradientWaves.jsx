
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
          horizonColor="#1d94d4"
          waveColor="#fffefe"
          crestColor="#6fccfb8e"
          speed={0.4}
          amplitude={2.8}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={(64 * Math.PI) / 180}
          zoom={1}
          height={5.5}
          fogDepth={20}
          detail="medium"
          brightness={1.25}
          opacity={2}
          grain={false}
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
