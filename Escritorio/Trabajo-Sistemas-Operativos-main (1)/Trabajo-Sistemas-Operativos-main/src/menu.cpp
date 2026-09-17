#include <iostream>
#include <fstream>
#include <cctype>

#include "../include/config.h"
#include "../include/estructuras.h"
#include "../include/funciones.h"
#include "../include/menu.h"
#include "../calculo/include/palindromo.h"
#include "../calculo/include/fx.h"

using namespace std;

#ifdef _WIN32
const string PREFIJO_EJECUTABLE = ""; // Esto es necesario para correr los programas aparte en linux igual
#else
const string PREFIJO_EJECUTABLE = "./";
#endif

void mostrarMenuPrincipal(const string &usuario, const string &perfil) {
    cout << "\n===================================\n";
    cout << "        SISTEMA DE GESTION\n";
    cout << "===================================\n";
    cout << "Usuario: " << usuario << " | Perfil: " << perfil << endl;
    cout << "===================================\n";
    cout << "1. Admin de usuarios y perfiles\n";
    cout << "2. Multiplica matrices NxM\n";
    cout << "3. Juego (En construccion)\n";
    cout << "4. Es palindromo?\n";
    cout << "5. Calcular f(x) = x^2 + 2x + 8\n";
    cout << "6. CONTEO SOBRE TEXTO\n";
    cout << "7. CONTEO SOBRE ARCHIVO\n";
    cout << "-----------------------------------\n";
    cout << "0. Salir\n";
    cout << "===================================\n";
    cout << "Seleccione una opcion: ";
}

void realizarConteoArchivo(const string &rutaArchivo) {
    ifstream file(rutaArchivo);

    if (!file.is_open()) {
        cout << "Error: No se pudo abrir el archivo: " << rutaArchivo << endl;
        return;
    }

    int vocales = 0;
    int consonantes = 0;
    int especiales = 0;
    int palabras = 0;

    char c;

    while (file.get(c)) {
        if (isalpha(c)) {
            char lower = tolower(c);

            if (lower == 'a' || lower == 'e' || lower == 'i' ||
                lower == 'o' || lower == 'u') {
                vocales++;
            } else {
                consonantes++;
            }
        } else if (!isspace(c)) {
            especiales++;
        }
    }

    file.clear();
    file.seekg(0);

    string palabra;

    while (file >> palabra) {
        palabras++;
    }

    file.close();

    cout << "--- Resultados del Conteo ---" << endl;
    cout << "Vocales: " << vocales << endl;
    cout << "Consonantes: " << consonantes << endl;
    cout << "Caracteres especiales: " << especiales << endl;
    cout << "Palabras: " << palabras << endl;
}

void ejecutarOpcion(
    int opcion,
    ListaUsuarios &lUsers,
    ListaPerfiles &lProfiles,
    const string &usuario,
    const string &perfil,
    const string &archivo
) {
    switch (opcion) {
        case 1: {
            if (perfil != "ADMIN") {
                cout << "Error: Acceso denegado. Solo los usuarios con perfil ADMIN pueden entrar aqui." << endl;
            } else {
                string comando = PREFIJO_EJECUTABLE +
                    "admin.exe \"" + usuario + "\" \"" + perfil + "\"";

                cout << "\nLlamando al programa externo..." << endl;
                system(comando.c_str());
            }
            break;
        }

        case 2: {
            cout << "\n--- MULTIPLICANDO MATRICES NxM ---" << endl;

            string rutaA;
            string rutaB;
            string separador;

            cout << "Ingrese la ruta de la Matriz A: ";
            cin >> rutaA;

            cout << "Ingrese la ruta de la Matriz B: ";
            cin >> rutaB;

            cout << "Ingrese el caracter separador: ";
            cin >> separador;

            string comando = PREFIJO_EJECUTABLE +
                "multi.exe \"" + rutaA + "\" \"" + rutaB + "\" \"" +
                separador + "\" \"" + usuario + "\" \"" + perfil + "\"";

            cout << "\nLlamando al programa externo..." << endl;
            system(comando.c_str());

            break;
        }

        case 3: {
            cout << "\n--- JUEGO ---" << endl;
            cout << "Mensaje: En construccion" << endl;
            break;
        }

        case 4: {
            cout << "\n--- ES PALINDROMO? ---" << endl;
            cout << "1. Validar un texto" << endl;
            cout << "2. Cancelar" << endl;
            cout << "Opcion: ";

            int opcionPalindromo;
            cin >> opcionPalindromo;
            cin.ignore();

            if (opcionPalindromo == 1) {
                cout << "Ingrese el texto a validar: ";

                string texto;
                getline(cin, texto);

                if (esPalindromo(texto)) {
                    cout << "\nResultado: El texto SI es un palindromo." << endl;
                } else {
                    cout << "\nResultado: El texto NO es un palindromo." << endl;
                }
            } else {
                cout << "Operacion cancelada." << endl;
            }

            break;
        }

        case 5: {
            cout << "\n--- CALCULAR f(x) = x*x + 2x + 8 ---" << endl;
            cout << "Ingrese el valor de X: ";

            double x;
            cin >> x;

            cout << "\nf(" << x << ") = (" << x << "*" << x
                 << ") + (2*" << x << ") + 8" << endl;

            cout << "Resultado: " << calcularFx(x) << endl;

            cout << "\nPresione Enter para VOLVER...";
            cin.ignore();
            cin.get();

            break;
        }

        case 6: {
            cout << "\n--- CONTEO SOBRE TEXTO ---" << endl;
            cout << "Archivo: " << archivo << endl;

            realizarConteoArchivo(archivo);

            cout << "\nPresione Enter para VOLVER...";
            cin.ignore();
            cin.get();

            break;
        }

        case 7: {
            cout << "\n--- CONTEO SOBRE ARCHIVO ---" << endl;
            cout << "Ingrese la ruta del archivo: ";

            string ruta;
            cin >> ruta;

            realizarConteoArchivo(ruta);

            cout << "\nPresione Enter para VOLVER...";
            cin.ignore();
            cin.get();

            break;
        }
    }
}