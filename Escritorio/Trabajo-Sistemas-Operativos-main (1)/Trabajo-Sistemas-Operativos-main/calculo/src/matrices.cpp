#include "../include/matrices.h"
#include <fstream>
#include <sstream>

using namespace std;

ResultadoLecturaMatriz leerMatrizDesdeArchivo(const string &path, char separador) {
    ResultadoLecturaMatriz r;
    r.ok = false;

    ifstream file(path);
    if (!file.is_open()) {
        r.error = "No se pudo abrir el archivo " + path;
        return r;
    }

    string linea;
    int columnasEsperadas = 0;
    int numFila = 0;

    while (getline(file, linea)) {
        numFila++;
        if (linea.empty()) continue;

        vector<double> fila;
        stringstream ss(linea);
        string token;

        while (getline(ss, token, separador)) {
            if (token.empty()) continue;

            double valor = atof(token.c_str());
            fila.push_back(valor);
        }

        if (fila.empty()) continue;

        if (r.datos.empty()) {
            columnasEsperadas = fila.size();
        } else if (fila.size() != columnasEsperadas) {
            r.error = "Formato invalido en '" + path;
            return r;
        }

        r.datos.push_back(fila);
    }

    if (r.datos.empty()) {
        r.error = "El archivo '" + path + "' tiene algun dato inválido";
        return r;
    }

    r.ok = true;
    return r;
}

ResultadoMultiplicacion multiplicarMatrices(const Matriz &A, const Matriz &B) {
    ResultadoMultiplicacion r;
    r.ok = false;
    if (A.empty() || B.empty()) {
        r.error = "Error, una de las matrices esta vacia";
        return r;
    }

    int filasA = A.size();
    int colsA = A[0].size();
    int filasB = B.size();
    int colsB = B[0].size();

    if (colsA != filasB) {
        r.error = "No se puede multiplicar (reglas de mult de matrices)";
        return r;
    }
    Matriz res(filasA, vector<double>(colsB, 0.0));

    for (int i = 0; i < filasA; i++) {
        for (int j = 0; j < colsB; j++) {
            for (int k = 0; k < colsA; k++) {
                res[i][j] += A[i][k] * B[k][j];
            }
        }
    }

    r.datos = res;
    r.ok = true;
    return r;
}