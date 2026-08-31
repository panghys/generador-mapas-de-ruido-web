# Generador de mapas de ruido

.env del backend:
DB_NAME=gdmdr
DB_USER=gdmdr_user
DB_PASSWORD=clavegm
DB_HOST=localhost
DB_PORT=3306
PORT=4009
ORIGIN=http://localhost:5173

.env del frontend:
VITE_APP_HOST=localhost
VITE_APP_PORT=5173










# 🚀 Instrucciones para ejecutar el proyecto con Docker Desktop

---

## ✅ Requisitos previos

1. **Tener instalado Docker Desktop**  
   👉 Descargar desde: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

   - Durante la instalación, asegúrate de activar la opción para usar WSL2 si estás en Windows.
   - Reinicia tu PC si se solicita.

---

## 📦 1. Construir y levantar los servicios

Primero, abre la aplicación Docker Desktop

Luego, desde la raíz del proyecto, abre una terminal y ejecuta:

```bash
docker compose up --build
```

Esto hará lo siguiente:

- Construirá las imágenes del backend y frontend.
- Esperará a que la base de datos esté lista (gracias al script `wait-for-db.sh`).
- Levantará los contenedores definidos en `docker-compose.yml`.

> ⚠️ La primera vez puede demorar varios minutos.

---

## 🌐 2. Acceder a la aplicación

Una vez todo esté levantado, podrás acceder a:

- **Frontend:**  
  [http://localhost:3000](http://localhost:3000)

---

## 🛑 3. Detener los contenedores

Para detener la aplicación sin eliminar los contenedores:

```bash
docker compose down
```

Para detener y eliminar volúmenes y caché:

```bash
docker compose down -v --rmi local
```

---

## 🐞 4. Ver logs (opcional)

Para revisar los logs del backend:

```bash
docker compose logs backend
```

Para ver todos los logs:

```bash
docker compose logs -f
```

---

## 🧪 Extras (opcional)

### Ver contenedores activos:

```bash
docker ps
```

### Entrar a un contenedor (por ejemplo, al backend):

```bash
docker exec -it nombre_del_contenedor bash
```

Puedes ver el nombre del contenedor con `docker ps`.