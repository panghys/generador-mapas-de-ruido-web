#ifndef MENU_H
#define MENU_H

#include "estructuras.h"
#include <string>
#include <cstdlib>
#include <fstream>
#include <cctype>

void mostrarMenuPrincipal(const std::string &usuario, const std::string &perfil);
void ejecutarOpcion(int opcion, ListaUsuarios &lUsers, ListaPerfiles &lProfiles, const std::string &usuario, const std::string &perfil, const std::string &archivo);

#endif