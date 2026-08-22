"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import AvatarUploader from "./AvatarUploader";

export default function ProfileEditor() {
  const { user, loading: authLoading } = useAuth();

  console.log("USER:", user);

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    bio: "",
    university: "",
    career: "",
    city: "",
    country: "",
    website: "",
    github: "",
    linkedin: "",
    instagram: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    loadProfile();
  }, [user, authLoading]);

  async function loadProfile() {
    console.log("Usuario:", user);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (!error && data) {
      setProfile({
        full_name: data.full_name || "",
        username: data.username || "",
        bio: data.bio || "",
        university: data.university || "",
        career: data.career || "",
        city: data.city || "",
        country: data.country || "",
        website: data.website || "",
        github: data.github || "",
        linkedin: data.linkedin || "",
        instagram: data.instagram || "",
        avatar_url: data.avatar_url || "",
      });
    }

    setLoading(false);
  }

  if (authLoading) {
    return (
      <div className="text-white text-center py-10">
        Cargando usuario...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-white text-center py-10">
        Debes iniciar sesión.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-10 text-white">
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 text-white">

      <h1 className="text-3xl font-bold mb-8">
        Editar perfil
      </h1>

      <AvatarUploader
        userId={user.id}
        currentAvatar={profile.avatar_url}
        onUploaded={(url) =>
          setProfile({
            ...profile,
            avatar_url: url,
          })
        }
      />

    </div>
  );
}
