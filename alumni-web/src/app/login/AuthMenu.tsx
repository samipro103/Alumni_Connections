"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import LogoutButton from "./LogoutButton";

export default function AuthMenu() {

  const [logged, setLogged] = useState(false);

  useEffect(() => {

    supabase.auth.getSession().then(({ data }) => {
      setLogged(!!data.session);
    });

  }, []);

  if (!logged) {

    return (
      <div className="mt-8 flex flex-col gap-3">

        <Link
          href="/login"
          className="bg-blue-500 text-center py-3 rounded-2xl"
        >
          Iniciar sesión
        </Link>

        <Link
          href="/register"
          className="bg-zinc-800 text-center py-3 rounded-2xl"
        >
          Registrarse
        </Link>

      </div>
    );
  }

  return <LogoutButton />;
}