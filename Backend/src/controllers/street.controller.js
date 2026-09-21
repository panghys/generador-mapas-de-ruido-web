import { getProject_ } from "../persintence/repository/project.repository.js";
import {
  getStreetsByProject_,
  createStreet_,
  updateStreet_,
  deleteStreet_,
} from "../persintence/repository/street.repository.js";

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
  } = req.body;

  if (!trazo_calle) {
    return res.status(400).json({ status: false, error: "Falta el trazado de la calle" });
  }

  const street = {
    proyecto_id: proyectoId,
    nombre_calle,
    trazo_calle,
    tipo_calle,
    trafico_vehiculos_grandes: trafico_vehiculos_grandes || 0,
    trafico_vehiculos_medianos: trafico_vehiculos_medianos || 0,
    trafico_vehiculos_pequenos: trafico_vehiculos_pequenos || 0,
    color_asignado,
  };

  createStreet_(street).then(
    (data) => res.status(200).json({ status: true, data }),
    (error) => res.status(400).json({ status: false, error: error.message })
  );
}

export async function updateStreet(req, res) {
  const { proyectoId, id } = req.params;

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
  } = req.body;

  // Solo actualiza los campos que realmente vinieron en el body
  const cambios = {};
  if (nombre_calle !== undefined) cambios.nombre_calle = nombre_calle;
  if (trazo_calle !== undefined) cambios.trazo_calle = trazo_calle;
  if (tipo_calle !== undefined) cambios.tipo_calle = tipo_calle;
  if (trafico_vehiculos_grandes !== undefined) cambios.trafico_vehiculos_grandes = trafico_vehiculos_grandes;
  if (trafico_vehiculos_medianos !== undefined) cambios.trafico_vehiculos_medianos = trafico_vehiculos_medianos;
  if (trafico_vehiculos_pequenos !== undefined) cambios.trafico_vehiculos_pequenos = trafico_vehiculos_pequenos;
  if (color_asignado !== undefined) cambios.color_asignado = color_asignado;

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