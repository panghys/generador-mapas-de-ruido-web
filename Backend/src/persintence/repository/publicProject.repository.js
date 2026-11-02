import { Op } from "sequelize";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { Street } from "../models/Street.js";

const publicado = { es_publico: true, estado: "listo" };
const autor = { model: User, as: "usuario", attributes: ["id", "name"] };
const atributosProyecto = ["id", "nombre", "descripcion", "comuna", "region", "zona", "estado", "es_publico", "fecha_modificacion"];

function centroGeografico(zona) {
  try {
    const geo = typeof zona === "string" ? JSON.parse(zona) : zona;
    const puntos = geo?.type === "Polygon" && Array.isArray(geo.coordinates?.[0]) ? geo.coordinates[0] : [];
    const coordenadas = puntos.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
    // Ignorar el último vértice repetido del anillo cerrado.
    if (coordenadas.length > 1 && coordenadas[0][0] === coordenadas.at(-1)[0] && coordenadas[0][1] === coordenadas.at(-1)[1]) coordenadas.pop();
    if (!coordenadas.length) return null;
    return {
      lat: coordenadas.reduce((s, p) => s + p[1], 0) / coordenadas.length,
      lng: coordenadas.reduce((s, p) => s + p[0], 0) / coordenadas.length,
    };
  } catch { return null; }
}

function distanciaKm(a, b) {
  const r = (v) => v * Math.PI / 180;
  const dLat = r(a.lat - b.lat);
  const dLng = r(a.lng - b.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export async function listarProyectosPublicos({ q = "", lat = null, lng = null, radio = 30 } = {}) {
  const where = { ...publicado };
  if (q.trim()) {
    const termino = `%${q.trim().replace(/[%_\\]/g, "\\$&")}%`;
    where[Op.or] = ["nombre", "descripcion", "comuna", "region"].map((col) => ({ [col]: { [Op.like]: termino } }));
  }
  const registros = await Project.findAll({ where, attributes: atributosProyecto, include: [autor], order: [["fecha_modificacion", "DESC"], ["id", "DESC"]] });
  const origen = lat === null || lng === null ? null : { lat, lng };
  return registros.map((registro) => {
    const objeto = registro.toJSON();
    const centro = centroGeografico(objeto.zona);
    return { ...objeto, distancia_km: origen && centro ? Math.round(distanciaKm(origen, centro) * 10) / 10 : null };
  }).filter((p) => !origen || (p.distancia_km !== null && p.distancia_km <= radio));
}

export async function obtenerProyectoPublico(id) {
  return Project.findOne({
    where: { ...publicado, id }, attributes: atributosProyecto,
    include: [
      autor,
      { model: Street, as: "calles", attributes: ["id", "nombre_calle", "trazo_calle", "tipo_calle", "trafico_vehiculos_grandes", "trafico_vehiculos_medianos", "trafico_vehiculos_pequenos", "tipo_calculo", "nivel_ruido_dba", "color_asignado", "nivelRuidoCalculado", "velocidadPromedio", "tipoSuperficie", "periodoConteo"] },
    ],
  });
}
