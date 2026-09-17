#ifndef ESTRUCTURAS_H
#define ESTRUCTURAS_H

#include <string>
#include <vector>

struct Usuario {
    int id;
    char nombre[50];
    char username[30];
    char password[30];
    char perfil[10]; // "GENERAL" o "ADMIN"
};

struct ListaUsuarios {
    std::vector<Usuario> lista;
    bool cargado = false;
};

struct Perfil {
    char nombre[10];             // "GENERAL" o "ADMIN"
    int opcionesMenu[10];        // Arreglo de opciones de menu permitidas para el perfil
    int cantidadOpciones = 0;
};

struct ListaPerfiles {
    std::vector<Perfil> lista;
    bool cargado = false;
};

#endif