CXX = g++
CXXFLAGS = -Wall -std=c++17 -Iinclude -Icalculo/include

SRCS_MAIN = src/main.cpp \
            src/config.cpp \
            src/funcionesUsuarios.cpp \
            src/funcionesPerfiles.cpp \
            src/menu.cpp \
            calculo/src/palindromo.cpp \
            calculo/src/fx.cpp

SRCS_MULTI = calculo/mainMatrices.cpp \
             calculo/src/matrices.cpp

SRCS_ADMIN = src/mainAdmin.cpp \
             src/config.cpp \
             src/funcionesUsuarios.cpp \
             src/funcionesPerfiles.cpp

TARGET_MAIN = main.exe
TARGET_MULTI = multi.exe
TARGET_ADMIN = admin.exe

all: $(TARGET_MAIN) $(TARGET_MULTI) $(TARGET_ADMIN)

#compila el menu
$(TARGET_MAIN): $(SRCS_MAIN)
	$(CXX) $(CXXFLAGS) $(SRCS_MAIN) -o $(TARGET_MAIN)

#compila el codigo de las matrices
$(TARGET_MULTI): $(SRCS_MULTI)
	$(CXX) $(CXXFLAGS) $(SRCS_MULTI) -o $(TARGET_MULTI)

#compila la administracion de usuarios y perfiles
$(TARGET_ADMIN): $(SRCS_ADMIN)
	$(CXX) $(CXXFLAGS) $(SRCS_ADMIN) -o $(TARGET_ADMIN)

clean:
	rm -f $(TARGET_MAIN) $(TARGET_MULTI) $(TARGET_ADMIN)