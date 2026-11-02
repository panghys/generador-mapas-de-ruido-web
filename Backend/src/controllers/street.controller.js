import { getProject_ } from "../persintence/repository/project.repository.js";
import {
  getStreetsByProject_,
  getStreetById_,
  createStreet_,
  updateStreet_,
  deleteStreet_,
} from "../persintence/repository/street.repository.js";
import { calcularRuidoRLS90, validarParametrosRuido } from "../services/ruido.calculator.js";

// Obtener todas las calles de un proyecto
export async function getStreets(req, res) {
  try {
    const proyectoId = req.params.proyectoId || req.params.id;
    const userId = req.user?.id || req.userId;

    // Valida existencia del proyecto y permisos del usuario
    await getProject_(proyectoId, userId);

    const streets = await getStreetsByProject_(proyectoId);
    return res.status(200).json({
      status: true,
      data: streets,
    });
  } catch (error) {
    console.error("[getStreets Error]:", error.message);
    return res.status(403).json({
      status: false,
      error: error.message || "No tienes permiso para acceder a las calles de este proyecto",
    });
  }
}

// Crear una nueva calle
export async function createStreet(req, res) {
  try {
    const proyectoId = req.params.proyectoId || req.params.id;
    const userId = req.user?.id || req.userId;

    await getProject_(proyectoId, userId);

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

    const data = await createStreet_(street);
    return res.status(200).json({
      status: true,
      data,
      nivelRuido,
    });
  } catch (error) {
    console.error("[createStreet Error]:", error.message);
    return res.status(400).json({ status: false, error: error.message });
  }
}

// Actualizar una calle existente
export async function updateStreet(req, res) {
  try {
    const proyectoId = req.params.proyectoId || req.params.id;
    const { id } = req.params;
    const userId = req.user?.id || req.userId;

    await getProject_(proyectoId, userId);

    const calleActual = await getStreetById_(id, proyectoId);
    if (!calleActual) {
      return res.status(404).json({ status: false, error: "Calle no encontrada" });
    }

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

    const data = await updateStreet_(id, proyectoId, cambios);
    return res.status(200).json({ status: true, data });
  } catch (error) {
    console.error("[updateStreet Error]:", error.message);
    return res.status(400).json({ status: false, error: error.message });
  }
}

// Eliminar una calle
export async function deleteStreet(req, res) {
  try {
    const proyectoId = req.params.proyectoId || req.params.id;
    const { id } = req.params;
    const userId = req.user?.id || req.userId;

    await getProject_(proyectoId, userId);

    const msg = await deleteStreet_(id, proyectoId);
    return res.status(200).json({ status: true, msg });
  } catch (error) {
    console.error("[deleteStreet Error]:", error.message);
    return res.status(400).json({ status: false, error: error.message });
  }
}