#ifndef CALC_MATRICES_H
#define CALC_MATRICES_H

#include <string>
#include <vector>

using Matriz = std::vector<std::vector<double>>;

struct ResultadoLecturaMatriz {
    Matriz datos;
    bool ok = false;
    std::string error;
};

struct ResultadoMultiplicacion {
    Matriz datos;
    bool ok = false;
    std::string error;
};
ResultadoLecturaMatriz leerMatrizDesdeArchivo(const std::string &path, char separador);
ResultadoMultiplicacion multiplicarMatrices(const Matriz &A, const Matriz &B);

#endif
