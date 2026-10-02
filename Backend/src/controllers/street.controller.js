import { getProject_ } from "../persintence/repository/project.repository.js";
import {
  getStreetsByProject_,
  getStreetById_,
  createStreet_,
  updateStreet_,
  deleteStreet_,
} from "../persintence/repository/street.repository.js";
import { calcularRuidoRLS90, validarParametrosRuido } from "../services/ruido.calculator.js";

// Verifica que el proyecto exista y pertenezca al usuario autenticado
async function verificarProyecto(proyectoId, usuarioId) {
  return getProject_(proyectoId, usuarioId);
}

export async function getStreets(req, res) {
  const { proyectoId } = req.params;

  const proyecto = await verificarProyecto(proyectoId, req.user.id);
  if (!proyecto) return res.status(404).json({ status: false, error: "Proyecto no encontrado" });

  getStreetsByProject_(proyectoId).then(
    (data) => res.status(200).json({ status: true, data }),
    (error) => res.status(400).json({ status: false, error: error.message })
  );
}

export async function createStreet(req, res) {
  const { proyectoId } = req.params;

  const proyecto = await verificarProyecto(proyectoId, req.user.id);
  if (!proyecto) return res.status(404).json({ status: false, error: "Proyecto no encontrado" });

  const {
    nombre_calle,
    trazo_calle,
    tipo_calle,
    trafico_vehiculos_grandes,
    trafico_vehiculos_medianos,
    trafico_vehiculos_pequenos,
    color_asignado,
    velocidadPromedio = 50,
    tipoSuperficie = "asfalto_no_ranurado",
    periodoConteo = "15_minutos",
  } = req.body;

  if (!trazo_calle) {
    return res.status(400).json({ status: false, error: "Falta el trazado de la calle" });
  }

  const parametrosRuido = {
    pequeños: trafico_vehiculos_pequenos ?? 0,
    medianos: trafico_vehiculos_medianos ?? 0,
    grandes: trafico_vehiculos_grandes ?? 0,
    velocidadPromedio,
    periodoConteo,
  };
  const validacion = validarParametrosRuido(parametrosRuido);
  if (!validacion.esValido) {
    return res.status(400).json({ status: false, error: validacion.errores.join(" ") });
  }

  const nivelRuido = calcularRuidoRLS90(
    parametrosRuido,
    velocidadPromedio,
    tipoSuperficie,
    25,
    periodoConteo
  );

  const street = {
    proyecto_id: proyectoId,
    nombre_calle,
    trazo_calle,
    tipo_calle,
    trafico_vehiculos_grandes: Number(parametrosRuido.grandes),
    trafico_vehiculos_medianos: Number(parametrosRuido.medianos),
    trafico_vehiculos_pequenos: Number(parametrosRuido.pequeños),
    color_asignado,
    velocidadPromedio,
    tipoSuperficie,
    periodoConteo,
    nivelRuidoCalculado: nivelRuido,
  };

  createStreet_(street).then(
    (data) => res.status(200).json({
      status: true,
      data,
      nivelRuido,
    }),
    (error) => res.status(400).json({ status: false, error: error.message })
  );
}

export async function updateStreet(req, res) {
  const { proyectoId, id } = req.params;

  const proyecto = await verificarProyecto(proyectoId, req.user.id);
  if (!proyecto) return res.status(404).json({ status: false, error: "Proyecto no encontrado" });

  const calleActual = await getStreetById_(id, proyectoId);
  if (!calleActual) return res.status(404).json({ status: false, error: "Calle no encontrada" });

  const {
    nombre_calle,
    trazo_calle,
    tipo_calle,
    trafico_vehiculos_grandes,
    trafico_vehiculos_medianos,
    trafico_vehiculos_pequenos,
    color_asignado,
    velocidadPromedio = calleActual.velocidadPromedio ?? 50,
    tipoSuperficie = calleActual.tipoSuperficie || "asfalto_no_ranurado",
    periodoConteo = calleActual.periodoConteo || "15_minutos",
  } = req.body;

  const parametrosRuido = {
    pequeños: trafico_vehiculos_pequenos ?? calleActual.trafico_vehiculos_pequenos ?? 0,
    medianos: trafico_vehiculos_medianos ?? calleActual.trafico_vehiculos_medianos ?? 0,
    grandes: trafico_vehiculos_grandes ?? calleActual.trafico_vehiculos_grandes ?? 0,
    velocidadPromedio,
    periodoConteo,
  };
  const validacion = validarParametrosRuido(parametrosRuido);
  if (!validacion.esValido) {
    return res.status(400).json({ status: false, error: validacion.errores.join(" ") });
  }

  // Solo actualiza los campos que realmente vinieron en el body
  const cambios = {};
  if (nombre_calle !== undefined) cambios.nombre_calle = nombre_calle;
  if (trazo_calle !== undefined) cambios.trazo_calle = trazo_calle;
  if (tipo_calle !== undefined) cambios.tipo_calle = tipo_calle;
  if (trafico_vehiculos_grandes !== undefined) cambios.trafico_vehiculos_grandes = trafico_vehiculos_grandes;
  if (trafico_vehiculos_medianos !== undefined) cambios.trafico_vehiculos_medianos = trafico_vehiculos_medianos;
  if (trafico_vehiculos_pequenos !== undefined) cambios.trafico_vehiculos_pequenos = trafico_vehiculos_pequenos;
  if (color_asignado !== undefined) cambios.color_asignado = color_asignado;
  cambios.velocidadPromedio = Number(velocidadPromedio);
  cambios.tipoSuperficie = tipoSuperficie;
  cambios.periodoConteo = periodoConteo;
  cambios.nivelRuidoCalculado = calcularRuidoRLS90(
    parametrosRuido,
    velocidadPromedio,
    tipoSuperficie,
    25,
    periodoConteo
  );

  updateStreet_(id, proyectoId, cambios).then(
    (data) => res.status(200).json({ status: true, data }),
    (error) => res.status(400).json({ status: false, error: error.message })
  );
}

export async function deleteStreet(req, res) {
  const { proyectoId, id } = req.params;

  const proyecto = await verificarProyecto(proyectoId, req.user.id);
  if (!proyecto) return res.status(404).json({ status: false, error: "Proyecto no encontrado" });

  deleteStreet_(id, proyectoId).then(
    (msg) => res.status(200).json({ status: true, msg }),
    (error) => res.status(400).json({ status: false, error: error.message })
  );
}