import { listarProyectosPublicos, obtenerProyectoPublico } from "../persintence/repository/publicProject.repository.js";

export async function listarPublicos(req, res) {
  try {
    const { q = "", lat, lng, radio = "30" } = req.query;
    const tieneLat = lat !== undefined && lat !== "";
    const tieneLng = lng !== undefined && lng !== "";
    if (tieneLat !== tieneLng) return res.status(400).json({ status: false, error: "Indica lat y lng juntos." });
    if (tieneLat && (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng)) || Math.abs(Number(lat)) > 90 || Math.abs(Number(lng)) > 180)) return res.status(400).json({ status: false, error: "Coordenadas inválidas." });
    if (typeof q !== "string" || q.length > 120) return res.status(400).json({ status: false, error: "Búsqueda demasiado larga o inválida." });
    const radioKm = Number(radio);
    if (!Number.isFinite(radioKm) || radioKm <= 0 || radioKm > 500) return res.status(400).json({ status: false, error: "Radio inválido (máximo 500 km)." });
    const data = await listarProyectosPublicos({ q, lat: tieneLat ? Number(lat) : null, lng: tieneLng ? Number(lng) : null, radio: radioKm });
    res.json({ status: true, data });
  } catch (err) {
    console.error("Listado público:", err);
    res.status(500).json({ status: false, error: "No se pudieron cargar los mapas públicos." });
  }
}

export async function detallePublico(req, res) {
  try {
    if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(404).json({ status: false, error: "Mapa no encontrado." });
    const data = await obtenerProyectoPublico(req.params.id);
    if (!data) return res.status(404).json({ status: false, error: "Mapa no disponible públicamente." });
    res.json({ status: true, data });
  } catch (err) {
    console.error("Detalle público:", err);
    res.status(500).json({ status: false, error: "No se pudo cargar el mapa público." });
  }
}
