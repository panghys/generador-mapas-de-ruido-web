#include <string>
#include <iostream>
#include <fstream>
#include <sstream>
#include <cstdlib>
#include "../include/config.h"

using namespace std;

void getEnvVariable(){
    ifstream file(".env");
    if(!file.is_open()) {
        cerr << "No se pudo obtener el archivo .env" << endl;
    } else {
        string linea;
        while(getline(file, linea)){
            size_t l = linea.find('=');
            if(l != string::npos){
                string fst = linea.substr(0, l);
                string snd = linea.substr(l + 1);
                guardarEnv(fst.c_str(), snd.c_str(), 1);
            }
        }
    }
}

int guardarEnv(const char* key, const char* valor, int overwrite){
    #ifdef _WIN32
        return _putenv_s(key, valor);
    #else
        return setenv(key, valor, overwrite);
    #endif
}

void leerArchivo(const char* path){
    if (!path) return;
    ifstream file(path);
    if(!file.is_open()){
        cout << "No se pudo abrir el archivo." << endl;
        return;
    }
    string linea;
    while(getline(file, linea)){
        cout << linea << endl;
    }
}