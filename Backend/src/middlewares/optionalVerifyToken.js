import jwt from "jsonwebtoken";

// Permite consultar los mapas sin iniciar sesión, pero identifica al usuario
// cuando la petición pública incluye un JWT válido.
export function optionalVerifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const [scheme, token] = typeof authHeader === "string"
    ? authHeader.split(" ")
    : [];

  if (scheme?.toLowerCase() === "bearer" && token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Un token ausente o vencido no debe impedir la lectura pública.
      req.user = null;
    }
  }

  next();
}
