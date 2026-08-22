"use client";

import { supabase } from "@/lib/supabase";

export default function LogoutButton() {

  async function logout() {

    await supabase.auth.signOut();

    window.location.href = "/login";
  }

  return (
    <button
      onClick={logout}
      className="
        mt-4
        bg-red-500
        hover:bg-red-600
        transition
        py-3
        rounded-2xl
        font-semibold
      "
    >
      Cerrar sesión
    </button>
  );
}