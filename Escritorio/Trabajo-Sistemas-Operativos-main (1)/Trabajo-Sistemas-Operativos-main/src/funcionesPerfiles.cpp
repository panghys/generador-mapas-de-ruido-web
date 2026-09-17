#include <iostream>
#include <fstream>
#include <cstring>
#include <cstdlib>
#include "../include/funciones.h"
#include "../include/estructuras.h"

using namespace std;

//  Sobrescribe el archivo de perfiles con lo que esta en memoria
static void reescribirArchivoPerfiles(const ListaPerfiles &lProfiles) {
    const char* path = getenv("PERFIL_FILE");
    if (!path) {
        cerr << "Error: PERFIL_FILE no definido en .env" << endl;
        return;
    }

    ofstream file(path, ios::binary | ios::trunc);
    if (!file.is_open()) {
        cerr << "Error al abrir el archivo de perfiles para sobrescribir." << endl;
        return;
    }

    for (const auto &p : lProfiles.lista) {
        file.write((char*)&p, sizeof(Perfil));
    }
    file.close();
}

// Carga los perfiles desde el archivo a la memoria
void cargarPerfilesDesdeArchivo(ListaPerfiles &lProfiles) {
    const char* path = getenv("PERFIL_FILE");
    if (!path) {
        cerr << "Error: PERFIL_FILE no definido en .env" << endl;
        return;
    }

    ifstream file(path, ios::binary);
    if (!file.is_open()) {
        cerr << "No se pudo abrir el archivo de perfiles: " << path << endl;
        return;
    }

    lProfiles.lista.clear();
    bool reading = true;

    while (reading) {
        Perfil p;
        strcpy(p.nombre, "empty");
        file.read((char*)&p, sizeof(Perfil));

        if (!file || string(p.nombre) == "empty") {
            reading = false;
            break;
        }

        lProfiles.lista.push_back(p);
    }

    file.close();
    lProfiles.cargado = true;
}

// Guarda un perfil nuevo al final del archivo
void guardarPerfilEnArchivo(const Perfil &perfil) {
    const char* path = getenv("PERFIL_FILE");
    if (!path) {
        cerr << "Error: PERFIL_FILE no definido en .env" << endl;
        return;
    }

    ofstream file(path, ios::binary | ios::app);
    if (!file.is_open()) {
        cerr << "Error al abrir el archivo de perfiles para guardar." << endl;
        return;
    }

    file.write((char*)&perfil, sizeof(Perfil));
    file.close();
}

// Ingresa o anexa opciones permitidas a un perfil
void ingresarPerfil(ListaPerfiles &lProfiles) {
    if (!lProfiles.cargado) {
        cargarPerfilesDesdeArchivo(lProfiles);
    }

    cout << "\n--- Ingresar / Modificar Perfil ---" << endl;
    cout << "Ingrese nombre del Perfil (ej. GENERAL / ADMIN): ";
    string nombre;
    cin >> nombre;

    int opcionPermitida;
    cout << "Ingrese numero de opcion de menu permitida (ej. 1, 2, 3...): ";
    cin >> opcionPermitida;

    int indice = -1;
    for (size_t i = 0; i < lProfiles.lista.size(); ++i) {
        if (string(lProfiles.lista[i].nombre) == nombre) {
            indice = static_cast<int>(i);
            break;
        }
    }

    if (indice != -1) {
        Perfil &existente = lProfiles.lista[indice];
        if (existente.cantidadOpciones >= (int)(sizeof(existente.opcionesMenu) / sizeof(int))) {
            cout << "Error: El perfil ya alcanzo el maximo de opciones permitidas." << endl;
            return;
        }
        existente.opcionesMenu[existente.cantidadOpciones] = opcionPermitida;
        existente.cantidadOpciones++;
        reescribirArchivoPerfiles(lProfiles);
        cout << "Opcion de menu agregada al perfil existente con exito." << endl;
    } else {
        Perfil nuevo;
        strncpy(nuevo.nombre, nombre.c_str(), sizeof(nuevo.nombre) - 1);
        nuevo.nombre[sizeof(nuevo.nombre) - 1] = '\0';
        nuevo.cantidadOpciones = 1;
        nuevo.opcionesMenu[0] = opcionPermitida;
        lProfiles.lista.push_back(nuevo);
        guardarPerfilEnArchivo(nuevo);
        cout << "Nuevo perfil registrado exitosamente." << endl;
    }
}


void listarPerfiles(ListaPerfiles &lProfiles) {
    if (lProfiles.cargado) {
        for (const auto &p : lProfiles.lista) {
            cout << p.nombre << endl;
        }
    } else {
        const char* path = getenv("PERFIL_FILE");
        if (!path) return;

        ifstream file(path, ios::binary);
        if (!file.is_open()) return;

        bool reading = true;
        while (reading) {
            Perfil p;
            strcpy(p.nombre, "empty");
            file.read((char*)&p, sizeof(Perfil));

            if (!file || string(p.nombre) == "empty") {
                reading = false;
                break;
            }

            cout << p.nombre << endl;
        }
        file.close();
    }
}
// Elimina un perfil por su nombre
void eliminarPerfil(const std::string &nombrePerfil, ListaPerfiles &lProfiles) {
    if (!lProfiles.cargado) {
        cargarPerfilesDesdeArchivo(lProfiles);
    }

    int indice = -1;
    for (size_t i = 0; i < lProfiles.lista.size(); ++i) {
        if (string(lProfiles.lista[i].nombre) == nombrePerfil) {
            indice = static_cast<int>(i);
            break;
        }
    }

    if (indice == -1) {
        cout << "No se encontro el perfil: " << nombrePerfil << endl;
        return;
    }

    lProfiles.lista.erase(lProfiles.lista.begin() + indice);
    reescribirArchivoPerfiles(lProfiles);
    cout << "Perfil '" << nombrePerfil << "' eliminado correctamente." << endl;
}