import {
  getProjectsByUser_,
  createProject_,
  getProject_,
  updateProject_,
  deleteProject_,
} from "../persintence/repository/project.repository.js";

export function getProjects(req, res) {
  getProjectsByUser_(req.user.id).then(
    (data) => res.status(200).json({ status: true, data }),
    (error) => res.status(400).json({ status: false, error: error.message })
  );
}

export function createProject(req, res) {
  const { nombre, descripcion, region, comuna, estado } = req.body;

  const project = {
    nombre,
    descripcion,
    region,
    comuna,
    estado: estado || "borrador",
    usuario_id: req.user.id, // viene del JWT verificado, no del body
  };

  createProject_(project).then(
    (data) => res.status(200).json({ status: true, data }),
    (error) => res.status(400).json({ status: false, error: error.message })
  );
}

export function getProject(req, res) {
  const { id } = req.params;
  getProject_(id, req.user.id).then(
    (data) => {
      if (!data) return res.status(404).json({ status: false, error: "Proyecto no encontrado" });
      res.status(200).json({ status: true, data });
    },
    (error) => res.status(400).json({ status: false, error: error.message })
  );
}

export function updateProject(req, res) {
  const { id } = req.params;
  const { nombre, descripcion, region, comuna, estado } = req.body;

  updateProject_(id, req.user.id, { nombre, descripcion, region, comuna, estado }).then(
    (data) => res.status(200).json({ status: true, data }),
    (error) => res.status(400).json({ status: false, error: error.message })
  );
}

export function deleteProject(req, res) {
  const { id } = req.params;
  deleteProject_(id, req.user.id).then(
    (msg) => res.status(200).json({ status: true, msg }),
    (error) => res.status(400).json({ status: false, error: error.message })
  );
}