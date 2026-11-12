import {
  listarProyectosPublicos,
  obtenerProyectoPublico,
  registrarValoracionProyectoPublico,
} from "../persintence/repository/publicProject.repository.js";

export async function listarPublicos(req, res) {
  try {
    const { q = "", lat, lng, radio = "30" } = req.query;
    const tieneLat = lat !== undefined && lat !== "";
    const tieneLng = lng !== undefined && lng !== "";

    if (tieneLat !== tieneLng) {
      return res.status(400).json({
        status: false,
        error: "Indica lat y lng juntos.",
      });
    }

    if (
      tieneLat &&
      (!Number.isFinite(Number(lat)) ||
        !Number.isFinite(Number(lng)) ||
        Math.abs(Number(lat)) > 90 ||
        Math.abs(Number(lng)) > 180)
    ) {
      return res.status(400).json({
        status: false,
        error: "Coordenadas inválidas.",
      });
    }

    if (typeof q !== "string" || q.length > 120) {
      return res.status(400).json({
        status: false,
        error: "Búsqueda demasiado larga o inválida.",
      });
    }

    const radioKm = Number(radio);
    if (!Number.isFinite(radioKm) || radioKm <= 0 || radioKm > 500) {
      return res.status(400).json({
        status: false,
        error: "Radio inválido (máximo 500 km).",
      });
    }

    const data = await listarProyectosPublicos({
      q,
      lat: tieneLat ? Number(lat) : null,
      lng: tieneLng ? Number(lng) : null,
      radio: radioKm,
      usuarioId: req.user?.id ?? null,
    });

    res.json({ status: true, data });
  } catch (err) {
    console.error("Listado público:", err);
    res.status(500).json({
      status: false,
      error: "No se pudieron cargar los mapas públicos.",
    });
  }
}

export async function detallePublico(req, res) {
  try {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      return res.status(404).json({
        status: false,
        error: "Mapa no encontrado.",
      });
    }

    const data = await obtenerProyectoPublico(
      req.params.id,
      req.user?.id ?? null
    );

    if (!data) {
      return res.status(404).json({
        status: false,
        error: "Mapa no disponible públicamente.",
      });
    }

    res.json({ status: true, data });
  } catch (err) {
    console.error("Detalle público:", err);
    res.status(500).json({
      status: false,
      error: "No se pudo cargar el mapa público.",
    });
  }
}

export async function valorarPublico(req, res) {
  try {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      return res.status(404).json({
        status: false,
        error: "Mapa no encontrado.",
      });
    }

    const usuarioId = Number(req.user?.id);
    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
      return res.status(401).json({
        status: false,
        error: "Debes iniciar sesión para valorar este mapa.",
      });
    }

    const puntuacion = Number(req.body?.puntuacion);
    if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
      return res.status(400).json({
        status: false,
        error: "La valoración debe ser un número entero entre 1 y 5.",
      });
    }

    const data = await registrarValoracionProyectoPublico({
      proyectoId: Number(req.params.id),
      usuarioId,
      puntuacion,
    });

    if (!data) {
      return res.status(404).json({
        status: false,
        error: "Este mapa no está disponible para recibir valoraciones.",
      });
    }

    res.json({ status: true, data });
  } catch (err) {
    console.error("Valoración de mapa público:", err);
    res.status(500).json({
      status: false,
      error: "No se pudo guardar la valoración.",
    });
  }
}
