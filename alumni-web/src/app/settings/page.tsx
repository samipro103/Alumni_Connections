"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/storage";
import ProfileBanner from "@/components/settings/ProfileBanner";
import AvatarSection from "@/components/settings/AvatarSection";
import PersonalInfoCard from "@/components/settings/PersonalInfoCard";
import ProfessionalInfoCard from "@/components/settings/ProfessionalInfoCard";
import SocialLinksCard from "@/components/settings/SocialLinksCard";
import SaveButton from "@/components/settings/SaveButton";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";

export default function SettingsPage() {

  const router = useRouter();
  const { user, loading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [university, setUniversity] = useState("");
  const [career, setCareer] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading]);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!data) return;

    setFullName(data.full_name || "");
    setUsername(data.username || "");
    setBio(data.bio || "");
    setUniversity(data.university || "");
    setCareer(data.career || "");
    setCity(data.city || "");
    setCountry(data.country || "");
    setWebsite(data.website || "");
    setGithub(data.github || "");
    setLinkedin(data.linkedin || "");
    setInstagram(data.instagram || "");

    setAvatarUrl(data.avatar_url || "");
    setAvatarPreview(data.avatar_url || "");
    setBannerUrl(data.banner_url || "");
    setBannerPreview(data.banner_url || "");
  }

  async function saveProfile() {
    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) return;

      let newAvatarUrl = avatarUrl;
      let newBannerUrl = bannerUrl;

      if (avatar && user) {
        newAvatarUrl = await uploadImage(
          avatar,
          "avatars",
          user.id
        );
      }

      if (banner && user) {
        newBannerUrl = await uploadImage(
          banner,
          "banners",
          user.id
        );
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          username,
          bio,
          university,
          career,
          city,
          country,
          website,
          github,
          linkedin,
          instagram,
          avatar_url: newAvatarUrl,
          banner_url: newBannerUrl,
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      alert("Perfil actualizado 🚀");
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        <div className="max-w-7xl mx-auto px-8 py-12 space-y-8">

        <ProfileBanner
          bannerUrl={bannerPreview || bannerUrl}
          onSelectBanner={(file) => {
            setBanner(file);
            setBannerPreview(URL.createObjectURL(file));
          }}
        />

        <AvatarSection
          avatarUrl={avatarPreview || avatarUrl}
          onSelectAvatar={(file) => {
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
          }}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Columna izquierda: formularios */}
          <div className="xl:col-span-2 space-y-8">

            <Card>
              <Section
                title="Información personal"
                subtitle="Esta información será visible para otros usuarios."
              >
                <PersonalInfoCard
                  fullName={fullName}
                  username={username}
                  bio={bio}
                  setFullName={setFullName}
                  setUsername={setUsername}
                  setBio={setBio}
                />
              </Section>
            </Card>

            <Card>
              <Section
                title="Información académica"
                subtitle="Tu universidad, carrera y ubicación."
              >
                <ProfessionalInfoCard
                  university={university}
                  career={career}
                  city={city}
                  country={country}
                  setUniversity={setUniversity}
                  setCareer={setCareer}
                  setCity={setCity}
                  setCountry={setCountry}
                />
              </Section>
            </Card>

            <Card>
              <Section
                title="Redes sociales"
                subtitle="Agrega tus enlaces para que otros puedan encontrarte."
              >
                <SocialLinksCard
                  website={website}
                  github={github}
                  linkedin={linkedin}
                  instagram={instagram}
                  setWebsite={setWebsite}
                  setGithub={setGithub}
                  setLinkedin={setLinkedin}
                  setInstagram={setInstagram}
                />
              </Section>
            </Card>

            <Button
              loading={saving}
              onClick={saveProfile}
            >
              Guardar cambios
            </Button>

          </div>

          {/* Columna derecha: vista previa */}
          <div>
            <Card className="sticky top-24 overflow-hidden p-0">

              {/* Banner */}
              <div className="relative h-40 overflow-hidden">
                {bannerPreview || bannerUrl ? (
                  <img
                    src={bannerPreview || bannerUrl}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600" />
                )}
              </div>

              <div className="px-6 pb-6">

                <div className="-mt-16">
                  <img
                    src={
                      avatarPreview ||
                      avatarUrl ||
                      "https://placehold.co/160x160"
                    }
                    className="w-32 h-32 rounded-full border-4 border-zinc-900 object-cover"
                  />
                </div>

                <h2 className="mt-5 text-2xl font-bold text-white">
                  {fullName || "Tu nombre"}
                </h2>

                <p className="text-zinc-400">
                  @{username || "usuario"}
                </p>

                <p className="mt-5 text-zinc-300 whitespace-pre-wrap">
                  {bio || "Aquí aparecerá tu biografía."}
                </p>

                <div className="mt-8 space-y-3 text-sm">
                  {university && (
                    <div className="text-zinc-400">🎓 {university}</div>
                  )}
                  {career && (
                    <div className="text-zinc-400">💼 {career}</div>
                  )}
                  {city && (
                    <div className="text-zinc-400">
                      📍 {city}{country && `, ${country}`}
                    </div>
                  )}
                </div>

              </div>

            </Card>
          </div>

        </div>

        </div>
      </div>
    </main>
  );
}