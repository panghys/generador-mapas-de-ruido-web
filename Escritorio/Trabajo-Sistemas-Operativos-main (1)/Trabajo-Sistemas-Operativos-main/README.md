# SistOpe - Sistema de Gestión con Menú Principal (Entrega 2)

## Integrantes

| Nombre | Rol |
|---|---|
| _(completar)_ | _(completar)_ |
| _(completar)_ | _(completar)_ |

**Grupo:** _(completar con el ID del grupo)_

## 1. Propósito de la aplicación

Esta segunda entrega construye un **MENÚ PRINCIPAL** que centraliza el acceso a distintos módulos del sistema, trabajando con perfiles de usuario, autenticación por argumentos de ejecución y llamadas a programas externos ya construidos. Sus funcionalidades son:

- **Autenticación** de usuarios mediante argumentos de ejecución (`-u`, `-p`, `-f`) contra el archivo de usuarios registrados.
- **Admin de usuarios y perfiles**: invoca (vía `system()`) el programa `admin.exe`, construido en la Entrega 1, que permite ingresar, listar y eliminar usuarios y perfiles. Solo accesible para el perfil `ADMIN`.
- **Multiplicador de matrices NxM**: invoca (vía `system()`) el programa `multi.exe`, que lee dos matrices desde archivos de texto, valida que la multiplicación sea posible y muestra el resultado.
- **Juego**: opción reservada, actualmente en construcción.
- **¿Es palíndromo?**: valida si un texto ingresado por el usuario es o no un palíndromo.
- **Calcular f(x) = x² + 2x + 8**: calcula la función para un valor real ingresado por el usuario.
- **Conteo sobre texto**: cuenta vocales, consonantes, caracteres especiales y palabras del archivo indicado en el argumento `-f`.
- **Conteo sobre archivo**: igual al anterior, pero sobre la ruta de archivo que el usuario ingrese en tiempo de ejecución.

La lectura y escritura de usuarios y perfiles se realiza leyendo/escribiendo el **struct completo** en modo binario (no como texto delimitado), tal como se solicitó en el enunciado.

## 2. Cómo se debe ejecutar

El proyecto está desarrollado en C++ (estándar C++17) y utiliza la herramienta `make` para automatizar su compilación. Genera **tres ejecutables**: `main.exe` (menú principal), `multi.exe` (multiplicador de matrices) y `admin.exe` (administración de usuarios y perfiles).

### Paso 1: Compilar el código

**Opción A: Compilación automatizada (si tienes "make" instalado)**

Abre una terminal en la raíz del proyecto y ejecuta:

```
make
```

**Opción B: Compilación manual (si NO tienes "make" instalado)**

Si tu sistema (como Windows PowerShell) no reconoce el comando "make", ejecuta cada uno de estos tres comandos desde la raíz del proyecto:

Menú Principal:
```
g++ -Wall -std=c++17 -Iinclude -Icalculo/include src/main.cpp src/config.cpp src/funcionesUsuarios.cpp src/funcionesPerfiles.cpp src/menu.cpp calculo/src/palindromo.cpp calculo/src/fx.cpp -o main.exe
```

Multiplicador de Matrices:
```
g++ -Wall -std=c++17 -Iinclude -Icalculo/include calculo/mainMatrices.cpp calculo/src/matrices.cpp -o multi.exe
```

Administración de Usuarios y Perfiles:
```
g++ -Wall -std=c++17 -Iinclude -Icalculo/include src/mainAdmin.cpp src/config.cpp src/funcionesUsuarios.cpp src/funcionesPerfiles.cpp -o admin.exe
```

### Paso 2: Ejecutar el sistema

Una vez compilado con éxito, el sistema se ejecuta pasando el usuario, la contraseña y un archivo como argumentos:

```
./main.exe -u <usuario> -p <password> -f <archivo>
```

Ejemplo:
```
./main.exe -u lvc -p 1001 -f "/home/lvc/archivo.txt"
```

En Windows PowerShell/CMD: `.\main.exe -u lvc -p 1001 -f "C:\ruta\archivo.txt"`

Los programas `multi.exe` y `admin.exe` no se ejecutan directamente: el propio `main.exe` los invoca automáticamente (mediante `system()`) desde las opciones 2 y 1 del menú, respectivamente, pasándoles el usuario y perfil ya autenticados.

*(Nota: Asegúrate de tener creada la carpeta "data/" con los archivos de usuarios y perfiles, y el archivo ".env" en la raíz, antes de ejecutar).*

## 3. Descripción de las variables de entorno

El sistema utiliza un archivo `.env` ubicado en la raíz del proyecto para cargar rutas dinámicas y evitar programar las direcciones en el código fuente. Las variables de entorno utilizadas son:

- `USER_FILE`: Define la ruta exacta del archivo binario que almacena los registros de los usuarios (por ejemplo, `data/USUARIOS.TXT`).
- `PERFIL_FILE`: Define la ruta exacta del archivo binario que almacena la información de los perfiles y sus opciones de menú permitidas (por ejemplo, `data/PERFILES.TXT`).
- `LIBROS_DIR`: Define la ruta de la carpeta que contiene los libros de distintos géneros en formato `.txt` (por ejemplo, `LIBROS`).

## 4. Estructura del proyecto

```
include/            Cabeceras compartidas (config, estructuras, funciones, menu)
src/                 Fuente del menú principal, autenticación, CRUD de usuarios/perfiles y administración
calculo/             Módulo de cálculo: matrices, palíndromo y f(x)
data/                Archivos binarios de usuarios y perfiles, y matrices de ejemplo
LIBROS/              Libros de distintos géneros en formato .txt (pendiente de completar)
```
