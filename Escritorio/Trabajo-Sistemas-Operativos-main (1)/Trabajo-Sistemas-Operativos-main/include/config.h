#ifndef CONFIG_H
#define CONFIG_H

#include <string>
#include <iostream>
#include <fstream>
#include <sstream>

int guardarEnv(const char* key, const char* valor, int overwrite);
void getEnvVariable();
void leerArchivo(const char* path);

#endif