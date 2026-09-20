import axios from "axios";

// Quita cualquier "/" final de la URL del backend, así no importa si el .env
// la define con o sin slash al final (evita "http://host//api/...")
const backendUrl = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

const clientAxios = axios.create({
  baseURL: `${backendUrl}/api`,
});

clientAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default clientAxios;