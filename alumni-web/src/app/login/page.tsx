"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {

    try {

      console.log("EMAIL:", email);
      console.log("PASSWORD:", password);

      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log(response);

      if (response.error) {
        alert(response.error.message);
      } else {
        window.location.href = "/feed";
      }

    } catch (err) {

      console.log(err);

      alert("Error inesperado");
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center text-white">

      <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md">

        <h1 className="text-3xl font-bold mb-6">
          Login
        </h1>

        <div className="space-y-4">

          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-xl bg-zinc-800 outline-none"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl bg-zinc-800 outline-none"
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 p-4 rounded-xl"
          >
            Entrar
          </button>

        </div>
      </div>
    </main>
  );
}