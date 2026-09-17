#include <iostream>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <cstring>
#include "include/matrices.h"
#include "../include/estructuras.h"

using namespace std;

bool existeUsuario(const string &usuario) {
    ifstream file("data/USUARIOS.TXT", ios::binary);
    if (!file.is_open()) return false;

    bool reading = true;
    while (reading) {
        Usuario u;
        strcpy(u.nombre, "empty");
        file.read((char*)&u, sizeof(Usuario));

        if (!file || string(u.nombre) == "empty") {
            reading = false;
            break;
        }

        if (string(u.username) == usuario) {
            return true;
        }
    }
    return false;
}

bool existePerfil(const string &perfil) {
    ifstream file("data/PERFILES.TXT", ios::binary);
    if (!file.is_open()) return false;

    bool reading = true;
    while (reading) {
        Perfil p;
        strcpy(p.nombre, "empty");
        file.read((char*)&p, sizeof(Perfil));

        if (!file || string(p.nombre) == "empty") {
            reading = false;
            break;
        }

        if (string(p.nombre) == perfil) {
            return true;
        }
    }
    return false;
}

void imprimirMatriz(const Matriz &m) {
    cout << fixed << setprecision(2);
    for (int i = 0; i < m.size(); i++) {
        for (int j = 0; j < m[i].size(); j++) {
            cout << m[i][j];
            if (j + 1 < m[i].size()) {
                cout << "\t";
            }
        }
        cout << "\n";
    }
}

int main(int argc, char *argv[]) {

    string pathA = argv[1];
    string pathB = argv[2];
    string separadorStr = argv[3];
    string usuario = argv[4];
    string perfil = argv[5];

    if (usuario == "" || perfil == "") {
        cerr << "Error: El usuario y el perfil no pueden estar vacios.." << endl;
        return 1;
    }

    // Validacion contra archivos TXT de data/
    if (!existeUsuario(usuario)) {
        cerr << "Error: El usuario '" << usuario << "' no existe!" << endl;
        return 1;
    }

    if (!existePerfil(perfil)) {
        cerr << "Error: El perfil '" << perfil << "' no existe!" << endl;
        return 1;
    }

    if (separadorStr.empty()) {
        cerr << "El separador no puede ser vacio!!" << endl;
        return 1;
    }
    char separador = separadorStr[0];

    cout << "===========================================" << endl;
    cout << "     MULTIPLICADOR DE MATRICES NxM !!!        " << endl;
    cout << "===========================================" << endl;
    cout << "Usuario: " << usuario << " | Perfil: " << perfil << endl;
    cout << "-------------------------------------------" << endl;

    ResultadoLecturaMatriz lecturaA = leerMatrizDesdeArchivo(pathA, separador);
    if (!lecturaA.ok) {
        cerr << "Error al leer la primera matriz: " << lecturaA.error << endl;
        return 1;
    }

    ResultadoLecturaMatriz lecturaB = leerMatrizDesdeArchivo(pathB, separador);
    if (!lecturaB.ok) {
        cerr << "Error al leer la segunda matri" << lecturaB.error << endl;
        return 1;
    }

    Matriz A = lecturaA.datos;
    Matriz B = lecturaB.datos;

    cout << "Matriz A (" << A.size() << "x" << A[0].size() << "):" << endl;
    imprimirMatriz(A);
    cout << "Matriz B (" << B.size() << "x" << B[0].size() << "):" << endl;
    imprimirMatriz(B);

    ResultadoMultiplicacion resultado = multiplicarMatrices(A, B);
    if (!resultado.ok) {
        cerr << "Error: " << resultado.error << endl;
        return 1;
    }

    cout << "Resultado A x B (" << resultado.datos.size() << "x"
         << resultado.datos[0].size() << "):" << endl;
    imprimirMatriz(resultado.datos);

    return 0;
}