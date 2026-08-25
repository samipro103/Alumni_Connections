"use client";

import {
  ArrowLeft,
  Building2,
  Camera,
  Check,
  ChevronRight,
  Flag,
  GraduationCap,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadProfileImage } from "@/lib/storage";
import { prepareProfileImage } from "@/lib/profileImagePipeline";
import { COUNTRIES, flagEmoji, type CountryOption } from "@/lib/profileCatalog";
import { careersForUniversity } from "@/data/academicCatalog";
import OriginalMonochromeLogo from "@/components/profile/OriginalMonochromeLogo";

type Institution = {
  id: string | null;
  name: string;
  kind: "university" | "school" | "program";
  country_code?: string | null;
  country_name?: string | null;
  city?: string | null;
  website?: string | null;
  logo_url?: string | null;
  parent_name?: string | null;
};

type Props = {
  userId: string;
  onBack: () => void;
  onSaved?: () => void | Promise<void>;
};

export default function ProfileEditorPro({
  userId,
  onBack,
  onSaved,
}: Props) {
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const avatarProcessToken = useRef(0);
const bannerProcessToken = useRef(0);
const profileLoadToken = useRef(0);
const mountedRef = useRef(true);


  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [avatarProcessing, setAvatarProcessing] = useState(false);
  const [bannerProcessing, setBannerProcessing] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [program, setProgram] = useState<Institution | null>(null);
  const [picker, setPicker] = useState<"institution" | "program" | "career" | "residence" | "nationality1" | "nationality2" | null>(null);

  useEffect(() => {
  mountedRef.current = true;

  return () => {
    mountedRef.current = false;
    profileLoadToken.current += 1;
    avatarProcessToken.current += 1;
    bannerProcessToken.current += 1;
  };
}, []);

useEffect(() => {
  void load();
}, [userId]);


  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    return () => {
      if (bannerPreview.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [bannerPreview]);

  async function load() {
  const token =
    ++profileLoadToken.current;

  setLoading(true);

  const [
    {
      data: profileData,
      error,
    },
    {
      data: catalog,
    },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single(),
    supabase
      .from("education_institutions")
      .select("id,name,kind,country_code,country_name,city,website,logo_url,parent_name")
      .eq("active", true)
      .order("name"),
  ]);

  if (
    !mountedRef.current ||
    token !==
      profileLoadToken.current
  ) {
    return;
  }

  if (error || !profileData) {
    alert(
      error?.message ||
        "No se pudo cargar el perfil."
    );
    setLoading(false);
    return;
  }

  setProfile(profileData);
  setInstitutions(
    (catalog || []) as Institution[]
  );
  setAvatarFile(null);
  setBannerFile(null);
  setAvatarPreview(
    profileData.avatar_url || ""
  );
  setBannerPreview(
    profileData.banner_url || ""
  );
  setInstitution(null);
  setProgram(null);
  setPicker(null);

  if (
    profileData
      .education_institution_name
  ) {
    setInstitution({
      id:
        profileData
          .education_institution_id ||
        null,
      name:
        profileData
          .education_institution_name,
      kind:
        "university",
      logo_url:
        profileData
          .education_institution_logo_url ||
        null,
    });
  } else if (
    profileData.university
  ) {
    setInstitution({
      id: null,
      name:
        profileData.university,
      kind:
        "university",
      logo_url: null,
    });
  }

  if (
    profileData
      .education_program_name
  ) {
    setProgram({
      id:
        profileData
          .education_program_id ||
        null,
      name:
        profileData
          .education_program_name,
      kind: "program",
      logo_url:
        profileData
          .education_program_logo_url ||
        null,
    });
  }

  setLoading(false);
}


  function update(field: string, value: any) {
    setProfile((current: any) => ({
      ...current,
      [field]: value,
    }));
  }

  async function setPhoto(file: File, type: "avatar" | "banner") {
    const isAvatar = type === "avatar";
    const tokenRef = isAvatar
      ? avatarProcessToken
      : bannerProcessToken;

    const token = ++tokenRef.current;
    const initialUrl = URL.createObjectURL(file);

    if (isAvatar) {
      setAvatarProcessing(true);
      setAvatarPreview((current) => {
        if (current.startsWith("blob:")) {
          URL.revokeObjectURL(current);
        }
        return initialUrl;
      });
    } else {
      setBannerProcessing(true);
      setBannerPreview((current) => {
        if (current.startsWith("blob:")) {
          URL.revokeObjectURL(current);
        }
        return initialUrl;
      });
    }

    try {
      const prepared = await prepareProfileImage(file, type);

      if (
  !mountedRef.current ||
  tokenRef.current !== token
) {
  return;
}


      const finalUrl = URL.createObjectURL(prepared.file);

      if (isAvatar) {
        setAvatarFile(prepared.file);
        setAvatarPreview((current) => {
          if (current.startsWith("blob:")) {
            URL.revokeObjectURL(current);
          }
          return finalUrl;
        });
      } else {
        setBannerFile(prepared.file);
        setBannerPreview((current) => {
          if (current.startsWith("blob:")) {
            URL.revokeObjectURL(current);
          }
          return finalUrl;
        });
      }
    } catch (error: any) {
      console.error(error);

      if (
  mountedRef.current &&
  tokenRef.current === token
) {
        alert(
          error?.message ||
            "No se pudo preparar la imagen."
        );

        if (isAvatar) {
          setAvatarFile(null);
          setAvatarPreview(profile?.avatar_url || "");
        } else {
          setBannerFile(null);
          setBannerPreview(profile?.banner_url || "");
        }
      }
    } finally {
      if (
  mountedRef.current &&
  tokenRef.current === token
) {
        if (isAvatar) {
          setAvatarProcessing(false);
        } else {
          setBannerProcessing(false);
        }
      }
    }
  }

  function countryByCode(code?: string | null) {
    return COUNTRIES.find((item) => item.code === code) || null;
  }

  async function save() {
    if (
      !profile ||
      saving ||
      avatarProcessing ||
      bannerProcessing
    ) {
      return;
    }

    

if (
  !/^[a-zA-Z0-9._-]{3,30}$/.test(
    cleanUsername
  )
) {
  alert(
    "El usuario debe tener entre 3 y 30 caracteres y usar solo letras, números, punto, guion o guion bajo."
  );
  return;
}

if (
  String(profile.bio || "").length >
  2000
) {
  alert(
    "La biografía no puede superar 2000 caracteres."
  );
  return;
}

setSaving(true);

try {
  const {
    data: {
      user: authUser,
    },
    error: authError,
  } =
    await supabase.auth.getUser();

  if (
    authError ||
    !authUser ||
    authUser.id !== userId
  ) {
    throw new Error(
      "Tu sesión cambió. Vuelve a abrir el editor antes de guardar."
    );
  }

  let avatarUrl =
    profile.avatar_url || "";
  let bannerUrl =
    profile.banner_url || "";


      if (avatarFile) {
        avatarUrl = await uploadProfileImage(
          avatarFile,
          "avatars",
            authUser.id
);

      }

      if (bannerFile) {
        bannerUrl = await uploadProfileImage(
          bannerFile,
          "banners",
            authUser.id
);

      }

      const residence = countryByCode(profile.residence_country_code);
      const nationality1 = countryByCode(profile.nationality_primary_code);
      const nationality2 = countryByCode(profile.nationality_secondary_code);

      const cleanUsername = String(profile.username || "")
        .trim()
        .replace(/\s+/g, "");

      const allowedCareers = careersForUniversity(institution?.name);
      const safeCareer =
        allowedCareers.length === 0 || allowedCareers.includes(profile.career)
          ? profile.career || null
          : null;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name || null,
          username: cleanUsername,
          bio: profile.bio || null,
          career: safeCareer,
          city: profile.city || null,
          country: residence?.name || profile.country || null,
          residence_country_code: residence?.code || null,

          education_institution_id: institution?.id || null,
          education_institution_name: institution?.name || null,
          education_institution_logo_url: institution?.logo_url || null,
          university: institution?.name || null,

          education_program_id: program?.id || null,
          education_program_name: program?.name || null,
          education_program_logo_url: program?.logo_url || null,

          nationality_primary_code: nationality1?.code || null,
          nationality_primary_name: nationality1?.name || null,
          nationality_secondary_code: nationality2?.code || null,
          nationality_secondary_name: nationality2?.name || null,

          avatar_url: avatarUrl,
          banner_url: bannerUrl,
        })
          .eq("id", authUser.id);

if (error) throw error;


      setProfile((current: any) => ({
        ...current,
        username: cleanUsername,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      }));

      setAvatarPreview(avatarUrl);
      setBannerPreview(bannerUrl);
      setAvatarFile(null);
      setBannerFile(null);

      await onSaved?.();
      alert("Perfil actualizado.");
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 size={18} className="animate-spin text-[var(--app-muted)]" />
      </div>
    );
  }

  const residence = countryByCode(profile.residence_country_code);
  const nationality1 = countryByCode(profile.nationality_primary_code);
  const nationality2 = countryByCode(profile.nationality_secondary_code);

  return (
    <div
  className="alumni-profile-editor"
  data-pull-refresh-lock="true"
>
      <div className="alumni-profile-editor-top">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--app-muted)] hover:bg-[var(--app-soft)]"
          aria-label="Volver"
        >
          <ArrowLeft size={19} />
        </button>

        <div className="alumni-profile-editor-top-copy">
          <p>Editar perfil</p>
        </div>

        <button
          type="button"
          onClick={() => void save()}
          disabled={
            saving ||
            avatarProcessing ||
            bannerProcessing
          }
          className="alumni-profile-editor-save"
          aria-label={
            avatarProcessing || bannerProcessing
              ? "Procesando imagen"
              : saving
              ? "Guardando cambios"
              : "Guardar cambios"
          }
        >
          {saving || avatarProcessing || bannerProcessing ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Check size={15} strokeWidth={2.2} />
          )}
          <span>
            {avatarProcessing || bannerProcessing
              ? "Preparando imagen"
              : saving
              ? "Guardando"
              : "Guardar cambios"}
          </span>
        </button>
      </div>

      <div className="alumni-profile-editor-media">
        <input
          ref={bannerInput}
          type="file"
          hidden
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void setPhoto(file, "banner");
            event.currentTarget.value = "";
          }}
        />
        <input
          ref={avatarInput}
          type="file"
          hidden
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void setPhoto(file, "avatar");
            event.currentTarget.value = "";
          }}
        />

        <div className="alumni-profile-editor-banner">
        <button
          type="button"
          onClick={() => bannerInput.current?.click()}
          className="group relative block h-44 w-full overflow-hidden bg-[var(--app-soft-strong)] sm:h-52"
        >
          {bannerPreview ? (
            <img
              src={bannerPreview}
              alt=""
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              draggable={false}
              className="h-full w-full object-cover"
              style={{ imageRendering: "auto" }}
            />
          ) : (
            <div className="profile-banner-fallback h-full w-full" />
          )}
          <span className="absolute inset-0 bg-black/10 transition group-hover:bg-black/20" />
          <span className="absolute bottom-3 right-3 flex h-9 items-center gap-2 rounded-full bg-black/60 px-3 text-[10px] font-black text-white backdrop-blur-xl">
            <Camera size={14} />
            Cambiar portada
          </span>
        </button>
        </div>

        <div className="alumni-profile-editor-photo-row">
          <div className="alumni-profile-editor-avatar-cluster">
            <div className="alumni-profile-editor-avatar flex items-center justify-center text-xl font-black text-[var(--app-text)]">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Foto de perfil"
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                  draggable={false}
                  style={{ imageRendering: "auto" }}
                />
              ) : (
                String(profile.username || "U").charAt(0).toUpperCase()
              )}
            </div>

            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              className="alumni-profile-editor-camera"
              aria-label="Cambiar foto de perfil"
              title="Cambiar foto de perfil"
            >
              <Camera size={16} strokeWidth={1.9} />
            </button>
          </div>

          <div className="alumni-profile-editor-photo-copy">
            <strong>Foto de perfil</strong>
          </div>
        </div>
      </div>

      <div className="alumni-profile-editor-fields">
        <section className="alumni-editor-section">
          <div className="alumni-editor-section-head">
            <h3>Identidad</h3>
          </div>

          <div className="alumni-editor-grid-2">
            <TextRow
              label="Nombre"
              value={profile.full_name || ""}
              onChange={(v) => update("full_name", v)}
            />
            <TextRow
              label="Usuario"
              value={profile.username || ""}
              onChange={(v) => update("username", v)}
              prefix="@"
            />
          </div>

          <TextAreaRow
            label="Biografía"
            value={profile.bio || ""}
            onChange={(v) => update("bio", v)}
          />
        </section>

        <section className="alumni-editor-section">
          <div className="alumni-editor-section-head">
            <h3>Académica</h3>
          </div>

          <div className="alumni-editor-grid-2">
            <PickerRow
              icon={<GraduationCap size={17} />}
              label="Institución educativa"
              value={institution?.name || ""}
              logo={institution?.logo_url}
              brandKind="university"
              onClick={() => setPicker("institution")}
            />

            <PickerRow
              icon={<Sparkles size={17} />}
              label="Programa / comunidad"
              value={program?.name || ""}
              logo={program?.logo_url}
              brandKind="program"
              onClick={() => setPicker("program")}
              optional
            />
          </div>

          {careersForUniversity(institution?.name).length > 0 ? (
            <PickerRow
              icon={<GraduationCap size={17} />}
              label="Carrera / especialidad"
              value={profile.career || ""}
              onClick={() => setPicker("career")}
            />
          ) : (
            <TextRow
              label="Carrera / especialidad"
              value={profile.career || ""}
              onChange={(v) => update("career", v)}
            />
          )}
        </section>

        <section className="alumni-editor-section">
          <div className="alumni-editor-section-head">
            <h3>Ubicación</h3>
          </div>

          <div className="alumni-editor-grid-2">
            <TextRow
              label="Ciudad"
              value={profile.city || ""}
              onChange={(v) => update("city", v)}
            />

            <PickerRow
              icon={<MapPin size={17} />}
              label="País de residencia"
              value={residence ? `${flagEmoji(residence.code)} ${residence.name}` : ""}
              onClick={() => setPicker("residence")}
            />
          </div>

          <div className="alumni-editor-grid-2">
            <PickerRow
              icon={<Flag size={17} />}
              label="Nacionalidad"
              value={nationality1 ? `${flagEmoji(nationality1.code)} ${nationality1.name}` : ""}
              onClick={() => setPicker("nationality1")}
            />

            <PickerRow
              icon={<Flag size={17} />}
              label="Segunda nacionalidad"
              value={nationality2 ? `${flagEmoji(nationality2.code)} ${nationality2.name}` : ""}
              onClick={() => setPicker("nationality2")}
              optional
              onClear={
                nationality2
                  ? () => {
                      update("nationality_secondary_code", null);
                      update("nationality_secondary_name", null);
                    }
                  : undefined
              }
            />
          </div>
        </section>
      </div>

      {picker === "institution" && (
        <InstitutionPicker
          title="Institución educativa"
          items={institutions.filter((item) => item.kind !== "program")}
          onClose={() => setPicker(null)}
          onPick={(item) => {
            if (institution?.name !== item.name) {
              update("career", "");
            }
            setInstitution(item);
            setPicker(null);
          }}
          allowCustom
        />
      )}

      {picker === "career" && (
        <CareerPicker
          title="Carrera / especialidad"
          items={careersForUniversity(institution?.name)}
          current={profile.career || ""}
          onClose={() => setPicker(null)}
          onPick={(career) => {
            update("career", career);
            setPicker(null);
          }}
        />
      )}

      {picker === "program" && (
        <InstitutionPicker
          title="Programa / comunidad"
          items={institutions.filter((item) => item.kind === "program")}
          onClose={() => setPicker(null)}
          onPick={(item) => {
            setProgram(item);
            setPicker(null);
          }}
          allowCustom
        />
      )}

      {(picker === "residence" ||
        picker === "nationality1" ||
        picker === "nationality2") && (
        <CountryPicker
          title={
            picker === "residence"
              ? "País de residencia"
              : picker === "nationality1"
              ? "Nacionalidad"
              : "Segunda nacionalidad"
          }
          onClose={() => setPicker(null)}
          onPick={(country) => {
            if (picker === "residence") {
              update("residence_country_code", country.code);
              update("country", country.name);
            } else if (picker === "nationality1") {
              update("nationality_primary_code", country.code);
              update("nationality_primary_name", country.name);
            } else {
              update("nationality_secondary_code", country.code);
              update("nationality_secondary_name", country.name);
            }
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}

function TextRow({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
}) {
  return (
    <label className="alumni-edit-row">
      <span className="w-[118px] shrink-0 text-xs font-black text-[var(--app-text-soft)] sm:w-[150px]">
        {label}
      </span>
      <span className="flex min-w-0 flex-1 items-center">
        {prefix && <span className="mr-0.5 text-sm text-[var(--app-muted-2)]">{prefix}</span>}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="alumni-mobile-input min-w-0 flex-1 bg-transparent text-[16px] text-[var(--app-text)] outline-none sm:text-[13px]"
        />
      </span>
    </label>
  );
}

function TextAreaRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="alumni-edit-row items-start">
      <span className="w-[118px] shrink-0 pt-1 text-xs font-black text-[var(--app-text-soft)] sm:w-[150px]">
        {label}
      </span>
      <textarea
        rows={3}
        value={value}
        maxLength={280}
        onChange={(event) => onChange(event.target.value)}
        className="alumni-mobile-input min-w-0 flex-1 resize-none bg-transparent text-[16px] leading-6 text-[var(--app-text)] outline-none sm:text-[13px]"
      />
    </label>
  );
}

function PickerRow({
  icon,
  label,
  value,
  logo,
  brandKind,
  onClick,
  optional,
  onClear,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  logo?: string | null;
  brandKind?: "university" | "program";
  onClick: () => void;
  optional?: boolean;
  onClear?: () => void;
}) {
  return (
    <div className="alumni-edit-row">
      <span className="w-[118px] shrink-0 text-xs font-black text-[var(--app-text-soft)] sm:w-[150px]">
        {label}
      </span>

      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        {value && brandKind ? (
          <OriginalMonochromeLogo
            src={logo}
            name={value}
            size={32}
            className="text-[var(--app-text-soft)]"
          />
        ) : (
          <span className="shrink-0 text-[var(--app-accent)]">{icon}</span>
        )}

        <span className={`min-w-0 flex-1 truncate text-[13px] ${value ? "text-[var(--app-text)]" : "text-[var(--app-muted-3)]"}`}>
          {value || (optional ? "Agregar" : "Seleccionar")}
        </span>

        <ChevronRight size={16} className="shrink-0 text-[var(--app-muted-3)]" />
      </button>

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--app-muted-3)] hover:bg-[var(--app-soft)]"
          aria-label="Quitar"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function InstitutionPicker({
  title,
  items,
  onClose,
  onPick,
  allowCustom,
}: {
  title: string;
  items: Institution[];
  onClose: () => void;
  onPick: (item: Institution) => void;
  allowCustom?: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.name, item.parent_name, item.country_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [items, query]);

  return (
    <PickerShell title={title} onClose={onClose}>
      <SearchBox value={query} onChange={setQuery} placeholder="Buscar..." />

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {filtered.map((item) => (
          <button
            key={`${item.id}-${item.name}`}
            type="button"
            onClick={() => onPick(item)}
            className="flex w-full items-center gap-3 border-b border-[var(--app-border)] py-3 text-left"
          >
            <OriginalMonochromeLogo
              src={item.logo_url}
              name={item.name}
              size={40}
              className="text-[var(--app-text-soft)]"
            />

            <span className="min-w-0 flex-1">
              <span className="block text-xs font-black text-[var(--app-text)]">
                {item.name}
              </span>
              {item.parent_name && (
                <span className="mt-0.5 block text-[10px] text-[var(--app-muted-2)]">
                  {item.parent_name}
                </span>
              )}
            </span>
          </button>
        ))}

        {allowCustom && query.trim().length >= 2 && (
          <button
            type="button"
            onClick={() =>
              onPick({
                id: null,
                name: query.trim(),
                kind: title.includes("Programa") ? "program" : "school",
                logo_url: null,
              })
            }
            className="mt-2 flex w-full items-center gap-3 rounded-xl bg-[var(--app-soft)] px-3 py-3 text-left"
          >
            <Building2 size={17} className="text-[var(--app-accent)]" />
            <span className="text-xs font-black text-[var(--app-text)]">
              Usar “{query.trim()}”
            </span>
          </button>
        )}
      </div>
    </PickerShell>
  );
}

function CareerPicker({
  title,
  items,
  current,
  onClose,
  onPick,
}: {
  title: string;
  items: string[];
  current: string;
  onClose: () => void;
  onPick: (career: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <PickerShell title={title} onClose={onClose}>
      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder="Buscar carrera..."
      />

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {filtered.map((career) => (
          <button
            key={career}
            type="button"
            onClick={() => onPick(career)}
            className="flex w-full items-center gap-3 border-b border-[var(--app-border)] py-3.5 text-left"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[var(--app-muted)]">
              <GraduationCap size={17} strokeWidth={1.7} />
            </span>

            <span className="min-w-0 flex-1 text-xs font-bold leading-5 text-[var(--app-text)]">
              {career}
            </span>

            {career === current && (
              <Check size={15} className="shrink-0 text-[var(--app-accent)]" />
            )}
          </button>
        ))}

        {!filtered.length && (
          <p className="py-10 text-center text-xs text-[var(--app-muted-3)]">
            No se encontraron carreras.
          </p>
        )}
      </div>
    </PickerShell>
  );
}

function CountryPicker({
  title,
  onClose,
  onPick,
}: {
  title: string;
  onClose: () => void;
  onPick: (country: CountryOption) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(q) ||
        country.code.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <PickerShell title={title} onClose={onClose}>
      <SearchBox value={query} onChange={setQuery} placeholder="Buscar país..." />

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {filtered.map((country) => (
          <button
            key={country.code}
            type="button"
            onClick={() => onPick(country)}
            className="flex w-full items-center gap-3 border-b border-[var(--app-border)] py-3 text-left"
          >
            <span className="w-8 text-xl">{flagEmoji(country.code)}</span>
            <span className="min-w-0 flex-1 text-xs font-black text-[var(--app-text)]">
              {country.name}
            </span>
            <span className="text-[10px] text-[var(--app-muted-3)]">
              {country.code}
            </span>
          </button>
        ))}
      </div>
    </PickerShell>
  );
}

function PickerShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/65 sm:items-center sm:p-5">
      <div className="flex h-[78dvh] w-full max-w-[520px] flex-col rounded-t-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_28px_90px_rgba(0,0,0,.48)] sm:h-[70dvh] sm:rounded-[28px] sm:p-5">
        <div className="flex items-center gap-3">
          <h3 className="min-w-0 flex-1 text-base font-black text-[var(--app-text)]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--app-muted)] hover:bg-[var(--app-soft)]"
          >
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mt-4 flex h-11 items-center gap-2 border-b border-[var(--app-border)]">
      <Search size={16} className="text-[var(--app-muted-2)]" />
      <input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="alumni-mobile-input min-w-0 flex-1 bg-transparent text-[16px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-3)] sm:text-[13px]"
      />
    </div>
  );
}
