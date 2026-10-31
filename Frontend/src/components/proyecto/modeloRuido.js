import { calcularRuidoLocal } from "./ruidoLocal.js";
import { calcularEmisionCNOSSOS, calcularNivelCNOSSOS25m } from "./cnossos.js";

export const MODELO_RLS90 = "RLS90";
export const MODELO_CNOSSOS = "CNOSSOS";

export const NOMBRE_MODELO = {
  [MODELO_RLS90]: "RLS-90",
  [MODELO_CNOSSOS]: "CNOSSOS-EU",
};

const traficoCNOSSOS = (calle) => ({
  livianos: calle.trafico_vehiculos_pequenos,
  medianos: calle.trafico_vehiculos_medianos,
  pesados: calle.trafico_vehiculos_grandes,
  motos: calle.trafico_motocicletas,
});

export const calcularNivelEmision25 = (calle, modelo) => {
  const velocidad = calle.velocidadPromedio ?? 50;
  const periodo = calle.periodoConteo || "15_minutos";

  if (modelo === MODELO_CNOSSOS) {
    return calcularNivelCNOSSOS25m(traficoCNOSSOS(calle), velocidad, periodo);
  }

  return calcularRuidoLocal(
    {
      pequeños: calle.trafico_vehiculos_pequenos,
      medianos: calle.trafico_vehiculos_medianos,
      grandes: calle.trafico_vehiculos_grandes,
    },
    velocidad,
    calle.tipoSuperficie || "asfalto_no_ranurado",
    periodo
  );
};

export const obtenerBandasEmision = (calle, modelo) => {
  if (modelo !== MODELO_CNOSSOS) return null;
  const emision = calcularEmisionCNOSSOS(
    traficoCNOSSOS(calle),
    calle.velocidadPromedio ?? 50,
    calle.periodoConteo || "15_minutos"
  );
  return emision ? emision.bandasA : null;
};
