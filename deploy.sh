#!/usr/bin/env bash
set -euo pipefail

SERVER="${SERVER:-grupo3@146.83.216.166}"
REMOTE_DIR="${REMOTE_DIR:-grupo3}"

echo "==> Servidor: $SERVER   Carpeta: ~/$REMOTE_DIR"

ssh "$SERVER" "mkdir -p '$REMOTE_DIR'"

echo "==> Verificando .env en el servidor..."
if ! ssh "$SERVER" "test -f '$REMOTE_DIR/.env'"; then
  echo "!! Falta ~/$REMOTE_DIR/.env en el servidor."
  echo "   Crealo directamente en el servidor con:"
  echo "     VITE_APP_HOST=0.0.0.0"
  echo "     VITE_APP_PORT=3003"
  echo "     VITE_BACKEND_URL=http://grupo3.146.83.216.166.nip.io"
  exit 1
fi

echo "==> Copiando docker-compose..."
scp docker-compose.server.yml "$SERVER:$REMOTE_DIR/docker-compose.yml"

echo "==> Pull de imagenes + arranque..."
ssh "$SERVER" "cd '$REMOTE_DIR' && docker-compose pull && (docker ps -aq --filter name=grupo3_backend --filter name=grupo3_frontend | xargs -r docker rm -f) && docker-compose up -d"
echo "==> Estado:"
ssh "$SERVER" "cd '$REMOTE_DIR' && docker-compose ps"

echo "==> Listo -> http://grupo3.146.83.216.166.nip.io"