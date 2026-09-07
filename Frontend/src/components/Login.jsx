// Frontend/src/components/Login.jsx
import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
  const [error, setError] = useState(null);

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
        console.log("Login exitoso:", data.data.user);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("error del server");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-white text-2xl mb-6">Iniciar sesión</h2>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => setError("error del servicio de google")}
      />
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default Login;