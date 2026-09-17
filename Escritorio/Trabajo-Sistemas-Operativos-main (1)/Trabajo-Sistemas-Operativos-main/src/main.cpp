#include <iostream>

#include "../include/config.h"
#include "../include/estructuras.h"
#include "../include/funciones.h"
#include "../include/menu.h"

using namespace std;

int main(int argc, char* argv[]) {
    getEnvVariable();

    string usuario = "";
    string password = "";
    string archivo = "";

    for (int i = 1; i < argc; i++) {
        string arg = argv[i];

        if (arg == "-u" && i + 1 < argc) {
            usuario = argv[++i];
        } else if (arg == "-p" && i + 1 < argc) {
            password = argv[++i];
        } else if (arg == "-f" && i + 1 < argc) {
            archivo = argv[++i];
        }
    }

    if (usuario.empty() || password.empty() || archivo.empty()) {
        cout << "Error: Debe ingresar usuario, password y archivo." << endl;
        cout << "Uso: ./programa -u <usuario> -p <password> -f <archivo>" << endl;
        return 1;
    }

    ListaUsuarios listaU;
    ListaPerfiles listaP;

    cargarUsuariosDesdeArchivo(listaU);
    cargarPerfilesDesdeArchivo(listaP);

    bool loginExitoso = false;
    string perfil = "";

    for (const auto& user : listaU.lista) {
        if (user.username == usuario && user.password == password) {
            loginExitoso = true;
            perfil = user.perfil;
            break;
        }
    }

    if (!loginExitoso) {
        cout << "Error: Usuario o Password incorrectos." << endl;
        return 1;
    }

    int opcion = -1;

    do {
        mostrarMenuPrincipal(usuario, perfil);
        cin >> opcion;

        if (cin.fail()) {
            cin.clear();
            cin.ignore(10000, '\n');
            cout << "Opcion no valida. Ingrese un numero." << endl;
            continue;
        }

        ejecutarOpcion(
            opcion,
            listaU,
            listaP,
            usuario,
            perfil,
            archivo
        );

    } while (opcion != 0);

    return 0;
}
