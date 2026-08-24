# Use the official Node.js image as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY Backend/package*.json ./

# Instalar netcat (nc) para el wait-for-db.sh
RUN apt-get update && apt-get install -y netcat-openbsd

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY Backend ./

# Copiar el script para esperar la base de datos
COPY Backend/wait-for-db.sh /wait-for-db.sh
RUN chmod +x /wait-for-db.sh

# Expose the port defined in the environment variable
EXPOSE 4009

# Usar el script como punto de entrada
CMD ["/wait-for-db.sh", "npm", "start"]
