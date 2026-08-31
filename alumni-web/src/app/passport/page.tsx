"use client";

import { Camera, Check, Globe2, ImagePlus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import "./passport.css";

const THEMES = [
  ["aurora", "Aurora", "Brillos suaves y color nocturno."],
  ["sunset", "Sunset", "Cálido, fotográfico y vibrante."],
  ["night", "Night", "Elegante y profundo."],
  ["coast", "Coast", "Claro, fresco y ligero."],
  ["stamp", "Stamp", "Clásico, editorial y coleccionable."],
] as const;

const regionNames =
  typeof Intl !== "undefined" &&
  "DisplayNames" in Intl
    ? new Intl.DisplayNames(
        ["es"],
        {
          type: "region",
        }
      )
    : null;

const PASSPORT_COUNTRIES =
  COUNTRIES
    .map((country) => {
      const code =
        String(
          country.code || ""
        )
          .trim()
          .toUpperCase();

      return {
        code,
        name:
          regionNames?.of(
            code
          ) ||
          String(
            country.name || ""
          ),
      };
    })
    .filter(
      (country) =>
        /^[A-Z]{2}$/.test(
          country.code
        ) &&
        Boolean(
          country.name
        )
    )
    .sort((a, b) =>
      a.name.localeCompare(
        b.name,
        "es",
        {
          sensitivity:
            "base",
        }
      )
    );

function flagEmoji(
  code?: string | null
) {
  const value =
    String(code || "")
      .trim()
      .toUpperCase();

  if (
    !/^[A-Z]{2}$/.test(
      value
    )
  ) {
    return "🌍";
  }

  return String.fromCodePoint(
    ...value
      .split("")
      .map(
        (char) =>
          127397 +
          char.charCodeAt(
            0
          )
      )
  );
}

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
  const [countrySearch, setCountrySearch] = useState("");
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countryCoverPreview, setCountryCoverPreview] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [form, setForm] = useState({
    country_name: "",
    country_code: "",
    note: "",
    theme_style: "aurora",
  });

  useEffect(() => {
    if (user?.id) void load();
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);

    if (url.searchParams.get("add") === "1") {
      setCountryOpen(true);

      url.searchParams.delete("add");

      window.history.replaceState(
        {},
        "",
        url.pathname +
          (url.searchParams.toString()
            ? `?${url.searchParams.toString()}`
            : "")
      );
    }
  }, []);

  useEffect(() => {
    if (!countryFile) {
      setCountryCoverPreview("");
      return;
    }

    const url =
      URL.createObjectURL(
        countryFile
      );

    setCountryCoverPreview(
      url
    );

    return () =>
      URL.revokeObjectURL(
        url
      );
  }, [countryFile]);

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

  const filteredCountries =
    useMemo(() => {
      const query =
        countrySearch
          .trim()
          .toLocaleLowerCase(
            "es"
          );

      if (!query) {
        return PASSPORT_COUNTRIES;
      }

      return PASSPORT_COUNTRIES.filter(
        (country) =>
          country.name
            .toLocaleLowerCase(
              "es"
            )
            .includes(
              query
            )
      );
    }, [countrySearch]);

  const selectedCountry =
    useMemo(
      () =>
        PASSPORT_COUNTRIES.find(
          (country) =>
            country.code ===
              form.country_code &&
            country.name ===
              form.country_name
        ) || null,
      [
        form.country_code,
        form.country_name,
      ]
    );

  async function createCountry() {
    if (
      !user?.id ||
      busy ||
      !selectedCountry
    ) {
      return;
    }

    setBusy(true);

    try {
      const coverPath = countryFile
        ? await upload(countryFile, user.id, "covers")
        : null;

      const { error } = await supabase.from("passport_countries").insert({
        user_id: user.id,
        country_name: form.country_name.trim(),
        country_code: form.country_code.trim().toUpperCase(),
        note: form.note.trim() || null,
        theme_style: form.theme_style,
        cover_media_path: coverPath,
      });

      if (error) throw error;

      setCountryOpen(false);
      setCountryFile(null);
      setCountrySearch("");
      setCountryPickerOpen(false);
      setForm({
        country_name: "",
        country_code: "",
        note: "",
        theme_style: "aurora",
      });
      await load();
    } catch (error: any) {
      alert(error?.message || "No se pudo guardar el país.");
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
          <div>
            <h1>Pasaporte Alumni</h1>
          </div>
          <button type="button" onClick={() => setCountryOpen(true)}>
            <Plus size={16} />
            Añadir país
          </button>
        </header>

        {countries.length === 0 ? (
          <section className="passport-empty passport-empty-first">
            <Globe2 size={28} />
            <strong>Tu pasaporte está esperando su primer destino.</strong>
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
                  <div className="passport-cover">
                    {country.cover_url ? (
                      <img src={country.cover_url} alt={country.country_name} />
                    ) : (
                      <Globe2 size={24} />
                    )}
                  </div>
                  <span>{country.country_code}</span>
                  <strong>{country.country_name}</strong>
                  <small>{country.note || "Álbum de viaje"}</small>
                </button>
              ))}
            </section>

            {active && (
              <section className="passport-album">
                <header>
                  <div>
                    <span>Álbum activo</span>
                    <h2>{active.country_name}</h2>
                    {active.note && <p>{active.note}</p>}
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
                        {item.media_url && <img src={item.media_url} alt={item.caption || active.country_name} />}
                        <figcaption>{item.caption || "Recuerdo de viaje"}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {countryOpen && (
          <div className="passport-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setCountryOpen(false)}>
            <section className="passport-modal">
              <header className="passport-modal-header-v2">
                <button
                  type="button"
                  className="passport-modal-close"
                  onClick={() => setCountryOpen(false)}
                  aria-label="Cerrar"
                  disabled={busy}
                >
                  <X size={17} />
                  <span>Cerrar</span>
                </button>

                <div className="passport-modal-title">
                  <h3>Nuevo país</h3>
                </div>

                <button
                  type="button"
                  className="passport-modal-confirm"
                  disabled={
                    busy ||
                    !selectedCountry
                  }
                  onClick={() => void createCountry()}
                  aria-label="Crear país"
                >
                  <Check size={17} />
                  <span>{busy ? "Creando..." : "Crear"}</span>
                </button>
              </header>

              <div className="passport-body">
                <div className="passport-country-picker">
                  <label>
                    <span>País</span>

                    <div className="passport-country-search">
                      {form.country_code && (
                        <span className="passport-country-selected-flag">
                          {flagEmoji(
                            form.country_code
                          )}
                        </span>
                      )}

                      <input
                        value={
                          countrySearch
                        }
                        onFocus={() =>
                          setCountryPickerOpen(
                            true
                          )
                        }
                        onChange={(
                          event
                        ) => {
                          setCountrySearch(
                            event.target
                              .value
                          );

                          setCountryPickerOpen(
                            true
                          );

                          setForm(
                            (
                              current
                            ) => ({
                              ...current,
                              country_name:
                                "",
                              country_code:
                                "",
                            })
                          );
                        }}
                        placeholder="Buscar país"
                        autoComplete="off"
                      />
                    </div>
                  </label>

                  {countryPickerOpen && (
                    <div className="passport-country-options">
                      {filteredCountries.map(
                        (
                          country
                        ) => (
                          <button
                            key={
                              country.code
                            }
                            type="button"
                            data-selected={
                              form.country_code ===
                              country.code
                                ? "true"
                                : "false"
                            }
                            onClick={() => {
                              setForm(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  country_name:
                                    country.name,
                                  country_code:
                                    country.code,
                                })
                              );

                              setCountrySearch(
                                country.name
                              );

                              setCountryPickerOpen(
                                false
                              );
                            }}
                          >
                            <span>
                              {flagEmoji(
                                country.code
                              )}
                            </span>

                            <strong>
                              {
                                country.name
                              }
                            </strong>

                            {form.country_code ===
                              country.code && (
                              <Check
                                size={
                                  15
                                }
                              />
                            )}
                          </button>
                        )
                      )}

                      {filteredCountries.length ===
                        0 && (
                        <p>
                          No encontramos
                          ese país.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <label>
                  <span>Nota</span>
                  <textarea value={form.note} onChange={(e) => setForm((c) => ({ ...c, note: e.target.value }))} placeholder="Qué hizo especial este destino." />
                </label>

                <div
                  className={`passport-live-preview theme-${form.theme_style}`}
                  aria-label="Vista previa del álbum"
                >
                  <div className="passport-live-cover">
                    {countryCoverPreview ? (
                      <img
                        src={
                          countryCoverPreview
                        }
                        alt=""
                      />
                    ) : (
                      <span>
                        {flagEmoji(
                          form.country_code
                        )}
                      </span>
                    )}
                  </div>

                  <div className="passport-live-copy">
                    <small>
                      Vista previa
                    </small>

                    <strong>
                      {form.country_name ||
                        "Tu país"}
                    </strong>

                    <p>
                      {form.note.trim() ||
                        "Álbum de viaje"}
                    </p>
                  </div>
                </div>

                <div className="passport-themes">
                  <span>Diseño del álbum</span>
                  <div>
                    {THEMES.map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        data-active={form.theme_style === id ? "true" : "false"}
                        onClick={() => setForm((c) => ({ ...c, theme_style: id }))}
                      >
                        <strong>{label}</strong>
                      </button>
                    ))}
                  </div>
                </div>

                <label>
                  <span>Portada opcional</span>
                  <input type="file" accept="image/*" onChange={(e) => setCountryFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <button
                type="button"
                className="passport-mobile-submit"
                data-visible="country"
                disabled={
                  busy ||
                  !selectedCountry
                }
                onClick={() => void createCountry()}
              >
                {busy ? "Creando..." : "Crear país"}
              </button>

              <footer>
                <button type="button" disabled={busy || !selectedCountry} onClick={() => void createCountry()}>
                  {busy ? "Creando..." : "Crear país"}
                </button>
              </footer>
            </section>
          </div>
        )}

        {photoOpen && active && (
          <div className="passport-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPhotoOpen(false)}>
            <section className="passport-modal">
              <header className="passport-modal-header-v2">
                <button
                  type="button"
                  className="passport-modal-close"
                  onClick={() => setPhotoOpen(false)}
                  aria-label="Cerrar"
                  disabled={busy}
                >
                  <X size={17} />
                  <span>Cerrar</span>
                </button>

                <div className="passport-modal-title">
                  <h3>Nueva foto</h3>
                </div>

                <button
                  type="button"
                  className="passport-modal-confirm"
                  disabled={busy || !photoFile}
                  onClick={() => void addPhoto()}
                  aria-label="Guardar foto"
                >
                  <Check size={17} />
                  <span>{busy ? "Subiendo..." : "Guardar"}</span>
                </button>
              </header>

              <div className="passport-body">
                <label>
                  <span>Foto</span>
                  <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                </label>
                <label>
                  <span>Descripción</span>
                  <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ej. Atardecer en Lisboa" />
                </label>
              </div>

              <button
                type="button"
                className="passport-mobile-submit"
                data-visible="photo"
                disabled={busy || !photoFile}
                onClick={() => void addPhoto()}
              >
                {busy ? "Subiendo..." : "Guardar foto"}
              </button>

              <footer>
                <button type="button" disabled={busy || !photoFile} onClick={() => void addPhoto()}>
                  {busy ? "Subiendo..." : "Guardar foto"}
                </button>
              </footer>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}

/* ALUMNI_2_2_0_FIX1_PASSPORT */

/* ALUMNI_2_2_1_PASSPORT_CREATE_FIX:PAGE */

/* ALUMNI_2_2_2_PASSPORT_MOBILE_ACTION:PAGE */

/* ALUMNI_2_2_3_PASSPORT_INNER_CONFIRM:PAGE */

/* ALUMNI_2_2_4_PASSPORT_CREATE_BUTTON_VISIBLE:PAGE */

/* ALUMNI_2_3_3_PASSPORT_PROFILE_FEED_FIX:PASSPORT_ADD_FROM_PROFILE */

/* ALUMNI_3_1_1_PRODUCT_COPY_CLEANUP */

/* ALUMNI_3_1_2A_SAFE_PRODUCT_FLOWS */
