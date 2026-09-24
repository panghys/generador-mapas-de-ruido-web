import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  // En local busca el .env en la raíz del repo (..); en Docker usa el directorio actual
  const parentDir = path.resolve(__dirname, '..');
  const hasParentEnv = fs.existsSync(path.resolve(parentDir, '.env'));
  const envDir = hasParentEnv ? parentDir : __dirname;

  // Combina las variables del archivo .env con las del sistema (Docker env_file)
  const env = { ...process.env, ...loadEnv(mode, envDir, '') };

  console.log('VITE_APP_HOST:', env.VITE_APP_HOST || '0.0.0.0');
  console.log('VITE_APP_PORT:', env.VITE_APP_PORT || 3003);

  // Lista de hosts permitidos (necesario para Caddy y dominios externos en Vite)
  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(',').map((h) => h.trim())
    : ['localhost', '127.0.0.1', 'grupo3.146.83.216.166.nip.io'];

  return {
    plugins: [react()],
    envDir: envDir,
    server: {
      host: env.VITE_APP_HOST || '0.0.0.0',
      port: env.VITE_APP_PORT ? Number(env.VITE_APP_PORT) : 3003,
      allowedHosts: allowedHosts,
      watch: {
        // Evita vigilar librerías o metadatos de Git
        ignored: ['**/node_modules/**', '**/.git/**'],
      },
    },
  };
});