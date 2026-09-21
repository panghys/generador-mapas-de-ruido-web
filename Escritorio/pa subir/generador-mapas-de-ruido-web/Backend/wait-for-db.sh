#!/bin/sh

# Espera a que el puerto 3306 del contenedor de MariaDB esté disponible
echo "Esperando a que MariaDB esté disponible en $DB_HOST:$DB_PORT..."

while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done

echo "MariaDB está disponible, iniciando backend..."
exec "$@"