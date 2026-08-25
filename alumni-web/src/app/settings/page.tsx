"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AtSign,
  Camera,
  ChevronRight,
  Code2,
  GraduationCap,
  Globe,
  Link2,
  LockKeyhole,
  LogOut,
  Palette,
  Save,
  Shield,
  User,
  UserRoundCheck,
  UserRoundX,
  X,
  Music2,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  ALUMNI_THEMES,
  useTheme,
} from "@/components/theme/ThemeProvider";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/storage";
import AppShell from "@/components/layout/AppShell";
import ProfileSettingsHub from "@/components/settings/ProfileSettingsHub";
import ProfileEditorPro from "@/components/settings/ProfileEditorPro";
import SpotifyPremiumMusicGate from "@/components/music/SpotifyPremiumMusicGate";

type SettingsSectionId =
  | "appearance"
  | "profile"
  | "academic"
  | "links"
  | "music"
  | "account";

const SETTINGS_ITEMS: Array<{
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  {
    id: "appearance",
    label: "Apariencia",
    description: "Tema y estilo visual de Alumni",
    icon: Palette,
  },
  {
    id: "profile",
    label: "Perfil",
    description: "Foto, banner, nombre y biografía",
    icon: User,
  },
  {
    id: "links",
    label: "Enlaces",
    description: "Web y redes profesionales",
    icon: Link2,
  },
  {
    id: "music",
    label: "Música",
    description: "Tu canción del momento",
    icon: Music2,
  },
  {
    id: "account",
    label: "Cuenta",
    description: "Sesión y preferencias de cuenta",
    icon: Shield,
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("profile");

  const [mobileSectionOpen, setMobileSectionOpen] =
    useState(false);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);

  const [form, setForm] = useState({
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
  });

  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) getProfile();
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");

    if (section === "profile" && params.get("edit") === "1") {
      setProfileEditorOpen(true);
    }

    if (
      section &&
      SETTINGS_ITEMS.some((item) => item.id === section)
    ) {
      setActiveSection(section as SettingsSectionId);
      setMobileSectionOpen(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function syncMobileSectionFromUrl() {
      if (window.innerWidth >= 1024) return;

      const section =
        new URLSearchParams(window.location.search).get("section");

      if (
        section &&
        SETTINGS_ITEMS.some((item) => item.id === section)
      ) {
        setActiveSection(section as SettingsSectionId);
        setMobileSectionOpen(true);
      } else {
        setMobileSectionOpen(false);
      }
    }

    window.addEventListener("popstate", syncMobileSectionFromUrl);

    return () => {
      window.removeEventListener("popstate", syncMobileSectionFromUrl);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      if (bannerPreview.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [avatarPreview, bannerPreview]);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function selectAvatar(file: File) {
    if (avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function selectBanner(file: File) {
    if (bannerPreview.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreview);
    }

    setBanner(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  async function getProfile() {
    if (!user) return;

    setLoadingProfile(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setLoadingProfile(false);
      return;
    }

    if (data) {
      setForm({
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
      });

      setAvatarUrl(data.avatar_url || "");
      setBannerUrl(data.banner_url || "");
      setAvatarPreview(data.avatar_url || "");
      setBannerPreview(data.banner_url || "");
      setIsPrivate(Boolean(data.is_private));
    }

    await loadFollowRequests();
    setLoadingProfile(false);
  }

  async function loadFollowRequests() {
    if (!user) return;

    setRequestsLoading(true);

    const { data: requestsData, error } = await supabase
      .from("follow_requests")
      .select("id, requester_id, target_id, created_at")
      .eq("target_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando solicitudes:", error);
      setFollowRequests([]);
      setRequestsLoading(false);
      return;
    }

    const requesterIds = [
      ...new Set(
        (requestsData || []).map((request: any) => request.requester_id)
      ),
    ];

    let profilesData: any[] = [];

    if (requesterIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, full_name, university, career")
        .in("id", requesterIds);

      profilesData = data || [];
    }

    setFollowRequests(
      (requestsData || []).map((request: any) => ({
        ...request,
        requester: profilesData.find(
          (profile: any) => profile.id === request.requester_id
        ),
      }))
    );

    setRequestsLoading(false);
  }

  async function updatePrivacy(nextPrivate: boolean) {
    if (!user || privacySaving) return;

    if (nextPrivate && !isPrivate) {
      setPrivacyModalOpen(true);
      return;
    }

    setPrivacySaving(true);

    try {
      const { error } = await supabase.rpc("set_account_privacy", {
        p_private: nextPrivate,
      });

      if (error) throw error;

      setIsPrivate(nextPrivate);

      if (!nextPrivate) {
        setFollowRequests([]);
      }
    } catch (error: any) {
      console.error(error);
      alert(
        error?.message ||
          "No se pudo cambiar la privacidad de la cuenta."
      );
    } finally {
      setPrivacySaving(false);
    }
  }

  async function confirmPrivateAccount() {
    if (!user || privacySaving) return;

    setPrivacySaving(true);

    try {
      const { error } = await supabase.rpc("set_account_privacy", {
        p_private: true,
      });

      if (error) throw error;

      setIsPrivate(true);
      setPrivacyModalOpen(false);
    } catch (error: any) {
      console.error(error);
      alert(
        error?.message ||
          "No se pudo activar la cuenta privada."
      );
    } finally {
      setPrivacySaving(false);
    }
  }

  async function acceptFollowRequest(requestId: string) {
    const { error } = await supabase.rpc("accept_follow_request", {
      p_request_id: requestId,
    });

    if (error) {
      console.error("Error aceptando solicitud:", error);
      alert(
        error.message ||
          "No se pudo aceptar la solicitud."
      );
      return;
    }

    setFollowRequests((current) =>
      current.filter((request) => request.id !== requestId)
    );

    await loadFollowRequests();
  }

  async function rejectFollowRequest(requestId: string) {
    const { error } = await supabase
      .from("follow_requests")
      .delete()
      .eq("id", requestId);

    if (error) {
      alert(error.message);
      return;
    }

    setFollowRequests((current) =>
      current.filter((request) => request.id !== requestId)
    );
  }

  async function saveProfile() {
    if (!user || saving) return;

    setSaving(true);

    try {
      let newAvatarUrl = avatarUrl;
      let newBannerUrl = bannerUrl;

      if (avatar) {
        newAvatarUrl = await uploadImage(
          avatar,
          "avatars",
          user.id
        );
      }

      if (banner) {
        newBannerUrl = await uploadImage(
          banner,
          "banners",
          user.id
        );
      }

      const cleanUsername = form.username
        .trim()
        .replace(/\s+/g, "");

      const { error } = await supabase
        .from("profiles")
        .update({
          ...form,
          username: cleanUsername,
          avatar_url: newAvatarUrl,
          banner_url: newBannerUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      setForm((current) => ({
        ...current,
        username: cleanUsername,
      }));

      setAvatarUrl(newAvatarUrl);
      setBannerUrl(newBannerUrl);
      setAvatarPreview(newAvatarUrl);
      setBannerPreview(newBannerUrl);
      setAvatar(null);
      setBanner(null);

      alert("Perfil actualizado.");
    } catch (error: any) {
      console.error(error);
      alert(
        error?.message ||
          "No se pudo guardar el perfil."
      );
    } finally {
      setSaving(false);
    }
  }

  function openSettingsSection(id: SettingsSectionId) {
    setActiveSection(id);
    setProfileEditorOpen(false);

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileSectionOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.set("section", id);
      window.history.pushState(
        { alumniSettings: true, section: id },
        "",
        url.pathname + url.search
      );
    }
  }

  function closeMobileSettingsSection() {
    if (typeof window === "undefined") {
      setMobileSectionOpen(false);
      return;
    }

    if (window.history.state?.alumniSettings) {
      window.history.back();
      return;
    }

    setMobileSectionOpen(false);

    const url = new URL(window.location.href);
    url.searchParams.delete("section");
    window.history.replaceState({}, "", url.pathname + url.search);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const activeItem = useMemo(
    () =>
      SETTINGS_ITEMS.find(
        (item) => item.id === activeSection
      ) || SETTINGS_ITEMS[0],
    [activeSection]
  );

  if (loadingProfile) {
    return (
      <AppShell>
        <div className="py-16 text-center text-sm text-zinc-600">
          Cargando configuración...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="alumni-settings-page mx-auto w-full max-w-[1080px]">
        <div className={`${mobileSectionOpen ? "hidden lg:block" : "block"} mb-6 pt-2`}>
          <h1 className="text-[30px] font-black tracking-[-0.04em]">
            Configuración
          </h1>
        </div>

        <div className="alumni-settings-layout grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className={`alumni-settings-nav ${mobileSectionOpen ? "hidden lg:block" : "block"} h-fit lg:sticky lg:top-[88px] lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-white/[0.07] lg:bg-[#101318]/95`}>
            <div className="border-b border-white/[0.06] px-1 py-4 lg:px-5">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-700">
                Ajustes
              </p>
            </div>

            <nav className="divide-y divide-white/[0.06] lg:divide-y-0 lg:p-2">
              {SETTINGS_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openSettingsSection(item.id)}
                    className={`group flex w-full items-center gap-3 px-1 py-4 text-left transition lg:rounded-2xl lg:px-3 lg:py-3 ${
                      active
                        ? "bg-white/[0.06]"
                        : "hover:bg-white/[0.035]"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        active
                          ? "bg-[#6d7cff]/12 text-[#8d98ff]"
                          : "bg-white/[0.025] text-zinc-600"
                      }`}
                    >
                      <Icon size={17} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-black ${
                          active
                            ? "text-zinc-200"
                            : "text-zinc-500"
                        }`}
                      >
                        {item.label}
                      </span>

                    </span>

                    <ChevronRight
                      size={16}
                      className={`shrink-0 transition ${
                        active
                          ? "text-[#8d98ff]"
                          : "text-zinc-800 group-hover:text-zinc-600"
                      }`}
                    />
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className={`alumni-settings-detail ${mobileSectionOpen ? "block" : "hidden lg:block"} min-w-0`}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <button
                type="button"
                onClick={closeMobileSettingsSection}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition active:bg-white/[0.06] lg:hidden"
                aria-label="Volver a Ajustes"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-black tracking-[-0.03em] text-zinc-100">
                  {activeItem.label}
                </h2>
              </div>

              {activeSection !== "appearance" &&
                activeSection !== "account" &&
                activeSection !== "music" &&
                activeSection !== "profile" && (
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#6d7cff] px-4 text-xs font-black text-white transition hover:bg-[#7b87ff] disabled:opacity-50"
                  >
                    <Save size={15} />
                    {saving
                      ? "Guardando..."
                      : "Guardar"}
                  </button>
                )}
            </div>

            {activeSection === "appearance" && (
              <AppearancePanel
                theme={theme}
                setTheme={setTheme}
              />
            )}

            {activeSection === "profile" &&
              (profileEditorOpen ? (
                <ProfileEditorPro
                  userId={user?.id || ""}
                  onBack={() => {
                    setProfileEditorOpen(false);
                    if (typeof window !== "undefined") {
                      const url = new URL(window.location.href);
                      url.searchParams.delete("edit");
                      window.history.replaceState(
                        window.history.state,
                        "",
                        url.pathname + url.search
                      );
                    }
                  }}
                  onSaved={getProfile}
                />
              ) : (
                <ProfileSettingsHub
                  isPrivate={isPrivate}
                  privacySaving={privacySaving}
                  updatePrivacy={updatePrivacy}
                  followRequests={followRequests}
                  requestsLoading={requestsLoading}
                  acceptFollowRequest={acceptFollowRequest}
                  rejectFollowRequest={rejectFollowRequest}
                  onEditProfile={() => {
                    setProfileEditorOpen(true);
                    if (typeof window !== "undefined") {
                      const url = new URL(window.location.href);
                      url.searchParams.set("section", "profile");
                      url.searchParams.set("edit", "1");
                      window.history.replaceState(
                        window.history.state,
                        "",
                        url.pathname + url.search
                      );
                    }
                  }}
                />
              ))}

            {activeSection === "academic" && (
              <AcademicPanel
                form={form}
                update={update}
              />
            )}

            {activeSection === "links" && (
              <LinksPanel
                form={form}
                update={update}
              />
            )}

            {activeSection === "music" && (
              <SpotifyPremiumMusicGate userId={user?.id || ""} />
            )}

            {activeSection === "account" && (
              <AccountPanel
                email={user?.email || ""}
                logout={logout}
              />
            )}
          </section>
        </div>
      </div>

      {privacyModalOpen && (
        <PrivacyModeModal
          busy={privacySaving}
          onClose={() => setPrivacyModalOpen(false)}
          onConfirm={confirmPrivateAccount}
        />
      )}
    </AppShell>
  );
}

function PrivacyModeModal({
  busy,
  onClose,
  onConfirm,
}: {
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[460px] rounded-t-[28px] border border-white/[0.08] bg-[var(--app-surface)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_30px_100px_rgba(0,0,0,.5)] sm:rounded-[28px] sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
            <LockKeyhole size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black tracking-[-0.03em] text-[var(--app-text)]">
              Activar cuenta privada
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
              Las personas nuevas tendrán que enviarte una solicitud para seguirte.
              Solo tus seguidores aceptados podrán ver tus publicaciones e historias.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--app-muted-2)] transition hover:bg-[var(--app-soft)]"
            aria-label="Cerrar"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 space-y-3 border-y border-[var(--app-border)] py-4 text-xs leading-5 text-[var(--app-muted)]">
          <p>• Tus seguidores actuales se mantienen.</p>
          <p>• Las nuevas solicitudes tendrás que aceptarlas o rechazarlas.</p>
          <p>• Tu perfil básico seguirá apareciendo para que puedan encontrarte.</p>
          <p>• Puedes volver a cuenta pública cuando quieras.</p>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-11 flex-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-soft)] text-xs font-black text-[var(--app-text-soft)]"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="h-11 flex-1 rounded-xl bg-[var(--app-accent)] text-xs font-black text-[var(--app-on-accent)] disabled:opacity-50"
          >
            {busy ? "Activando..." : "Activar privacidad"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Panel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="alumni-settings-panel rounded-[24px] border border-white/[0.07] bg-[#101318]/95 p-5 sm:p-6">
      {children}
    </div>
  );
}

function AppearancePanel({
  theme,
  setTheme,
}: {
  theme: string;
  setTheme: (theme: any) => void;
}) {
  return (
    <Panel>
      <div className="space-y-1">
        <p className="text-sm font-black text-zinc-200">
          Tema de la aplicación
        </p>
        <p className="text-xs leading-5 text-zinc-700">
          Selecciona un estilo. El cambio se aplica inmediatamente.
        </p>
      </div>

      <div className="mt-5 divide-y divide-white/[0.06]">
        {ALUMNI_THEMES.map((item) => {
          const selected = theme === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              className="flex w-full items-center gap-4 py-4 text-left"
            >
              <div className="flex shrink-0 items-center">
                {item.swatches.map(
                  (color, index) => (
                    <span
                      key={`${item.id}-${index}`}
                      className={`h-8 w-8 rounded-full border border-black/10 ${
                        index > 0 ? "-ml-2" : ""
                      }`}
                      style={{ background: color }}
                    />
                  )
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-zinc-200">
                  {item.name}
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-600">
                  {item.description}
                </p>
              </div>

              <span
                className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                  selected
                    ? "border-[#6d7cff] bg-[#6d7cff] shadow-[inset_0_0_0_4px_var(--app-surface)]"
                    : "border-white/[0.12]"
                }`}
              />
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function ProfilePanel({
  form,
  update,
  avatarPreview,
  bannerPreview,
  selectAvatar,
  selectBanner,
  isPrivate,
  privacySaving,
  updatePrivacy,
  followRequests,
  requestsLoading,
  acceptFollowRequest,
  rejectFollowRequest,
}: any) {
  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
            <LockKeyhole size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-[var(--app-text)]">
              Cuenta privada
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--app-muted-2)]">
              Controla quién puede seguirte y ver tus publicaciones e historias.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isPrivate}
            disabled={privacySaving}
            onClick={() => updatePrivacy(!isPrivate)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              isPrivate
                ? "bg-[var(--app-accent)]"
                : "bg-[var(--app-soft-strong)]"
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                isPrivate ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="mt-4 border-t border-[var(--app-border)] pt-4">
          <p className="text-[11px] leading-5 text-[var(--app-muted-2)]">
            {isPrivate
              ? "Privada: las personas deben enviarte una solicitud y esperar tu aprobación."
              : "Pública: cualquier persona puede seguirte inmediatamente y ver tu contenido público."}
          </p>
        </div>
      </Panel>

      {isPrivate && (
        <Panel>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[var(--app-text)]">
                Solicitudes de seguimiento
              </p>
              <p className="mt-1 text-xs text-[var(--app-muted-2)]">
                Tú decides quién entra a tu comunidad.
              </p>
            </div>

            {followRequests.length > 0 && (
              <span className="rounded-full bg-[var(--app-accent-soft)] px-2.5 py-1 text-[10px] font-black text-[var(--app-accent)]">
                {followRequests.length}
              </span>
            )}
          </div>

          {requestsLoading ? (
            <p className="mt-5 text-xs text-[var(--app-muted-2)]">
              Cargando solicitudes...
            </p>
          ) : followRequests.length === 0 ? (
            <p className="mt-5 text-xs text-[var(--app-muted-2)]">
              No tienes solicitudes pendientes.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[var(--app-border)]">
              {followRequests.map((request: any) => {
                const person = request.requester;

                return (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-soft-strong)] text-xs font-black text-[var(--app-text)]">
                      {person?.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        person?.username?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-[var(--app-text)]">
                        @{person?.username || "usuario"}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-[var(--app-muted-2)]">
                        {[person?.career, person?.university]
                          .filter(Boolean)
                          .join(" · ") || "Comunidad Alumni"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => acceptFollowRequest(request.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                      aria-label="Aceptar solicitud"
                      title="Aceptar"
                    >
                      <UserRoundCheck size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => rejectFollowRequest(request.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--app-soft)] text-[var(--app-muted)]"
                      aria-label="Rechazar solicitud"
                      title="Rechazar"
                    >
                      <UserRoundX size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      <div className="pt-2">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--app-muted-3)]">
          Modificación de perfil
        </p>
        <p className="mt-1 text-sm text-[var(--app-muted-2)]">
          Portada, foto e información que aparece en tu perfil.
        </p>
      </div>

      <Panel>
        <p className="text-sm font-black text-zinc-200">
          Foto y portada
        </p>
        <p className="mt-1 text-xs text-zinc-700">
          Así te reconocerán dentro de la comunidad.
        </p>

        <div className="mt-5 overflow-hidden rounded-[22px] border border-white/[0.07]">
          <div className="relative h-44 bg-[#151a23] sm:h-52">
            {bannerPreview ? (
              <img
                src={bannerPreview}
                alt="Banner"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_20%_10%,rgba(109,124,255,.28),transparent_38%),radial-gradient(circle_at_85%_20%,rgba(124,58,237,.18),transparent_34%),#11151c]" />
            )}

            <label className="absolute right-3 top-3 flex cursor-pointer items-center gap-2 rounded-xl bg-black/55 px-3 py-2 text-xs font-black text-white backdrop-blur">
              <Camera size={14} />
              Cambiar portada
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file =
                    e.target.files?.[0];
                  if (file) selectBanner(file);
                }}
              />
            </label>
          </div>

          <div className="flex items-end gap-4 px-5 pb-5">
            <div className="-mt-10 relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-[5px] border-[#101318] bg-[#1a1f29] text-xl font-black">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                form.username
                  ?.charAt(0)
                  ?.toUpperCase() || "U"
              )}

              <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 text-transparent transition hover:bg-black/55 hover:text-white">
                <Camera size={17} />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file =
                      e.target.files?.[0];
                    if (file)
                      selectAvatar(file);
                  }}
                />
              </label>
            </div>

            <div className="pb-1">
              <p className="text-sm font-black text-zinc-200">
                Foto de perfil
              </p>
              <p className="mt-1 text-xs text-zinc-700">
                Recomendado: imagen cuadrada y clara.
              </p>
            </div>
          </div>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-black text-zinc-200">
          Información básica
        </p>
        <p className="mt-1 text-xs text-zinc-700">
          Datos principales que aparecen en tu perfil.
        </p>

        <div className="mt-5 space-y-4">
          <Field label="Nombre completo">
            <input
              value={form.full_name}
              onChange={(e) =>
                update(
                  "full_name",
                  e.target.value
                )
              }
              className="settings-input"
              placeholder="Tu nombre"
            />
          </Field>

          <Field label="Usuario">
            <input
              value={form.username}
              onChange={(e) =>
                update(
                  "username",
                  e.target.value
                )
              }
              className="settings-input"
              placeholder="usuario"
            />
          </Field>

          <Field label="Biografía">
            <textarea
              value={form.bio}
              onChange={(e) =>
                update("bio", e.target.value)
              }
              rows={4}
              className="settings-textarea"
              placeholder="Cuéntale a la comunidad sobre ti..."
            />
          </Field>
        </div>
      </Panel>
    </div>
  );
}

function AcademicPanel({
  form,
  update,
}: any) {
  return (
    <Panel>
      <p className="text-sm font-black text-zinc-200">
        Datos académicos y ubicación
      </p>
      <p className="mt-1 text-xs text-zinc-700">
        Esta información mejora las recomendaciones de conexiones.
      </p>

      <div className="mt-5 space-y-4">
        <Field label="Universidad">
          <input
            value={form.university}
            onChange={(e) =>
              update(
                "university",
                e.target.value
              )
            }
            className="settings-input"
            placeholder="Universidad"
          />
        </Field>

        <Field label="Carrera">
          <input
            value={form.career}
            onChange={(e) =>
              update(
                "career",
                e.target.value
              )
            }
            className="settings-input"
            placeholder="Carrera"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ciudad">
            <input
              value={form.city}
              onChange={(e) =>
                update(
                  "city",
                  e.target.value
                )
              }
              className="settings-input"
              placeholder="Ciudad"
            />
          </Field>

          <Field label="País">
            <input
              value={form.country}
              onChange={(e) =>
                update(
                  "country",
                  e.target.value
                )
              }
              className="settings-input"
              placeholder="País"
            />
          </Field>
        </div>
      </div>
    </Panel>
  );
}

function LinksPanel({
  form,
  update,
}: any) {
  return (
    <Panel>
      <p className="text-sm font-black text-zinc-200">
        Enlaces externos
      </p>
      <p className="mt-1 text-xs text-zinc-700">
        Añade solo los enlaces que quieras mostrar públicamente.
      </p>

      <div className="mt-5 space-y-3">
        <SocialField
          icon={<Globe size={16} />}
          label="Sitio web"
          value={form.website}
          onChange={(value) =>
            update("website", value)
          }
        />

        <SocialField
          icon={<Code2 size={16} />}
          label="GitHub"
          value={form.github}
          onChange={(value) =>
            update("github", value)
          }
        />

        <SocialField
          icon={<Link2 size={16} />}
          label="LinkedIn"
          value={form.linkedin}
          onChange={(value) =>
            update("linkedin", value)
          }
        />

        <SocialField
          icon={<AtSign size={16} />}
          label="Instagram"
          value={form.instagram}
          onChange={(value) =>
            update("instagram", value)
          }
        />
      </div>
    </Panel>
  );
}

function AccountPanel({
  email,
  logout,
}: {
  email: string;
  logout: () => void;
}) {
  return (
    <div className="space-y-5">
      <Panel>
        <p className="text-sm font-black text-zinc-200">
          Información de la cuenta
        </p>
        <p className="mt-1 text-xs text-zinc-700">
          Datos vinculados a tu sesión de Alumni.
        </p>

        <div className="mt-5">
          <p className="text-xs font-bold text-zinc-600">
            Correo electrónico
          </p>
          <p className="mt-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-sm text-zinc-300">
            {email || "Sin correo disponible"}
          </p>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-black text-zinc-200">
          Sesión
        </p>
        <p className="mt-1 text-xs leading-5 text-zinc-700">
          Puedes cerrar tu sesión actual sin eliminar tu cuenta.
        </p>

        <button
          onClick={logout}
          className="mt-5 flex h-11 items-center gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.05] px-4 text-xs font-black text-red-400 transition hover:bg-red-500/10"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </Panel>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-zinc-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function SocialField({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 transition hover:bg-white/[0.04]">
      <span className="text-zinc-700">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <span className="block pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-700">
          {label}
        </span>

        <input
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="h-9 w-full bg-transparent text-sm text-zinc-300 outline-none placeholder:text-zinc-700"
          placeholder={`${label}...`}
        />
      </div>
    </label>
  );
}
