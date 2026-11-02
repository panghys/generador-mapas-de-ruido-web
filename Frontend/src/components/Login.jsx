
import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import Topography from "./ui/Topography";

// Mantiene la conexión actual con el Backend.
const obtenerBaseUrl = () => {
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const backendUrl = isLocal
    ? "http://localhost:4003"
    : import.meta.env.VITE_BACKEND_URL || "http://localhost:4003";

  return backendUrl.endsWith("/")
    ? backendUrl.slice(0, -1)
    : backendUrl;
};

const Login = () => {
  const navigate = useNavigate();

  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState("");
  const [mail, setMail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] =
    useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (modoRegistro) {
      if (
        !nombre.trim() ||
        !mail.trim() ||
        !contrasena.trim() ||
        !confirmarContrasena.trim()
      ) {
        setError("Completa los datos solicitados");
        return;
      }

      if (contrasena !== confirmarContrasena) {
        setError("Las contraseñas no coinciden");
        return;
      }
    } else if (!mail.trim() || !contrasena.trim()) {
      setError("Completa los datos solicitados");
      return;
    }

    try {
      const baseUrl = obtenerBaseUrl();

      const endpoint = modoRegistro
        ? `${baseUrl}/api/auth/register`
        : `${baseUrl}/api/auth/login`;

      const body = modoRegistro
        ? { name: nombre, mail, password: contrasena }
        : { mail, password: contrasena };

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
        localStorage.setItem(
          "user",
          JSON.stringify(data.data.user)
        );

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
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      const backendUrl = isLocal
        ? "http://localhost:4003"
        : import.meta.env.VITE_BACKEND_URL ||
          "http://localhost:4003";

      const baseUrl = backendUrl.endsWith("/")
        ? backendUrl.slice(0, -1)
        : backendUrl;

      const res = await fetch(
        `${baseUrl}/api/auth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
          }),
        }
      );

      const data = await res.json();

      if (data.status) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify(data.data.user)
        );

        navigate("/proyectos");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Error del servidor");
    }
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#F4F7FA] px-4 py-12 font-sans text-[#243447] sm:px-6 lg:py-16">

      {/* FONDO ANIMADO TOPOGRAPHY */}
      {/* Siempre detrás del contenido y sin captar clics */}

      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <Topography
          className="h-full w-full"
          color="#155B91"
          lightMode
          opacity={3}
          brightness={1}
          glow={0.25}
          lineCount={26}
          lineWidth={1.1}
          majorLines
          elevation={0.85}
          tilt={38}
          speed={0.25}
          direction="forward"
          scale={1.1}
          fog={0.35}
          mouseInteraction={false}
          intro={false}
          markers="none"
          dpr={1}
        />
      </div>

      {/* MANUAL DE USUARIO */}

      <a
        href="/Manual_de_usuario.pdf"
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir el manual de usuario"
        className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-xl border border-[#DCE5EC] bg-white px-4 py-2.5 text-xs font-bold text-[#155B91] shadow-sm transition-all hover:border-[#9DC5DD] hover:bg-[#F6FAFC] sm:right-7 sm:top-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        Manual de usuario
      </a>

      {/* ENCABEZADO */}

      <div className="relative z-10 mx-auto mb-8 mt-8 max-w-6xl sm:mt-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#287EAB]">
          Plataforma de cartografía acústica
        </p>

        <h1 className="text-2xl font-extrabold tracking-tight text-[#153C5B] sm:text-3xl">
          NoiseMap
        </h1>
      </div>

      {/* TARJETA PRINCIPAL */}
      {/* Fondo blanco para que Topography no tape el login */}

      <div className="relative z-10 mx-auto grid max-w-6xl overflow-hidden rounded-2xl border border-[#DCE5EC] bg-white shadow-[0_22px_60px_rgba(19,54,83,0.13)] md:grid-cols-[1.02fr_0.98fr]">

        {/* SECCIÓN IZQUIERDA: IMAGEN ORIGINAL */}

        <section
          className="relative hidden min-h-[600px] flex-col justify-between bg-cover bg-center p-10 text-white md:flex lg:p-12"
          style={{
            backgroundImage: 'url("/portada.png")',
          }}
        >
          <div>
            <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#DDEEF9]">
              Estudios acústicos
            </p>

            <h2 className="mt-20 max-w-md text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
              Mapas de ruido para decisiones más claras.
            </h2>
          </div>

          <div>
            <div className="mb-5 h-1 w-16 rounded-full bg-[#79BAD9]" />

            <p className="max-w-sm text-sm leading-7 text-[#E1EFF7]">
              Organiza tus proyectos, delimita zonas de
              medición y calcula tu propio mapa de ruido.
            </p>
          </div>
        </section>

        {/* SECCIÓN DERECHA: LOGIN */}

        <section className="px-6 py-9 sm:px-10 sm:py-12 lg:px-12">

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.17em] text-[#287EAB]">
            {modoRegistro
              ? "Registro de usuario"
              : "Acceso a la plataforma"}
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight text-[#153C5B]">
            {modoRegistro
              ? "Crear cuenta"
              : "Iniciar sesión"}
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#718397]">
            Usa una cuenta externa o ingresa con tu correo
            y contraseña.
          </p>

          {/* GOOGLE Y OUTLOOK */}

          <div className="mt-8 space-y-3">

            <div className="flex min-h-[58px] items-center justify-center rounded-xl border border-[#DCE5EC] bg-[#FAFCFE] p-3">
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() =>
                  setError(
                    "No fue posible iniciar sesión con Google."
                  )
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
              className="w-full rounded-xl border border-[#D6E2EA] bg-white px-4 py-3 text-sm font-semibold text-[#52697C] transition-all hover:border-[#9DC5DD] hover:bg-[#F2F8FC] hover:text-[#155B91]"
            >
              Continuar con Outlook
            </button>
          </div>

          <div className="my-7 flex items-center gap-3 text-xs font-medium text-[#8A9BA9]">
            <span className="h-px flex-1 bg-[#E4ECF2]" />
            o con correo
            <span className="h-px flex-1 bg-[#E4ECF2]" />
          </div>

          {/* FORMULARIO */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {modoRegistro && (
              <label className="block text-xs font-bold text-[#52697C]">
                Nombre

                <input
                  value={nombre}
                  onChange={(event) =>
                    setNombre(event.target.value)
                  }
                  placeholder="Nombre"
                  className="mt-2 w-full rounded-xl border border-[#D6E2EA] bg-[#FAFCFE] px-4 py-3 text-sm font-normal text-[#243447] outline-none transition-all placeholder:text-[#9BAAB6] focus:border-[#287EAB] focus:bg-white focus:ring-4 focus:ring-[#287EAB]/10"
                />
              </label>
            )}

            <label className="block text-xs font-bold text-[#52697C]">
              Correo electrónico

              <input
                type="email"
                value={mail}
                onChange={(event) =>
                  setMail(event.target.value)
                }
                placeholder="correo@ejemplo.cl"
                className="mt-2 w-full rounded-xl border border-[#D6E2EA] bg-[#FAFCFE] px-4 py-3 text-sm font-normal text-[#243447] outline-none transition-all placeholder:text-[#9BAAB6] focus:border-[#287EAB] focus:bg-white focus:ring-4 focus:ring-[#287EAB]/10"
              />
            </label>

            <label className="block text-xs font-bold text-[#52697C]">
              Contraseña

              <input
                type="password"
                value={contrasena}
                onChange={(event) =>
                  setContrasena(event.target.value)
                }
                placeholder="Contraseña"
                className="mt-2 w-full rounded-xl border border-[#D6E2EA] bg-[#FAFCFE] px-4 py-3 text-sm font-normal text-[#243447] outline-none transition-all placeholder:text-[#9BAAB6] focus:border-[#287EAB] focus:bg-white focus:ring-4 focus:ring-[#287EAB]/10"
              />
            </label>

            {modoRegistro && (
              <label className="block text-xs font-bold text-[#52697C]">
                Confirmar contraseña

                <input
                  type="password"
                  value={confirmarContrasena}
                  onChange={(event) =>
                    setConfirmarContrasena(event.target.value)
                  }
                  placeholder="Confirmar contraseña"
                  className="mt-2 w-full rounded-xl border border-[#D6E2EA] bg-[#FAFCFE] px-4 py-3 text-sm font-normal text-[#243447] outline-none transition-all placeholder:text-[#9BAAB6] focus:border-[#287EAB] focus:bg-white focus:ring-4 focus:ring-[#287EAB]/10"
                />
              </label>
            )}

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-[#155B91] px-5 py-3.5 text-sm font-bold text-white shadow-[0_7px_18px_rgba(21,91,145,0.2)] transition-all hover:bg-[#104A75] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[#155B91] focus-visible:ring-offset-2"
            >
              {modoRegistro
                ? "Crear cuenta"
                : "Iniciar sesión"}
            </button>
          </form>

          {/* MENSAJES DE ERROR */}

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </p>
          )}

          {/* CAMBIO ENTRE LOGIN Y REGISTRO */}

          <button
            type="button"
            onClick={cambiarModo}
            className="mt-7 text-sm font-semibold text-[#155B91] underline-offset-4 transition-colors hover:text-[#0B3D62] hover:underline"
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
