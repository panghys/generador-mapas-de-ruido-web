import { Op } from "sequelize";
import { Project } from "../models/Project.js";
import { Street } from "../models/Street.js";
import { User } from "../models/User.js";
import { ProjectCollaborator } from "../models/ProjectCollaborator.js";
import { sequelize } from "../database/database.js";

// Helper interno para verificar si el usuario es dueño o editor
export async function checkProjectAccess_(id, usuarioId) {
  const project = await Project.findByPk(id);
  if (!project) return { access: false, reason: "not_found" };

  if (project.usuario_id === usuarioId) {
    return { access: true, rol: "propietario", project };
  }

  const colaboracion = await ProjectCollaborator.findOne({
    where: { proyecto_id: id, usuario_id: usuarioId },
  });

  if (colaboracion) {
    return { access: true, rol: colaboracion.rol, project };
  }

  return { access: false, reason: "unauthorized" };
}

// Obtener proyectos propios Y proyectos donde colabora
export async function getProjectsByUser_(usuarioId) {
  try {
    const colaboraciones = await ProjectCollaborator.findAll({
      where: { usuario_id: usuarioId },
      attributes: ["proyecto_id"],
    });

    const idsColaborando = colaboraciones.map((c) => c.proyecto_id);

    return await Project.findAll({
      where: {
        [Op.or]: [
          { usuario_id: usuarioId },
          { id: { [Op.in]: idsColaborando } },
        ],
      },
      include: [
        {
          model: User,
          as: "propietario",
          attributes: ["id", "name", "mail"],
        },
      ],
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
    const auth = await checkProjectAccess_(id, usuarioId);
    if (!auth.access) {
      if (auth.reason === "not_found") return null;
      throw new Error("No tienes permiso para acceder a este proyecto");
    }

    // Retorna el proyecto con la metadata del rol del usuario actual
    const data = auth.project.toJSON();
    data.miRol = auth.rol;
    return data;
  } catch (error) {
    throw new Error(error.message || "No se pudo obtener el proyecto");
  }
}

export async function updateProject_(id, usuarioId, cambios) {
  try {
    const auth = await checkProjectAccess_(id, usuarioId);
    if (!auth.access) {
      throw new Error("No tienes permisos para modificar este proyecto");
    }

    const project = auth.project;

    await sequelize.transaction(async (transaction) => {
      if (cambios.zona === null) {
        await Street.destroy({ where: { proyecto_id: project.id }, transaction });
      }
      Object.assign(project, cambios, { fecha_modificacion: new Date() });
      await project.save({ transaction });
    });

    return project;
  } catch (error) {
    throw new Error(error.message || "No se pudo actualizar el proyecto");
  }
}

// Solo el propietario original puede eliminar el proyecto completo
export async function deleteProject_(id, usuarioId) {
  try {
    const project = await Project.findOne({ where: { id, usuario_id: usuarioId } });
    if (!project) throw new Error("Solo el propietario puede eliminar el proyecto");

    await project.destroy();
    return "Proyecto eliminado correctamente";
  } catch (error) {
    throw new Error(error.message || "No se pudo eliminar el proyecto");
  }
}

// ----------------- GESTIÓN DE COLABORADORES -----------------

export async function getCollaborators_(proyectoId, usuarioId) {
  const auth = await checkProjectAccess_(proyectoId, usuarioId);
  if (!auth.access) throw new Error("No tienes acceso a este proyecto");

  return await ProjectCollaborator.findAll({
    where: { proyecto_id: proyectoId },
    include: [
      {
        model: User,
        as: "usuario",
        attributes: ["id", "name", "mail"],
      },
    ],
  });
}

export async function addCollaboratorByEmail_(proyectoId, ownerId, mailInvitado, rol = "editor") {
  const project = await Project.findOne({ where: { id: proyectoId, usuario_id: ownerId } });
  if (!project) throw new Error("Solo el propietario puede invitar colaboradores");

  const invitado = await User.findOne({ where: { mail: mailInvitado } });
  if (!invitado) throw new Error("El correo ingresado no pertenece a ningún usuario registrado");

  if (invitado.id === ownerId) {
    throw new Error("El propietario ya tiene acceso total al proyecto");
  }

  const yaExiste = await ProjectCollaborator.findOne({
    where: { proyecto_id: proyectoId, usuario_id: invitado.id },
  });
  if (yaExiste) throw new Error("El usuario ya es colaborador en este proyecto");

  return await ProjectCollaborator.create({
    proyecto_id: proyectoId,
    usuario_id: invitado.id,
    rol,
  });
}

export async function removeCollaborator_(proyectoId, ownerId, colaboradorUserId) {
  const project = await Project.findOne({ where: { id: proyectoId, usuario_id: ownerId } });
  if (!project) throw new Error("Solo el propietario puede remover colaboradores");

  const eliminado = await ProjectCollaborator.destroy({
    where: { proyecto_id: proyectoId, usuario_id: colaboradorUserId },
  });

  if (!eliminado) throw new Error("El usuario no figuraba como colaborador");
  return "Colaborador eliminado correctamente";
}