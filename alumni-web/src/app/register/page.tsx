"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {

    try {

      // CREAR USUARIO
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log(data);
      console.log(error);

      if (error) {
        alert(error.message);
        return;
      }

      const user = data.user;

      if (!user) {
        alert("No se creó el usuario");
        return;
      }

      // CREAR PERFIL
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username: username,
        });

      console.log(profileError);

      if (profileError) {
        alert(profileError.message);
        return;
      }

      alert("Cuenta creada 🚀");

    } catch (err) {

      console.log(err);

      alert("Error inesperado");
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center text-white">

      <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md">

        <h1 className="text-3xl font-bold mb-6">
          Crear cuenta
        </h1>

        <div className="space-y-4">

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-4 rounded-xl bg-zinc-800 outline-none"
          />

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
            onClick={handleRegister}
            className="w-full bg-blue-500 p-4 rounded-xl"
          >
            Crear cuenta
          </button>

        </div>
      </div>
    </main>
  );
}