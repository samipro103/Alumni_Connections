"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  MapPin,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import BrandMark from "@/components/brand/BrandMark";
import { useAuth } from "@/components/auth/AuthProvider";
import { AlumniAvatar } from "@/components/ui/AlumniImage";
import { supabase } from "@/lib/supabase";
import { uploadProfileImage } from "@/lib/storage";
import { COUNTRIES } from "@/lib/profileCatalog";
import {
  getRecommendedProfiles,
  type RecommendedProfile,
} from "@/lib/recommendations";

type Step = 0 | 1 | 2 | 3;

type FormState = {
  full_name: string;
  university: string;
  program: string;
  city: string;
  countryCode: string;
};

const TITLES = [
  "Hazlo tuyo",
  "Tu camino",
  "Tu lugar",
  "Tu red",
] as const;

const FIELD =
  "min-h-[50px] w-full rounded-[15px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 text-[14px] text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted-3)] focus:border-[color-mix(in_srgb,var(--app-accent)_34%,var(--app-border))] focus:bg-[color-mix(in_srgb,var(--app-surface)_96%,var(--app-soft))]";

function safeStep(value: unknown): Step {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 3
    ? (n as Step)
    : 0;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const reduceMotion = useReducedMotion();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState(1);
  const [booting, setBooting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [recommendations, setRecommendations] = useState<RecommendedProfile[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [personBusy, setPersonBusy] = useState<string | null>(null);
  const [followed, setFollowed] = useState<
    Record<string, "following" | "requested">
  >({});
  const [form, setForm] = useState<FormState>({
    full_name: "",
    university: "",
    program: "",
    city: "",
    countryCode: "SV",
  });

  const countryName = useMemo(
    () =>
      COUNTRIES.find((item) => item.code === form.countryCode)?.name || "",
    [form.countryCode]
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    let active = true;

    void (async () => {
      const meta = user.user_metadata || {};

      if (meta.onboarding_completed_v1 === true) {
        router.replace("/feed");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "full_name,avatar_url,university,education_institution_name,education_program_name,career,city,country,residence_country_code"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Onboarding profile:", error);
      }

      const profile = (data || {}) as any;
      const countryCode =
        String(profile.residence_country_code || "").toUpperCase() ||
        COUNTRIES.find((item) => item.name === profile.country)?.code ||
        "SV";

      setForm({
        full_name: profile.full_name || "",
        university:
          profile.education_institution_name || profile.university || "",
        program:
          profile.education_program_name || profile.career || "",
        city: profile.city || "",
        countryCode,
      });

      setAvatarPreview(profile.avatar_url || "");
      setStep(safeStep(meta.onboarding_step_v1));
      setBooting(false);
    })();

    return () => {
      active = false;
    };
  }, [authLoading, user?.id, router]);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (!user || step !== 3 || booting) return;

    let active = true;
    setRecsLoading(true);

    void getRecommendedProfiles(user.id, 6)
      .then((data) => {
        if (active) setRecommendations(data);
      })
      .catch((error) =>
        console.error("Onboarding recommendations:", error)
      )
      .finally(() => {
        if (active) setRecsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [step, user?.id, booting]);

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function chooseAvatar(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;

    if (avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function saveMeta(values: Record<string, unknown>) {
    if (!user) return;

    const { error } = await supabase.auth.updateUser({
      data: {
        ...(user.user_metadata || {}),
        onboarding_started_v1: true,
        ...values,
      },
    });

    if (error) throw error;
  }

  async function saveStep() {
    if (!user) return;

    if (step === 0) {
      let avatarUrl =
        avatarPreview && !avatarPreview.startsWith("blob:")
          ? avatarPreview
          : "";

      if (avatarFile) {
        avatarUrl = await uploadProfileImage(
          avatarFile,
          "avatars",
          user.id
        );
      }

      const patch: Record<string, unknown> = {
        full_name: form.full_name.trim() || null,
      };

      if (avatarUrl) {
        patch.avatar_url = avatarUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id);

      if (error) throw error;

      if (avatarUrl) setAvatarPreview(avatarUrl);
      setAvatarFile(null);
      return;
    }

    if (step === 1) {
      const institution = form.university.trim();
      const program = form.program.trim();

      const { error } = await supabase
        .from("profiles")
        .update({
          university: institution || null,
          education_institution_name: institution || null,
          career: program || null,
          education_program_name: program || null,
        })
        .eq("id", user.id);

      if (error) throw error;
      return;
    }

    if (step === 2) {
      const { error } = await supabase
        .from("profiles")
        .update({
          city: form.city.trim() || null,
          country: countryName || null,
          residence_country_code: form.countryCode || null,
        })
        .eq("id", user.id);

      if (error) throw error;
    }
  }

  async function finish(skipped: boolean) {
    if (!user || saving) return;

    setSaving(true);

    try {
      if (!skipped && step < 3) {
        await saveStep();
      }

      await saveMeta({
        onboarding_completed_v1: true,
        onboarding_skipped_v1: skipped,
        onboarding_step_v1: 4,
        onboarding_completed_at_v1: new Date().toISOString(),
      });

      router.replace("/feed");
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "No pudimos terminar la configuración.");
      setSaving(false);
    }
  }

  async function next() {
    if (!user || saving) return;

    if (step === 3) {
      await finish(false);
      return;
    }

    setSaving(true);

    try {
      await saveStep();

      const nextStep = (step + 1) as Step;

      await saveMeta({
        onboarding_completed_v1: false,
        onboarding_step_v1: nextStep,
      });

      setDirection(1);
      setStep(nextStep);
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "No pudimos guardar este paso.");
    } finally {
      setSaving(false);
    }
  }

  function back() {
    if (saving || step === 0) return;

    setDirection(-1);
    setStep((step - 1) as Step);
  }

  async function follow(person: RecommendedProfile) {
    if (!user || personBusy || followed[person.id]) return;

    setPersonBusy(person.id);

    try {
      if (person.is_private) {
        const { error } = await supabase
          .from("follow_requests")
          .insert({
            requester_id: user.id,
            target_id: person.id,
          });

        if (error) throw error;

        setFollowed((current) => ({
          ...current,
          [person.id]: "requested",
        }));
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: person.id,
          });

        if (error) throw error;

        setFollowed((current) => ({
          ...current,
          [person.id]: "following",
        }));

        void supabase.from("notifications").insert({
          user_id: person.id,
          actor_id: user.id,
          type: "follow",
          target_type: "profile",
          target_id: user.id,
        });
      }

      void supabase.rpc("alumni_record_discovery_signal", {
        p_signal_type: "profile",
        p_signal_value: person.id,
        p_weight: 2.2,
      });
    } catch (error: any) {
      alert(error?.message || "No se pudo completar la acción.");
    } finally {
      setPersonBusy(null);
    }
  }

  const variants = {
    enter: (value: number) => ({
      opacity: 0,
      x: reduceMotion ? 0 : value > 0 ? 22 : -22,
    }),
    center: { opacity: 1, x: 0 },
    exit: (value: number) => ({
      opacity: 0,
      x: reduceMotion ? 0 : value > 0 ? -18 : 18,
    }),
  };

  if (authLoading || booting) {
    return (
      <main
        data-pull-refresh-lock="true"
        className="grid min-h-[100dvh] place-items-center bg-[var(--app-bg)] text-[var(--app-text)]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2.5 text-[21px]"
        >
          <BrandMark />
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-[var(--app-accent)]"
            animate={
              reduceMotion
                ? undefined
                : { opacity: [0.35, 1, 0.35], scale: [0.8, 1.08, 0.8] }
            }
            transition={{ duration: 0.9, repeat: Infinity }}
          />
        </motion.div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main
      data-pull-refresh-lock="true"
      className="min-h-[100dvh] bg-[var(--app-bg)] text-[var(--app-text)]"
    >
      <div
        className="mx-auto grid min-h-[100dvh] w-full max-w-[430px] grid-rows-[auto_auto_1fr_auto] px-4"
        style={{
          paddingTop: "max(14px, env(safe-area-inset-top))",
          paddingBottom: "max(14px, env(safe-area-inset-bottom))",
        }}
      >
        <header className="flex min-h-11 items-center justify-between">
          <BrandMark className="text-[20px] text-[var(--app-text)]" />

          <button
            type="button"
            onClick={() => void finish(true)}
            disabled={saving}
            className="min-h-9 px-1.5 text-[11px] font-bold text-[var(--app-muted-2)] disabled:opacity-50"
          >
            Omitir
          </button>
        </header>

        <div
          className="grid grid-cols-4 gap-1.5 pt-3"
          aria-label={`Paso ${step + 1} de 4`}
        >
          {[0, 1, 2, 3].map((item) => (
            <motion.span
              key={item}
              className="h-[3px] rounded-full"
              animate={{
                backgroundColor:
                  item <= step
                    ? "var(--app-accent)"
                    : "var(--app-border)",
                opacity: item <= step ? 1 : 0.5,
              }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
            />
          ))}
        </div>

        <section className="min-h-0 overflow-y-auto overscroll-contain pb-5 pt-[clamp(28px,7vh,58px)]">
          <div className="mb-6 grid grid-cols-[42px_minmax(0,1fr)] items-center gap-3">
            <motion.div
              key={`icon-${step}`}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid h-[42px] w-[42px] place-items-center rounded-[14px] border border-[color-mix(in_srgb,var(--app-accent)_14%,var(--app-border))] bg-[color-mix(in_srgb,var(--app-accent)_7%,var(--app-surface))] text-[var(--app-accent)]"
            >
              {step === 0 ? (
                <Camera size={18} />
              ) : step === 1 ? (
                <GraduationCap size={19} />
              ) : step === 2 ? (
                <MapPin size={18} />
              ) : (
                <Sparkles size={18} />
              )}
            </motion.div>

            <div>
              <p className="mb-0.5 text-[9px] font-extrabold tracking-[0.08em] text-[var(--app-muted-3)]">
                {step + 1} / 4
              </p>
              <h1 className="m-0 text-[29px] font-black leading-none tracking-[-0.048em]">
                {TITLES[step]}
              </h1>
            </div>
          </div>

          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: reduceMotion ? 0.08 : 0.22,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              className="grid gap-3"
            >
              {step === 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="relative mx-auto mb-4 mt-1 grid h-[92px] w-[92px] place-items-center rounded-[30px] border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted-2)]"
                    aria-label="Elegir foto"
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt=""
                        className="h-full w-full rounded-[inherit] object-cover"
                      />
                    ) : (
                      <Camera size={24} />
                    )}

                    <motion.span
                      whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                      className="absolute -bottom-1 -right-1 grid h-[30px] w-[30px] place-items-center rounded-[11px] border-[3px] border-[var(--app-bg)] bg-[var(--app-accent-fill)] text-[var(--app-on-accent)]"
                    >
                      <Camera size={13} />
                    </motion.span>
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) =>
                      chooseAvatar(event.target.files?.[0])
                    }
                  />

                  <label className="grid gap-2">
                    <span className="pl-0.5 text-[10px] font-bold text-[var(--app-muted-2)]">
                      Nombre
                    </span>
                    <input
                      value={form.full_name}
                      onChange={(event) =>
                        update("full_name", event.target.value)
                      }
                      placeholder="Tu nombre"
                      autoComplete="name"
                      className={FIELD}
                    />
                  </label>
                </>
              )}

              {step === 1 && (
                <>
                  <label className="grid gap-2">
                    <span className="pl-0.5 text-[10px] font-bold text-[var(--app-muted-2)]">
                      Universidad
                    </span>
                    <input
                      value={form.university}
                      onChange={(event) =>
                        update("university", event.target.value)
                      }
                      placeholder="Institución"
                      className={FIELD}
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="pl-0.5 text-[10px] font-bold text-[var(--app-muted-2)]">
                      Carrera
                    </span>
                    <input
                      value={form.program}
                      onChange={(event) =>
                        update("program", event.target.value)
                      }
                      placeholder="Carrera o programa"
                      className={FIELD}
                    />
                  </label>
                </>
              )}

              {step === 2 && (
                <>
                  <label className="grid gap-2">
                    <span className="pl-0.5 text-[10px] font-bold text-[var(--app-muted-2)]">
                      Ciudad
                    </span>
                    <input
                      value={form.city}
                      onChange={(event) =>
                        update("city", event.target.value)
                      }
                      placeholder="Tu ciudad"
                      autoComplete="address-level2"
                      className={FIELD}
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="pl-0.5 text-[10px] font-bold text-[var(--app-muted-2)]">
                      País
                    </span>
                    <select
                      value={form.countryCode}
                      onChange={(event) =>
                        update("countryCode", event.target.value)
                      }
                      autoComplete="country"
                      className={FIELD}
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              {step === 3 && (
                <div className="grid gap-0.5">
                  {recsLoading ? (
                    [0, 1, 2, 3].map((item) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-[62px] rounded-[14px] bg-[var(--app-soft)]"
                      />
                    ))
                  ) : recommendations.length ? (
                    recommendations.map((person) => {
                      const done = followed[person.id];
                      const busy = personBusy === person.id;

                      return (
                        <motion.div
                          key={person.id}
                          layout
                          className="grid min-h-[66px] grid-cols-[44px_minmax(0,1fr)_38px] items-center gap-2.5 border-b border-[color-mix(in_srgb,var(--app-border)_72%,transparent)] px-0.5 py-2 last:border-b-0"
                        >
                          <AlumniAvatar
                            src={person.avatar_url}
                            name={person.full_name || person.username}
                            alt=""
                            className="h-11 w-11 overflow-hidden rounded-[15px] bg-[var(--app-soft)]"
                            imageClassName="h-full w-full object-cover"
                          />

                          <div className="min-w-0">
                            <strong className="block truncate text-[12px] font-extrabold text-[var(--app-text)]">
                              {person.full_name || `@${person.username}`}
                            </strong>
                            <span className="mt-0.5 block truncate text-[9.5px] font-semibold text-[var(--app-muted-2)]">
                              {person.reason}
                            </span>
                          </div>

                          <motion.button
                            type="button"
                            whileTap={
                              reduceMotion ? undefined : { scale: 0.94 }
                            }
                            disabled={busy || Boolean(done)}
                            onClick={() => void follow(person)}
                            className={`grid h-9 w-9 place-items-center rounded-xl border ${
                              done
                                ? "border-[var(--app-border)] bg-[var(--app-soft)] text-[var(--app-muted-2)]"
                                : "border-[color-mix(in_srgb,var(--app-accent)_18%,var(--app-border))] bg-[color-mix(in_srgb,var(--app-accent)_8%,var(--app-surface))] text-[var(--app-accent)]"
                            }`}
                            aria-label={`Seguir a ${person.username}`}
                          >
                            {busy ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : done ? (
                              <Check size={15} />
                            ) : (
                              <UserPlus size={15} />
                            )}
                          </motion.button>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="grid min-h-[150px] place-items-center content-center gap-2.5 text-[11px] font-bold text-[var(--app-muted-2)]">
                      <Sparkles size={19} className="text-[var(--app-accent)]" />
                      <span>Tu red crecerá contigo.</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        <footer className="grid grid-cols-[46px_minmax(0,1fr)] items-center gap-2.5 pt-2.5">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              disabled={saving}
              className="grid h-12 w-[46px] place-items-center rounded-[15px] border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-soft)] disabled:opacity-50"
              aria-label="Volver"
            >
              <ChevronLeft size={19} />
            </button>
          ) : (
            <span />
          )}

          <motion.button
            type="button"
            onClick={() => void next()}
            disabled={saving}
            whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            className="flex h-12 items-center justify-center gap-2 rounded-[15px] bg-[var(--app-accent-fill)] text-[12px] font-extrabold text-[var(--app-on-accent)] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : step === 3 ? (
              <>
                Entrar
                <Check size={16} />
              </>
            ) : (
              <>
                Continuar
                <ChevronRight size={17} />
              </>
            )}
          </motion.button>
        </footer>
      </div>
    </main>
  );
}

/* ALUMNI_ONBOARDING_1_0 */
