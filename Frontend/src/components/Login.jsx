// Frontend/src/components/Login.jsx
import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [modoRegistro, setModoRegistro] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);

  const iniciarSesionDemo = (event) => {
    event.preventDefault();

    if (usuario !== "admin" || contrasena !== "123") {
      setError("Para la demo usa admin y 123.");
      return;
    }

    localStorage.setItem("token", "demo-token");
    localStorage.setItem("user", JSON.stringify({ nombre: "Administrador" }));
    navigate("/proyectos");
  };

  const cambiarModo = () => {
    setModoRegistro((actual) => !actual);
    setError(null);
  };

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch("http://localhost:4009/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
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
      setError("error del server");
    }
  };

  return (
    <main className="min-h-screen bg-dash-bg px-6 py-12 font-sans text-dash-text">
      <div className="mx-auto grid max-w-5xl overflow-hidden border border-dash-border bg-dash-surface md:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between bg-dash-accent p-10 text-dash-bg md:flex">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">NoiseMap</p>
            <h1 className="mt-20 max-w-sm text-4xl font-semibold leading-tight">Mapas de ruido para decisiones más claras.</h1>
          </div>
          <p className="max-w-sm text-sm leading-6 opacity-75">Organiza tus proyectos, delimita zonas de medición y prepara tus próximos análisis.</p>
        </section>

        <section className="p-7 sm:p-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-dash-accent">{modoRegistro ? "Crear cuenta" : "Bienvenido"}</p>
          <h2 className="text-3xl font-semibold">{modoRegistro ? "Comienza tu espacio" : "Inicia sesión"}</h2>
          <p className="mt-2 text-sm text-dash-text-soft">Usa una cuenta externa o entra con el acceso de prueba.</p>

          <div className="mt-7 space-y-3">
            <div className="flex justify-center rounded border border-dash-border bg-white p-3">
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => setError("No fue posible iniciar sesión con Google.")}
              />
            </div>
            <button type="button" onClick={() => setError("La conexión con Outlook se habilitará en una próxima versión.")} className="w-full border border-dash-border px-4 py-3 text-sm font-medium text-dash-text transition-colors hover:border-dash-accent">
              Continuar con Outlook
            </button>
          </div>

          <div className="my-7 flex items-center gap-3 text-xs text-dash-text-soft"><span className="h-px flex-1 bg-dash-border" />o acceso de prueba<span className="h-px flex-1 bg-dash-border" /></div>

          <form onSubmit={iniciarSesionDemo} className="space-y-4">
            <input value={usuario} onChange={(event) => setUsuario(event.target.value)} placeholder="Usuario" className="w-full border border-dash-border bg-transparent px-3 py-3 text-sm outline-none focus:border-dash-accent" />
            <input type="password" value={contrasena} onChange={(event) => setContrasena(event.target.value)} placeholder="Contraseña" className="w-full border border-dash-border bg-transparent px-3 py-3 text-sm outline-none focus:border-dash-accent" />
            <button type="submit" className="w-full bg-dash-accent px-4 py-3 text-sm font-semibold text-dash-bg transition-opacity hover:opacity-90">{modoRegistro ? "Crear cuenta de prueba" : "Entrar con usuario"}</button>
          </form>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          <button type="button" onClick={cambiarModo} className="mt-6 text-sm text-dash-accent hover:underline">{modoRegistro ? "Ya tengo una cuenta" : "No tengo una cuenta, crear una"}</button>
        </section>
      </div>
    </main>
  );
};

export default Login;