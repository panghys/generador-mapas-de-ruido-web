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
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (modoRegistro) {
      if (!nombre.trim() || !mail.trim() || !contrasena.trim() || !confirmarContrasena.trim()) {
        setError("Completa los datos solicitados");
        return;
      }
      if (contrasena !== confirmarContrasena) {
        setError("Las contraseñas no coinciden");
        return;
      }
    } else {
      if (!mail.trim() || !contrasena.trim()) {
        setError("Completa los datos solicitados");
        return;
      }
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
    setConfirmarContrasena("");
  };

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
    <main className="relative min-h-screen overflow-hidden bg-[#D1DDF2] px-6 py-12 font-sans text-dash-text">
      {/* Manual de usuario — esquina superior derecha */}
      <a
        href="/Manual_de_usuario.pdf"
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir el manual de usuario"
        className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-[#243B53] shadow-sm transition-colors hover:border-[#1C5DAC] hover:text-[#1C5DAC] sm:right-6 sm:top-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        Manual de usuario
      </a>

      {/* Fondo animado en WebGL — capa a pantalla completa, detrás del recuadro de login */}
      <div className="absolute inset-0 z-0">
        {/* <GradientWaves
          horizonColor="#00dfc3"
          waveColor="#000000"
          crestColor="#e8e8e8"
          speed={0.55}
          amplitude={2.5}
          waveScale={0.65}
          swell={30}
          turbulence={20}
          tilt={1.15}
          zoom={1.1}
          height={5}
          fogDepth={16}
          detail="medium"
          brightness={0.85}
          opacity={0.9}
          mouseInteraction
          parallaxStrength={0.35}
          grain
          grainIntensity={0.04}
        />*/}
      </div>

      <div className="relative z-10 mx-auto grid max-w-5xl overflow-hidden border border-slate-300 rounded-lg bg-white md:grid-cols-[1.05fr_0.95fr]">

        <section
          className="hidden flex-col justify-between bg-cover bg-center p-10 text-white md:flex"
          style={{
            backgroundImage:
              'linear-gradient(rgba(5, 20, 26, 0.35), rgba(5, 20, 26, 0.35)), url("/portada.png")',
          }}
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">
              NoiseMap
            </p>

            <h1 className="mt-20 max-w-sm text-4xl font-semibold leading-tight">
              Mapas de ruido para decisiones más claras.
            </h1>
          </div>

          <p className="max-w-sm text-sm leading-6 opacity-75">
            Organiza tus proyectos, delimita zonas de medición y calcula tu propio mapa de ruido.
          </p>
        </section>

        <section className="bg-white p-7 text-[#052B59] sm:p-10">

          <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-[#1C5DAC]">
            {modoRegistro ? "Crear cuenta" : "Bienvenido"}
          </p>

          <h2 className="text-3xl font-semibold">
            {modoRegistro ? "Comienza tu espacio" : "Inicia sesión"}
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Usa una cuenta externa o ingresa con tu correo y contraseña.
          </p>

          <div className="mt-7 space-y-3">

            <div className="flex justify-center rounded border border-slate-300 bg-white p-3">
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() =>
                  setError("No fue posible iniciar sesión con Google.")
                }
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setError(
                  "La conexión con Outlook se habilitará en una próxima versión."
                )
              }
              className="w-full border border-slate-300 px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-[#1C5DAC]"
            >
              Continuar con Outlook
            </button>

          </div>

          <div className="my-7 flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-200" />
            o con correo
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {modoRegistro && (
              <input
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Nombre"
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1C5DAC]"
              />
            )}

            <input
              type="email"
              value={mail}
              onChange={(event) => setMail(event.target.value)}
              placeholder="Correo electrónico"
              className="w-full border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1C5DAC]"
            />

            <input
              type="password"
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              placeholder="Contraseña"
              className="w-full border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1C5DAC]"
            />

            {modoRegistro && (
              <input
                type="password"
                value={confirmarContrasena}
                onChange={(event) => setConfirmarContrasena(event.target.value)}
                placeholder="Confirmar contraseña"
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1C5DAC]"
              />
            )}

            <button
              type="submit"
              className="w-full bg-[#1C5DAC] px-4 py-3 text-sm font-semibold text-white transition-opacity rounded-lg hover:opacity-90"
            >
              {modoRegistro ? "Crear cuenta" : "Iniciar sesión"}
            </button>

          </form>

          {error && (
            <p className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={cambiarModo}
            className="mt-6 text-sm text-[#243B53] hover:underline"
          >
            {modoRegistro
              ? "Ya tengo una cuenta"
              : "No tengo una cuenta, crear una"}
          </button>

        </section>
      </div>
    </main>
  );
};

export default Login;