#include "../include/palindromo.h"
#include <cctype>

using namespace std;

bool esPalindromo(const string &texto) {
    string limpio;
    limpio.reserve(texto.size());

    for (unsigned char c : texto) {
        if (isalnum(c)) {
            limpio += (char)tolower(c);
        }
    }
    if (limpio.empty()) return false;
    string invertido(limpio.rbegin(), limpio.rend());
    return limpio == invertido;
}
