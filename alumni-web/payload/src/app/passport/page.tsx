"use client";

import { Camera, ImagePlus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { COUNTRIES, flagEmoji } from "@/lib/countries";
import "./passport.css";

const THEMES = [
  ["aurora", "Aurora"],
  ["sunset", "Sunset"],
  ["night", "Night"],
  ["coast", "Coast"],
  ["stamp", "Stamp"],
] as const;

async function sign(path?: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from("passport-media")
    .createSignedUrl(path, 60 * 30);
  return error ? null : data?.signedUrl || null;
}

async function upload(file: File, userId: string, folder: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("passport-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export default function PassportPage() {
  const { user } = useAuth();
  const [countries, setCountries] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [countryFile, setCountryFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [form, setForm] = useState({
    country_code: "",
    city: "",
    note: "",
    theme_style: "aurora",
  });

  useEffect(() => {
    if (user?.id) void load();
  }, [user?.id]);

  useEffect(() => {
    if (!countryOpen && !photoOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [countryOpen, photoOpen]);

  async function load() {
    if (!user?.id) return;
    const [countryResult, mediaResult] = await Promise.all([
      supabase
        .from("passport_countries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("passport_media")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const hydratedCountries = await Promise.all(
      (countryResult.data || []).map(async (row: any) => ({
        ...row,
        cover_url: await sign(row.cover_media_path),
      }))
    );
    const hydratedMedia = await Promise.all(
      (mediaResult.data || []).map(async (row: any) => ({
        ...row,
        media_url: await sign(row.media_path),
      }))
    );

    setCountries(hydratedCountries);
    setMedia(hydratedMedia);
    setActiveId((current) => current || hydratedCountries[0]?.id || null);
  }

  const active = useMemo(
    () => countries.find((item) => item.id === activeId) || null,
    [countries, activeId]
  );

  const activeMedia = useMemo(
    () => media.filter((item) => item.passport_country_id === activeId),
    [media, activeId]
  );

  async function createCountry() {
    if (!user?.id || busy || !form.country_code) return;

    const selected = COUNTRIES.find((item) => item.code === form.country_code);
    if (!selected) return;

    setBusy(true);
    try {
      const coverPath = countryFile
        ? await upload(countryFile, user.id, "covers")
        : null;

      const { error } = await supabase.from("passport_countries").insert({
        user_id: user.id,
        country_name: selected.name,
        country_code: selected.code,
        city: form.city.trim() || null,
        note: form.note.trim() || null,
        theme_style: form.theme_style,
        cover_media_path: coverPath,
      });

      if (error) throw error;

      setCountryOpen(false);
      setCountryFile(null);
      setForm({
        country_code: "",
        city: "",
        note: "",
        theme_style: "aurora",
      });
      await load();
    } catch (error: any) {
      alert(error?.message || "No se pudo crear el país.");
    } finally {
      setBusy(false);
    }
  }

  async function addPhoto() {
    if (!user?.id || !active || !photoFile || busy) return;
    setBusy(true);

    try {
      const mediaPath = await upload(photoFile, user.id, "albums");
      const { error } = await supabase.from("passport_media").insert({
        passport_country_id: active.id,
        user_id: user.id,
        media_path: mediaPath,
        caption: caption.trim() || null,
      });
      if (error) throw error;

      if (!active.cover_media_path) {
        await supabase
          .from("passport_countries")
          .update({ cover_media_path: mediaPath })
          .eq("id", active.id)
          .eq("user_id", user.id);
      }

      setPhotoOpen(false);
      setPhotoFile(null);
      setCaption("");
      await load();
    } catch (error: any) {
      alert(error?.message || "No se pudo guardar la foto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <main className="alumni-passport mx-auto w-full max-w-[1040px]">
        <header className="passport-hero">
          <h1>Pasaporte Alumni</h1>
          <button type="button" onClick={() => setCountryOpen(true)}>
            <Plus size={16} />
            Añadir país
          </button>
        </header>

        {countries.length === 0 ? (
          <section className="passport-empty">
            <span className="passport-empty-flag">🌍</span>
            <strong>Tu pasaporte está vacío.</strong>
            <p>Añade el primer país que forme parte de tu historia.</p>
          </section>
        ) : (
          <>
            <section className="passport-strip">
              {countries.map((country: any) => (
                <button
                  key={country.id}
                  type="button"
                  className={`passport-country theme-${country.theme_style || "aurora"}`}
                  data-active={activeId === country.id ? "true" : "false"}
                  onClick={() => setActiveId(country.id)}
                >
                  <span className="passport-flag">{flagEmoji(country.country_code)}</span>
                  <strong>{country.country_name}</strong>
                  {country.city && <small>{country.city}</small>}
                </button>
              ))}
            </section>

            {active && (
              <section className="passport-album">
                <header>
                  <div>
                    <span className="passport-album-flag">
                      {flagEmoji(active.country_code)}
                    </span>
                    <div>
                      <h2>{active.country_name}</h2>
                      {active.city && <strong>{active.city}</strong>}
                      {active.note && <p>{active.note}</p>}
                    </div>
                  </div>
                  <button type="button" onClick={() => setPhotoOpen(true)}>
                    <ImagePlus size={16} />
                    Agregar foto
                  </button>
                </header>

                {activeMedia.length === 0 ? (
                  <div className="passport-empty compact">
                    <Camera size={24} />
                    <strong>Aún no hay fotos.</strong>
                  </div>
                ) : (
                  <div className="passport-grid">
                    {activeMedia.map((item: any) => (
                      <figure key={item.id}>
                        {item.media_url && (
                          <img
                            src={item.media_url}
                            alt={item.caption || active.country_name}
                          />
                        )}
                        {item.caption && <figcaption>{item.caption}</figcaption>}
                      </figure>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {countryOpen && (
          <div className="passport-backdrop">
            <section className="passport-modal">
              <header>
                <div>
                  <span>Nuevo destino</span>
                  <h3>Añadir país</h3>
                </div>
                <button type="button" onClick={() => setCountryOpen(false)}>
                  <X size={18} />
                </button>
              </header>

              <div className="passport-body">
                <label>
                  <span>País</span>
                  <select
                    value={form.country_code}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        country_code: event.target.value,
                      }))
                    }
                  >
                    <option value="">Selecciona un país</option>
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {flagEmoji(country.code)} {country.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Ciudad</span>
                  <input
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, city: event.target.value }))
                    }
                    placeholder="Ej. Cayalá"
                  />
                </label>

                <label>
                  <span>Comentario</span>
                  <textarea
                    value={form.note}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, note: event.target.value }))
                    }
                    placeholder="Ej. Amigos + Fiesta"
                  />
                </label>

                <div className="passport-themes">
                  <span>Diseño</span>
                  <div>
                    {THEMES.map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        data-active={form.theme_style === id ? "true" : "false"}
                        onClick={() =>
                          setForm((current) => ({ ...current, theme_style: id }))
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <label>
                  <span>Portada opcional</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setCountryFile(event.target.files?.[0] || null)
                    }
                  />
                </label>
              </div>

              <button
                type="button"
                className="passport-submit"
                disabled={busy || !form.country_code}
                onClick={() => void createCountry()}
              >
                {busy ? "Creando..." : "Crear país"}
              </button>
            </section>
          </div>
        )}

        {photoOpen && active && (
          <div className="passport-backdrop">
            <section className="passport-modal">
              <header>
                <div>
                  <span>{flagEmoji(active.country_code)} {active.country_name}</span>
                  <h3>Agregar foto</h3>
                </div>
                <button type="button" onClick={() => setPhotoOpen(false)}>
                  <X size={18} />
                </button>
              </header>

              <div className="passport-body">
                <label>
                  <span>Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setPhotoFile(event.target.files?.[0] || null)
                    }
                  />
                </label>
                <label>
                  <span>Comentario</span>
                  <textarea
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    placeholder="Cuenta algo de esta foto."
                  />
                </label>
              </div>

              <button
                type="button"
                className="passport-submit"
                disabled={busy || !photoFile}
                onClick={() => void addPhoto()}
              >
                {busy ? "Guardando..." : "Guardar foto"}
              </button>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}
