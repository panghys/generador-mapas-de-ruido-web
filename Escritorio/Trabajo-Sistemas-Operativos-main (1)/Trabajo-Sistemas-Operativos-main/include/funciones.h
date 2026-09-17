#ifndef FUNCIONES_H
#define FUNCIONES_H

#include "estructuras.h"
#include <string>

// Entorno
void getEnvVariable();
int guardarEnv(const char* key, const char* valor, int overwrite);
void leerArchivo(const char* path);

// Menú
void mostrarMenuPrincipal();

// CRUD Usuarios
void cargarUsuariosDesdeArchivo(ListaUsuarios &lUsers);
void guardarUsuarioEnArchivo(const Usuario &user);
void ingresarUsuario(ListaUsuarios &lUsers);
void listarUsuarios(ListaUsuarios &lUsers);
void eliminarUsuario(int id, ListaUsuarios &lUsers);

// CRUD Perfiles
void cargarPerfilesDesdeArchivo(ListaPerfiles &lProfiles);
void guardarPerfilEnArchivo(const Perfil &perfil);
void ingresarPerfil(ListaPerfiles &lProfiles);
void listarPerfiles(ListaPerfiles &lProfiles);
void eliminarPerfil(const std::string &nombrePerfil, ListaPerfiles &lProfiles);

#endif