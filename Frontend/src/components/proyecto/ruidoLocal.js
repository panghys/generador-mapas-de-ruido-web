export function calcularRuidoLocal(
  datosTrafico,
  velocidad = 50,
  tipoSuperficie = "asfalto_no_ranurado",
  periodoConteo = "15_minutos"
) {
  const livianos = Number(datosTrafico.pequeños) || 0;
  const medianos = Number(datosTrafico.medianos) || 0;
  const pesados = Number(datosTrafico.grandes) || 0;
  const factorHorario = periodoConteo === "15_minutos" ? 4 : 1;
  const flujoHorario = (livianos + medianos + pesados) * factorHorario;

  if (flujoHorario === 0) return null;

  const proporcionPesados =
    ((medianos + pesados) / (livianos + medianos + pesados)) * 100;
  const nivelFuente =
    37.3 + 10 * Math.log10(flujoHorario * (1 + 0.082 * proporcionPesados));
  const velocidadValida = Number(velocidad) > 0 ? Number(velocidad) : 50;
  const correccionesSuperficie = {
    asfalto_estandar: { 30: 0, 40: 0, 50: 0, 60: 0 },
    asfalto_no_ranurado: { 30: 0, 40: 0, 50: 0, 60: 0 },
    concreto_asfalto_rasurado: { 30: 1, 40: 1.5, 50: 2, 60: 2 },
    pedregosa_lisa: { 30: 2, 40: 2.5, 50: 3, 60: 3 },
    pedregosa_rugosa: { 30: 3, 40: 4.5, 50: 6, 60: 6 },
    asfalto_hormigon: { 30: 0, 40: 0, 50: 0, 60: -2 },
    asfalto_poroso_15_11: { 30: 0, 40: 0, 50: 0, 60: -4 },
    asfalto_poroso_15_8: { 30: 0, 40: 0, 50: 0, 60: -5 },
  };
  const correcciones = correccionesSuperficie[tipoSuperficie] || correccionesSuperficie.asfalto_estandar;
  const velocidadBase =
    Object.keys(correcciones)
      .map(Number)
      .sort((a, b) => a - b)
      .find((base) => velocidadValida <= base) || 60;
  const correccionVelocidad =
    velocidadValida === 50 ? 0 : 10 * Math.log10(velocidadValida / 50);
  const nivel =
    nivelFuente + correccionVelocidad + correcciones[velocidadBase];

  return Math.round(nivel * 10) / 10;
}
