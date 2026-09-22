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
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

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
    <main className="relative min-h-screen overflow-hidden bg-dash-bg px-6 py-12 font-sans text-dash-text">
      {/* Fondo animado en WebGL — capa a pantalla completa, detrás del recuadro de login */}
      <div className="absolute inset-0 z-0">
        <GradientWaves
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
        />
      </div>

      <div className="relative z-10 mx-auto grid max-w-5xl overflow-hidden border border-dash-border bg-dash-surface md:grid-cols-[1.05fr_0.95fr]">

        <section className="hidden flex-col justify-between bg-dash-accent p-10 text-dash-bg md:flex">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">
              NoiseMap
            </p>

            <h1 className="mt-20 max-w-sm text-4xl font-semibold leading-tight">
              Mapas de ruido para decisiones más claras.
            </h1>
          </div>

          <p className="max-w-sm text-sm leading-6 opacity-75">
            Organiza tus proyectos, delimita zonas de medición y prepara tus
            próximos análisis.
          </p>
        </section>

        <section className="p-7 sm:p-10">

          <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-dash-accent">
            {modoRegistro ? "Crear cuenta" : "Bienvenido"}
          </p>

          <h2 className="text-3xl font-semibold">
            {modoRegistro ? "Comienza tu espacio" : "Inicia sesión"}
          </h2>

          <p className="mt-2 text-sm text-dash-text-soft">
            Usa una cuenta externa o entra con tu correo y contraseña.
          </p>

          <div className="mt-7 space-y-3">

            <div className="flex justify-center rounded border border-dash-border bg-white p-3">
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
              className="w-full border border-dash-border px-4 py-3 text-sm font-medium text-dash-text transition-colors hover:border-dash-accent"
            >
              Continuar con Outlook
            </button>

          </div>

          <div className="my-7 flex items-center gap-3 text-xs text-dash-text-soft">
            <span className="h-px flex-1 bg-dash-border" />
            o con correo
            <span className="h-px flex-1 bg-dash-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {modoRegistro && (
              <input
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Nombre"
                className="w-full border border-dash-border bg-transparent px-3 py-3 text-sm outline-none focus:border-dash-accent"
              />
            )}

            <input
              type="email"
              value={mail}
              onChange={(event) => setMail(event.target.value)}
              placeholder="Correo electrónico"
              className="w-full border border-dash-border bg-transparent px-3 py-3 text-sm outline-none focus:border-dash-accent"
            />

            <input
              type="password"
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              placeholder="Contraseña"
              className="w-full border border-dash-border bg-transparent px-3 py-3 text-sm outline-none focus:border-dash-accent"
            />

            <button
              type="submit"
              className="w-full bg-dash-accent px-4 py-3 text-sm font-semibold text-dash-bg transition-opacity hover:opacity-90"
            >
              {modoRegistro ? "Crear cuenta" : "Iniciar sesión"}
            </button>

          </form>

          {error && (
            <p className="mt-4 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={cambiarModo}
            className="mt-6 text-sm text-dash-accent hover:underline"
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