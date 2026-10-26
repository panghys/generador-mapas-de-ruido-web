import { Server } from "socket.io";

// Almacén en memoria: Map<calleId, { usuarioId, usuarioNombre, socketId, timeoutId } >
const bloqueosActivos = new Map();

// Duración máxima de un bloqueo por inactividad (3 minutos)
const TTL_BLOQUEO_MS = 3 * 60 * 1000;

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // Permite conexiones desde Vite (localhost:5173) y desde el dominio de producción
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // 1. Unirse a la sala de un proyecto específico
    socket.on("unirse_proyecto", ({ proyectoId, usuario }) => {
      const room = `proyecto_${proyectoId}`;
      socket.join(room);
      socket.data.proyectoId = proyectoId;
      socket.data.usuario = usuario;

      // Enviar al usuario recién conectado los bloqueos existentes en ese proyecto
      const bloqueosDelProyecto = [];
      for (const [calleId, info] of bloqueosActivos.entries()) {
        if (info.proyectoId === proyectoId) {
          bloqueosDelProyecto.push({
            calleId,
            usuarioId: info.usuarioId,
            usuarioNombre: info.usuarioNombre,
          });
        }
      }
      socket.emit("estado_bloqueos", bloqueosDelProyecto);
    });

    // 2. Salir de la sala del proyecto
    socket.on("salir_proyecto", ({ proyectoId }) => {
      socket.leave(`proyecto_${proyectoId}`);
      liberarBloqueosDeSocket(socket.id, io);
    });

    // 3. Solicitar bloqueo de una calle para edición
    socket.on("bloquear_calle", ({ proyectoId, calleId, usuario }) => {
      const room = `proyecto_${proyectoId}`;
      const bloqueoExistente = bloqueosActivos.get(calleId);

      // Si ya está bloqueada por otro usuario, avisarle al solicitante
      if (bloqueoExistente && bloqueoExistente.socketId !== socket.id) {
        socket.emit("bloqueo_rechazado", {
          calleId,
          bloqueadoPor: bloqueoExistente.usuarioNombre,
        });
        return;
      }

      // Si tenía un timer previo, se limpia
      if (bloqueoExistente?.timeoutId) {
        clearTimeout(bloqueoExistente.timeoutId);
      }

      // Temporizador de seguridad: si no guarda ni cancela en 3 minutos, se libera
      const timeoutId = setTimeout(() => {
        bloqueosActivos.delete(calleId);
        io.to(room).emit("calle_liberada", { calleId });
      }, TTL_BLOQUEO_MS);

      bloqueosActivos.set(calleId, {
        proyectoId,
        usuarioId: usuario.id,
        usuarioNombre: usuario.name,
        socketId: socket.id,
        timeoutId,
      });

      // Notificar a todos los miembros de la sala (incluyendo a quien bloqueó para confirmar)
      io.to(room).emit("calle_bloqueada", {
        calleId,
        usuarioId: usuario.id,
        usuarioNombre: usuario.name,
      });
    });

    // 4. Liberar bloqueo manualmente (al guardar cambios o presionar Cancelar)
    socket.on("liberar_calle", ({ proyectoId, calleId }) => {
      const room = `proyecto_${proyectoId}`;
      const bloqueo = bloqueosActivos.get(calleId);

      if (bloqueo && bloqueo.socketId === socket.id) {
        if (bloqueo.timeoutId) clearTimeout(bloqueo.timeoutId);
        bloqueosActivos.delete(calleId);
        io.to(room).emit("calle_liberada", { calleId });
      }
    });

    // 5. Difusión de cambios en calles (creación, edición de tráfico o borrado)
    socket.on("calle_actualizada", ({ proyectoId, accion, data }) => {
      const room = `proyecto_${proyectoId}`;
      // socket.to() emite a todos en la sala EXCEPTO al que disparó el evento
      socket.to(room).emit("calle_sincronizada", { accion, data });
    });

    // 6. Limpieza automática al cerrar pestaña o perder conexión
    socket.on("disconnect", () => {
      liberarBloqueosDeSocket(socket.id, io);
    });
  });

  return io;
}

// Función auxiliar para limpiar candados huérfanos cuando un usuario se desconecta
function liberarBloqueosDeSocket(socketId, io) {
  for (const [calleId, info] of bloqueosActivos.entries()) {
    if (info.socketId === socketId) {
      if (info.timeoutId) clearTimeout(info.timeoutId);
      bloqueosActivos.delete(calleId);
      io.to(`proyecto_${info.proyectoId}`).emit("calle_liberada", { calleId });
    }
  }
}