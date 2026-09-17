#include <iostream>
#include "../include/config.h"
#include "../include/estructuras.h"
#include "../include/funciones.h"

using namespace std;

int main(int argc, char* argv[]) {
    getEnvVariable();

    string usuario = (argc > 1) ? argv[1] : "";
    string perfil = (argc > 2) ? argv[2] : "";

    ListaUsuarios listaU;
    ListaPerfiles listaP;

    int subOpcion = -1;
    do {
        cout << "\n===================================" << endl;
        cout << "  ADMINISTRACION DE USUARIOS Y PERFILES  " << endl;
        cout << "===================================" << endl;
        cout << "Usuario: " << usuario << " | Perfil: " << perfil << endl;
        cout << "===================================" << endl;
        cout << "1. Listar Usuarios" << endl;
        cout << "2. Ingresar Usuario" << endl;
        cout << "3. Eliminar Usuario por ID" << endl;
        cout << "-----------------------------------" << endl;
        cout << "4. Listar Perfiles" << endl;
        cout << "5. Ingresar / Modificar Perfil" << endl;
        cout << "6. Eliminar Perfil" << endl;
        cout << "-----------------------------------" << endl;
        cout << "0. Volver al Menu Principal" << endl;
        cout << "Seleccione una opcion: ";

        cin >> subOpcion;

        if (cin.fail()) {
            cin.clear();
            cin.ignore(10000, '\n');
            cout << "Opcion no valida. Ingrese un numero." << endl;
            continue;
        }

        switch (subOpcion) {
            case 1:{
                listarUsuarios(listaU);
                break;
            }

            case 2:{
                ingresarUsuario(listaU);
                break;
            }

            case 3: {
                cout << "Ingrese el ID del usuario a eliminar: ";
                int id;
                cin >> id;
                eliminarUsuario(id, listaU);
                break;
            }

            case 4:{
                listarPerfiles(listaP);
                break;
            }

            case 5:{
                ingresarPerfil(listaP);
                break;
            }

            case 6: {
                cout << "Ingrese el nombre del perfil a eliminar: ";
                string nombrePerfil;
                cin >> nombrePerfil;
                eliminarPerfil(nombrePerfil, listaP);
                break;
            }

            case 0:{
                cout << "Volviendo al Menu Principal..." << endl;
                break;
            }

            default:{
                cout << "Opcion no valida. Intente nuevamente." << endl;
                break;
            }
        }
    } while (subOpcion != 0);

    return 0;
}