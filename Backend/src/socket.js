import { Server } from "socket.io";

// Almacén en memoria
const bloqueosActivos = new Map(); // calleId -> { proyectoId, usuarioId, usuarioNombre, socketId, timeoutId }
const presenciaSalas = new Map();  // proyectoId -> Map(socketId -> { id, name, mail, accion })

const TTL_BLOQUEO_MS = 3 * 60 * 1000; // 3 minutos

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // 1. Oike jave peteĩ proyéktope
    socket.on("unirse_proyecto", ({ proyectoId, usuario }) => {
      const room = `proyecto_${proyectoId}`;
      socket.join(room);
      socket.data.proyectoId = proyectoId;
      socket.data.usuario = usuario;

      // Oñemohenda presencia ryepýpe
      if (!presenciaSalas.has(proyectoId)) {
        presenciaSalas.set(proyectoId, new Map());
      }
      const sala = presenciaSalas.get(proyectoId);
      sala.set(socket.id, {
        id: usuario.id,
        name: usuario.name || "Usuario",
        mail: usuario.mail || "",
        accion: "Viendo el mapa",
      });

      // Oñemondo lista de usuarios conectados upe sala-pe
      io.to(room).emit("actualizar_presencia", Array.from(sala.values()));

      // Oñemondo evento de conexión pyahu
      io.to(room).emit("nueva_actividad", {
        id: `${Date.now()}_${socket.id}`,
        tipo: "conexion",
        usuario: usuario.name || "Usuario",
        descripcion: "se conectó al proyecto",
        timestamp: Date.now(),
      });

      // Oñemondo umi bloqueo oĩva voi upe proyéktope
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

    // 2. Osẽ jave sala-gui
    socket.on("salir_proyecto", ({ proyectoId }) => {
      socket.leave(`proyecto_${proyectoId}`);
      removerUsuarioPresencia(socket.id, proyectoId, io);
      liberarBloqueosDeSocket(socket.id, io);
    });

    // 3. Omboty jave peteĩ tape (bloquear para editar)
    socket.on("bloquear_calle", ({ proyectoId, calleId, nombreCalle, usuario }) => {
      const room = `proyecto_${proyectoId}`;
      const bloqueoExistente = bloqueosActivos.get(calleId);

      if (bloqueoExistente && bloqueoExistente.socketId !== socket.id) {
        socket.emit("bloqueo_rechazado", {
          calleId,
          bloqueadoPor: bloqueoExistente.usuarioNombre,
        });
        return;
      }

      if (bloqueoExistente?.timeoutId) {
        clearTimeout(bloqueoExistente.timeoutId);
      }

      const timeoutId = setTimeout(() => {
        bloqueosActivos.delete(calleId);
        actualizarAccionUsuario(proyectoId, socket.id, "Viendo el mapa", io);
        io.to(room).emit("calle_liberada", { calleId });
      }, TTL_BLOQUEO_MS);

      bloqueosActivos.set(calleId, {
        proyectoId,
        usuarioId: usuario.id,
        usuarioNombre: usuario.name,
        socketId: socket.id,
        timeoutId,
      });

      // Oñemoambue mba'épa ojapo hína upe tapicha
      actualizarAccionUsuario(
        proyectoId,
        socket.id,
        `Editando ${nombreCalle || "calle"}`,
        io
      );

      io.to(room).emit("calle_bloqueada", {
        calleId,
        usuarioId: usuario.id,
        usuarioNombre: usuario.name,
      });

      io.to(room).emit("nueva_actividad", {
        id: `${Date.now()}_${calleId}`,
        tipo: "bloqueo",
        usuario: usuario.name,
        descripcion: `comenzó a editar "${nombreCalle || "calle"}"`,
        timestamp: Date.now(),
      });
    });

    // 4. Oheja jave pe tape (liberar calle)
    socket.on("liberar_calle", ({ proyectoId, calleId }) => {
      const room = `proyecto_${proyectoId}`;
      const bloqueo = bloqueosActivos.get(calleId);

      if (bloqueo && bloqueo.socketId === socket.id) {
        if (bloqueo.timeoutId) clearTimeout(bloqueo.timeoutId);
        bloqueosActivos.delete(calleId);

        actualizarAccionUsuario(proyectoId, socket.id, "Viendo el mapa", io);
        io.to(room).emit("calle_liberada", { calleId });
      }
    });

    // 5. Omoambue térã omoĩ jave datos pyahu (calle actualizada/eliminada)
    socket.on("calle_actualizada", ({ proyectoId, accion, data, usuario }) => {
      const room = `proyecto_${proyectoId}`;

      // Oñemondo ambue tapichakuérape
      socket.to(room).emit("calle_sincronizada", { accion, data });

      // Oñeregistra tembiapo
      const nombre = data?.nombre_calle || "calle";
      io.to(room).emit("nueva_actividad", {
        id: `${Date.now()}_sync`,
        tipo: accion === "eliminada" ? "eliminacion" : "edicion",
        usuario: usuario?.name || socket.data.usuario?.name || "Un usuario",
        descripcion:
          accion === "eliminada"
            ? `eliminó la calle "${nombre}"`
            : `actualizó los datos de "${nombre}"`,
        timestamp: Date.now(),
      });
    });

    // 6. Oñemboty jave conexión (desconexión)
    socket.on("disconnect", () => {
      const { proyectoId } = socket.data;
      if (proyectoId) {
        removerUsuarioPresencia(socket.id, proyectoId, io);
      }
      liberarBloqueosDeSocket(socket.id, io);
    });
  });

  return io;
}

// Funciones auxiliares
function actualizarAccionUsuario(proyectoId, socketId, accion, io) {
  const sala = presenciaSalas.get(proyectoId);
  if (sala && sala.has(socketId)) {
    sala.get(socketId).accion = accion;
    io.to(`proyecto_${proyectoId}`).emit("actualizar_presencia", Array.from(sala.values()));
  }
}

function removerUsuarioPresencia(socketId, proyectoId, io) {
  const sala = presenciaSalas.get(proyectoId);
  if (!sala) return;

  const usuario = sala.get(socketId);
  sala.delete(socketId);

  const room = `proyecto_${proyectoId}`;

  if (sala.size === 0) {
    presenciaSalas.delete(proyectoId);
  } else {
    io.to(room).emit("actualizar_presencia", Array.from(sala.values()));
  }

  if (usuario) {
    io.to(room).emit("nueva_actividad", {
      id: `${Date.now()}_disc`,
      tipo: "desconexion",
      usuario: usuario.name,
      descripcion: "salió del proyecto",
      timestamp: Date.now(),
    });
  }
}

function liberarBloqueosDeSocket(socketId, io) {
  for (const [calleId, info] of bloqueosActivos.entries()) {
    if (info.socketId === socketId) {
      if (info.timeoutId) clearTimeout(info.timeoutId);
      bloqueosActivos.delete(calleId);
      io.to(`proyecto_${info.proyectoId}`).emit("calle_liberada", { calleId });
    }
  }
}