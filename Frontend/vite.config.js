import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Carga las variables desde el .env en la raíz del proyecto
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');

  console.log('VITE_APP_HOST:', env.VITE_APP_HOST);
  console.log('VITE_APP_PORT:', env.VITE_APP_PORT);

  return {
    plugins: [react()],
    // Permite que React (import.meta.env) lea el .env de la raíz
    envDir: '../',
    server: {
      host: env.VITE_APP_HOST || true,
      port: env.VITE_APP_PORT ? Number(env.VITE_APP_PORT) : 3003,
    },
  };
});