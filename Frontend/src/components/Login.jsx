import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import GradientWaves from "./ui/GradientWaves";


// Misma lógica de URL del backend que usa el login con Google (local -> :4003)
const obtenerBaseUrl = () => {
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const backendUrl = isLocal
    ? "http://localhost:4003"
    : import.meta.env.VITE_BACKEND_URL || "http://localhost:4003";

  return backendUrl.endsWith("/") ? backendUrl.slice(0, -1) : backendUrl;
};

const Login = () => {
  const navigate = useNavigate();

  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState("");
  const [mail, setMail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [repetirContrasena, setRepetirContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarRepetirContrasena, setMostrarRepetirContrasena] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (modoRegistro && contrasena !== repetirContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      const baseUrl = obtenerBaseUrl();
      const endpoint = modoRegistro
        ? `${baseUrl}/api/auth/register`
        : `${baseUrl}/api/auth/login`;

      const body = modoRegistro
        ? {
            name: nombre,
            mail,
            password: contrasena,
          }
        : {
            mail,
            password: contrasena,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.status) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        navigate("/proyectos");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Error del servidor");
    }
  };

  const cambiarModo = () => {
    setModoRegistro((actual) => !actual);
    setError(null);
  };

  const IconoOjo = ({ abierto }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      {abierto ? (
        <>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.58 10.58A2 2 0 0 0 13.42 13.42" />
          <path d="M9.88 5.08A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a16.68 16.68 0 0 1-3.7 5.12" />
          <path d="M6.61 6.61A15.74 15.74 0 0 0 2 12s3.5 7 10 7a11.12 11.12 0 0 0 5.39-1.61" />
        </>
      )}
    </svg>
  );

  const handleSuccess = async (credentialResponse) => {
    try {
      // Si estamos en local, enviamos la petición a nuestro backend local (puerto 4003)
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const backendUrl = isLocal 
        ? "http://localhost:4003" 
        : (import.meta.env.VITE_BACKEND_URL || "http://localhost:4003");

      const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;

      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await res.json();

      if (data.status) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        navigate("/proyectos");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Error del servidor");
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] px-0 py-0 text-white">
      <div className="flex min-h-screen w-full">
        {/* --- PANEL IZQUIERDO: botones de acceso --- */}
        <aside className="flex w-full max-w-[420px] flex-col justify-center border-r border-zinc-700/80 bg-black px-8 py-10 sm:px-10 lg:px-12">
          <div className="mb-8 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-[#007EFF]">
              NoiseMap
            </p>
          </div>

          <div className="flex w-full max-w-[280px] flex-col items-center justify-center space-y-3 self-center">
            <div className="flex w-full justify-center">
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() =>
                  setError("No fue posible iniciar sesión con Google.")
                }
                theme="filled_black"
                text="continue_with"
                shape="pill"
                size="large"
              />
            </div>

            {/*
            <button
              type="button"
              onClick={() =>
                setError(
                  "La conexión con Outlook se habilitará en una próxima versión."
                )
              }
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-[#171717] px-4 py-[14px] text-sm font-medium text-white transition-colors duration-200 hover:border-[#67f0d4] hover:text-white focus:outline-none"
            >
              Continuar con Outlook
            </button>
            */}
          </div>

          <div className="my-7 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.28em] text-zinc-500">
            <span className="h-px flex-1 bg-white/30" />
            o 
            <span className="h-px flex-1 bg-white/30" />
          </div>

          {/* --- FORMULARIO: login o registro según el modo --- */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {modoRegistro && (
              <input
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Nombre"
                className="w-full rounded-xl border border-white/10 bg-[#171717] px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#67f0d4] focus:ring-2 focus:ring-[#67f0d4]/20"
              />
            )}

            <input
              type="email"
              value={mail}
              onChange={(event) => setMail(event.target.value)}
              placeholder="Correo electrónico"
              className="w-full rounded-xl border border-white/10 bg-[#171717] px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#67f0d4] focus:ring-2 focus:ring-[#67f0d4]/20"
            />

            <div className="relative">
              <input
                type={mostrarContrasena ? "text" : "password"}
                value={contrasena}
                onChange={(event) => setContrasena(event.target.value)}
                placeholder="Contraseña"
                className="w-full rounded-xl border border-white/10 bg-[#171717] px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#67f0d4] focus:ring-2 focus:ring-[#67f0d4]/20"
              />
              <button
                type="button"
                onClick={() => setMostrarContrasena((actual) => !actual)}
                className="absolute inset-y-0 right-3 flex items-center text-zinc-400 transition hover:text-zinc-200"
                aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <IconoOjo abierto={mostrarContrasena} />
              </button>
            </div>

            {modoRegistro && (
              <div className="relative">
                <input
                  type={mostrarRepetirContrasena ? "text" : "password"}
                  value={repetirContrasena}
                  onChange={(event) => setRepetirContrasena(event.target.value)}
                  placeholder="Repetir contraseña"
                  className="w-full rounded-xl border border-white/10 bg-[#171717] px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#67f0d4] focus:ring-2 focus:ring-[#67f0d4]/20"
                />
                <button
                  type="button"
                  onClick={() => setMostrarRepetirContrasena((actual) => !actual)}
                  className="absolute inset-y-0 right-3 flex items-center text-zinc-400 transition hover:text-zinc-200"
                  aria-label={mostrarRepetirContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <IconoOjo abierto={mostrarRepetirContrasena} />
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#01296D] px-4 py-3 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            >
              {modoRegistro ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </form>

          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}

          <button
            type="button"
            onClick={cambiarModo}
            className="mt-6 block w-full text-center text-sm text-[#007EFF] transition hover:underline"
          >
            {modoRegistro
              ? "Ya tengo una cuenta"
              : "No tengo una cuenta, crear una"}
          </button>
        </aside>

        {/* --- PANEL DERECHO: fondo visual, sin contenedor grande --- */}
        <div className="relative hidden flex-1 overflow-hidden bg-black lg:block">
          <div className="relative flex h-full items-center justify-center px-12">
            <div className="max-w-lg text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.42em] text-[#007EFF]">
                NoiseMap
              </p>
              <h1 className="mt-8 text-4xl font-semibold leading-tight text-white">
                Mapas de ruido para decisiones más claras.
              </h1>

              <div className="mt-8 flex justify-center">
                <img
                  src="/icono.png"
                  alt="Icono de NoiseMap"
                  className="h-80 w-80 object-contain" /* Ajusta h-20 w-20 para cambiar el tamaño */
                />
              </div>

              {/* <p className="mt-5 text-sm leading-6 text-zinc-300">
                Organiza tus proyectos, delimita zonas de medición y prepara
                tus próximos análisis con una vista clara y profesional.
              </p>*/}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;