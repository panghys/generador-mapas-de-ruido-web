#include <iostream>
#include <fstream>
#include <cstring>
#include <cstdlib>
#include <limits>
#include "../include/funciones.h"
#include "../include/estructuras.h"

using namespace std;

static void reescribirArchivoUsuarios(const ListaUsuarios &lUsers) {
    const char* path = getenv("USER_FILE");
    if (!path) {
        cerr << "Error: Variable de entorno USER_FILE no definida." << endl;
        return;
    }

    ofstream file(path, ios::binary | ios::trunc);
    if (!file.is_open()) {
        cerr << "Error al abrir el archivo para sobrescribir: " << path << endl;
        return;
    }

    for (const auto &u : lUsers.lista) {
        file.write((char*)&u, sizeof(Usuario));
    }
    file.close();
}

void cargarUsuariosDesdeArchivo(ListaUsuarios &lUsers) {
    const char* path = getenv("USER_FILE");
    if (!path) {
        cerr << "Error: Variable de entorno USER_FILE no encontrada." << endl;
        return;
    }

    ifstream file(path, ios::binary);
    if (!file.is_open()) {
        cerr << "No se pudo abrir el archivo de usuarios: " << path << endl;
        return;
    }

    lUsers.lista.clear();
    bool reading = true;

    while (reading) {
        Usuario u;
        strcpy(u.nombre, "empty");
        file.read((char*)&u, sizeof(Usuario));

        if (!file || string(u.nombre) == "empty") {
            reading = false;
            break;
        }

        lUsers.lista.push_back(u);
    }

    file.close();
    lUsers.cargado = true;
}

void guardarUsuarioEnArchivo(const Usuario &user) {
    const char* path = getenv("USER_FILE");
    if (!path) {
        cerr << "Error: Variable de entorno USER_FILE no encontrada." << endl;
        return;
    }

    ofstream file(path, ios::binary | ios::app);
    if (!file.is_open()) {
        cerr << "Error al abrir el archivo para agregar usuario: " << path << endl;
        return;
    }

    file.write((char*)&user, sizeof(Usuario));
    file.close();
}

void ingresarUsuario(ListaUsuarios &lUsers) {
    if (!lUsers.cargado) {
        cargarUsuariosDesdeArchivo(lUsers);
    }

    Usuario u;
    cout << "\n--- Ingresar Nuevo Usuario ---" << endl;
    cout << "Ingrese ID: ";
    if (!(cin >> u.id)) {
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        cout << "Error: Formato inválido. Por favor, ingrese un número." << endl;
        return;
    }

    cin.ignore();

    for (const auto &usr : lUsers.lista) {
        if (usr.id == u.id) {
            cout << "Error: Ya existe un usuario con el ID " << u.id << "." << endl;
            return;
        }
	}
    string nombre, username, password;

    cout << "Ingrese Nombre: ";
    getline(cin, nombre);
    strncpy(u.nombre, nombre.c_str(), sizeof(u.nombre) - 1);
    u.nombre[sizeof(u.nombre) - 1] = '\0';

    cout << "Ingrese Username: ";
    getline(cin, username);
    strncpy(u.username, username.c_str(), sizeof(u.username) - 1);
    u.username[sizeof(u.username) - 1] = '\0';

    cout << "Ingrese Password: ";
    getline(cin, password);
    strncpy(u.password, password.c_str(), sizeof(u.password) - 1);
    u.password[sizeof(u.password) - 1] = '\0';

    int opcPerfil = 0;
    while (opcPerfil != 1 && opcPerfil != 2) {
        cout << "Seleccione Perfil (1. GENERAL / 2. ADMIN): ";
        cin >> opcPerfil;
        if (opcPerfil == 1) strcpy(u.perfil, "GENERAL");
        else if (opcPerfil == 2) strcpy(u.perfil, "ADMIN");
        else cout << "Opcion no valida." << endl;
    }
    cin.ignore();

    lUsers.lista.push_back(u);
    guardarUsuarioEnArchivo(u);
    cout << "Usuario registrado exitosamente." << endl;
}

void listarUsuarios(ListaUsuarios &lUsers) {
    cout << "\n--- Lista de Usuarios ---" << endl;

    if (lUsers.cargado) {
        if (lUsers.lista.empty()) {
            cout << "No hay usuarios registrados en memoria." << endl;
            return;
        }
        for (const auto &u : lUsers.lista) {
            cout << "ID: " << u.id 
                 << " | Nombre: " << u.nombre 
                 << " | Username: " << u.username 
                 << " | Perfil: " << u.perfil << endl;
        }
    } else {
        const char* path = getenv("USER_FILE");
        if (!path) {
            cerr << "Error: USER_FILE no definido." << endl;
            return;
        }

        ifstream file(path, ios::binary);
        if (!file.is_open()) {
            cout << "No se pudo leer el archivo de usuarios." << endl;
            return;
        }

        bool vacio = true;
        bool reading = true;
        while (reading) {
            Usuario u;
            strcpy(u.nombre, "empty");
            file.read((char*)&u, sizeof(Usuario));

            if (!file || string(u.nombre) == "empty") {
                reading = false;
                break;
            }

            vacio = false;
            cout << "ID: " << u.id 
                 << " | Nombre: " << u.nombre 
                 << " | Username: " << u.username 
                 << " | Perfil: " << u.perfil << endl;
        }
        if (vacio) cout << "El archivo de usuarios esta vacio." << endl;
        file.close();
    }
}

void eliminarUsuario(int id, ListaUsuarios &lUsers) {
    if (!lUsers.cargado) {
        cargarUsuariosDesdeArchivo(lUsers);
    }

    int indice = -1;
    for (size_t i = 0; i < lUsers.lista.size(); ++i) {
        if (lUsers.lista[i].id == id) {
            indice = static_cast<int>(i);
            break;
        }
    }

    if (indice == -1) {
        cout << "No se encontro ningun usuario con el ID: " << id << endl;
        return;
    }

    if (string(lUsers.lista[indice].perfil) == "ADMIN") {
        cout << "\n[ALERTA DE SEGURIDAD] El usuario que intenta eliminar es de perfil ADMIN." << endl;
        cout << "Esta seguro de que desea continuar? (1: Si / 0: No): ";
        int confirmar;
        cin >> confirmar;
        if (confirmar != 1) {
            cout << "Operacion cancelada." << endl;
            return;
        }
    }

    lUsers.lista.erase(lUsers.lista.begin() + indice);
    reescribirArchivoUsuarios(lUsers);
    cout << "Usuario con ID " << id << " eliminado correctamente." << endl;
}