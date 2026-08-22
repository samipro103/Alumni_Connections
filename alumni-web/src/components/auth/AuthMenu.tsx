"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import LogoutButton from "./LogoutButton";

export default function AuthMenu() {

  const [logged, setLogged] = useState<boolean | null>(null);

  useEffect(() => {

    async function checkSession() {

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setLogged(!!session);
    }

    checkSession();

  }, []);

  if (logged === null) {
    return null;
  }

  if (!logged) {

    return (
      <div className="mt-8 flex flex-col gap-3">

        <Link
          href="/login"
          className="
            bg-blue-500
            hover:bg-blue-600
            transition
            text-center
            py-3
            rounded-2xl
            font-semibold
          "
        >
          Iniciar sesión
        </Link>

        <Link
          href="/register"
          className="
            bg-zinc-800
            hover:bg-zinc-700
            transition
            text-center
            py-3
            rounded-2xl
            font-semibold
          "
        >
          Registrarse
        </Link>

      </div>
    );
  }

  return (
    <>
      <LogoutButton />

      <Link
        href="/feed"
        className="
          mt-8
          bg-gradient-to-r from-blue-500 to-purple-600
          hover:scale-105 transition text-center py-3
          rounded-2xl font-semibold shadow-lg
        "
      >
        Publicar
      </Link>
    </>
  );
}