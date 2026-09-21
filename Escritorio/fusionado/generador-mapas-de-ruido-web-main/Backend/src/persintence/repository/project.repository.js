import { Project } from "../models/Project.js";

export async function getProjectsByUser_(usuarioId) {
  try {
    return await Project.findAll({
      where: { usuario_id: usuarioId },
      order: [["fecha_modificacion", "DESC"]],
    });
  } catch (error) {
    throw new Error("No se pudieron obtener los proyectos");
  }
}

export async function createProject_(project) {
  try {
    return await Project.create(project);
  } catch (error) {
    throw new Error("No se pudo crear el proyecto");
  }
}

export async function getProject_(id, usuarioId) {
  try {
    return await Project.findOne({ where: { id, usuario_id: usuarioId } });
  } catch (error) {
    throw new Error("No se pudo obtener el proyecto");
  }
}

export async function updateProject_(id, usuarioId, cambios) {
  try {
    const project = await Project.findOne({ where: { id, usuario_id: usuarioId } });
    if (!project) throw new Error("Proyecto no encontrado");

    Object.assign(project, cambios, { fecha_modificacion: new Date() });
    await project.save();
    return project;
  } catch (error) {
    throw new Error(error.message || "No se pudo actualizar el proyecto");
  }
}

export async function deleteProject_(id, usuarioId) {
  try {
    const eliminado = await Project.destroy({ where: { id, usuario_id: usuarioId } });
    if (!eliminado) throw new Error("Proyecto no encontrado");
    return "Proyecto eliminado correctamente";
  } catch (error) {
    throw new Error(error.message || "No se pudo eliminar el proyecto");
  }
}