import { io } from "socket.io-client";

const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:4003").replace(/\/+$/, "");

// autoConnect: false permite conectar solo cuando el usuario entra a ver o editar un mapa
export const socket = io(backendUrl, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});