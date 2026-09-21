import { Street } from "../models/Street.js";

export async function getStreetsByProject_(proyectoId) {
  try {
    return await Street.findAll({ where: { proyecto_id: proyectoId } });
  } catch (error) {
    throw new Error("No se pudieron obtener las calles");
  }
}

export async function createStreet_(street) {
  try {
    return await Street.create(street);
  } catch (error) {
    throw new Error("No se pudo crear la calle");
  }
}

export async function updateStreet_(id, proyectoId, cambios) {
  try {
    const street = await Street.findOne({ where: { id, proyecto_id: proyectoId } });
    if (!street) throw new Error("Calle no encontrada");

    Object.assign(street, cambios);
    await street.save();
    return street;
  } catch (error) {
    throw new Error(error.message || "No se pudo actualizar la calle");
  }
}

export async function deleteStreet_(id, proyectoId) {
  try {
    const eliminado = await Street.destroy({ where: { id, proyecto_id: proyectoId } });
    if (!eliminado) throw new Error("Calle no encontrada");
    return "Calle eliminada correctamente";
  } catch (error) {
    throw new Error(error.message || "No se pudo eliminar la calle");
  }
}