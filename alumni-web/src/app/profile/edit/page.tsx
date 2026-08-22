"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EditProfilePage() {

  const [bio, setBio] = useState("");
  const [university, setUniversity] = useState("");
  const [career, setCareer] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!data) return;

    setBio(data.bio || "");
    setUniversity(data.university || "");
    setCareer(data.career || "");
    setAvatarPreview(data.avatar_url || "");
    setBannerPreview(data.banner_url || "");
  }

  async function uploadAvatar(userId: string) {

    if (!avatar) return null;

    const fileName = `${userId}-${Date.now()}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, avatar);

    if (error) {
      alert(error.message);
      return null;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function uploadBanner(userId: string) {

    if (!banner) return null;

    const fileName = `${userId}-banner-${Date.now()}`;

    const { error } = await supabase.storage
      .from("banners")
      .upload(fileName, banner);

    if (error) {
      alert(error.message);
      return null;
    }

    const { data } = supabase.storage
      .from("banners")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function saveProfile() {

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    let avatarUrl = avatarPreview;
    let bannerUrl = bannerPreview;

    if (avatar) {
      const uploaded = await uploadAvatar(user.id);

      if (uploaded) {
        avatarUrl = uploaded;
      }
    }

    if (banner) {

      const uploadedBanner =
        await uploadBanner(user.id);

      if (uploadedBanner) {
        bannerUrl = uploadedBanner;
      }

    }

    const { error } = await supabase
      .from("profiles")
      .update({
        bio,
        university,
        career,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Perfil actualizado");
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white">

      <div className="max-w-3xl mx-auto p-8">

        <h1 className="text-4xl font-bold mb-8">
          ✏️ Editar Perfil
        </h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

          <div className="space-y-5">

            <div>

              <label className="block mb-2 text-zinc-400">
                Banner
              </label>

              {bannerPreview && (

                <img
                  src={bannerPreview}
                  alt="Banner"
                  className="w-full h-40 object-cover rounded-2xl mb-4"
                />

              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {

                  const file = e.target.files?.[0];

                  if (!file) return;

                  setBanner(file);

                  setBannerPreview(
                    URL.createObjectURL(file)
                  );
                }}
              />

            </div>

            <div className="flex flex-col items-center gap-4">

              {avatarPreview ? (

                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-zinc-700"
                />

              ) : (

                <div className="w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center text-4xl">
                  👤
                </div>

              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {

                  const file = e.target.files?.[0];

                  if (!file) return;

                  setAvatar(file);

                  setAvatarPreview(
                    URL.createObjectURL(file)
                  );
                }}
              />

            </div>

            <div>

              <label className="block mb-2 text-zinc-400">
                Biografía
              </label>

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-zinc-800 rounded-2xl p-4 outline-none"
                rows={4}
              />

            </div>

            <div>

              <label className="block mb-2 text-zinc-400">
                Universidad
              </label>

              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full bg-zinc-800 rounded-2xl p-4 outline-none"
              />

            </div>

            <div>

              <label className="block mb-2 text-zinc-400">
                Carrera
              </label>

              <input
                type="text"
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                className="w-full bg-zinc-800 rounded-2xl p-4 outline-none"
              />

            </div>

            <button
              onClick={saveProfile}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 py-4 rounded-2xl font-semibold hover:scale-[1.02] transition"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}
