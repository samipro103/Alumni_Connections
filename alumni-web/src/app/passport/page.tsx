"use client";

import { Camera, Check, Globe2, ImagePlus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import "./passport.css";

const THEMES = [
  ["aurora", "Aurora", "Brillos suaves y color nocturno."],
  ["sunset", "Sunset", "Cálido, fotográfico y vibrante."],
  ["night", "Night", "Elegante y profundo."],
  ["coast", "Coast", "Claro, fresco y ligero."],
  ["stamp", "Stamp", "Clásico, editorial y coleccionable."],
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
    country_name: "",
    country_code: "",
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
    if (!user?.id || busy || !form.country_name.trim() || !form.country_code.trim()) return;
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
            <span>Pasaporte Alumni</span>
            <h1>Convierte cada país en un álbum con personalidad propia.</h1>
            <p>Portadas, fotos, recuerdos y estilos visuales que hacen que cada destino se sienta distinto.</p>
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
            <p>Usa “Añadir país” arriba para crear tu primer álbum de viaje.</p>
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
                    <p>{active.note || "Guarda aquí tus mejores momentos de este país."}</p>
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
                    <p>Sube la primera y empieza a construir el álbum.</p>
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
                  <span>Nuevo país</span>
                  <h3>Dale identidad a este destino.</h3>
                </div>

                <button
                  type="button"
                  className="passport-modal-confirm"
                  disabled={
                    busy ||
                    !form.country_name.trim() ||
                    !form.country_code.trim()
                  }
                  onClick={() => void createCountry()}
                  aria-label="Crear país"
                >
                  <Check size={17} />
                  <span>{busy ? "Creando..." : "Crear"}</span>
                </button>
              </header>

              <div className="passport-body">
                <div className="passport-two">
                  <label>
                    <span>País</span>
                    <input value={form.country_name} onChange={(e) => setForm((c) => ({ ...c, country_name: e.target.value }))} placeholder="Ej. España" />
                  </label>
                  <label>
                    <span>Código</span>
                    <input value={form.country_code} maxLength={3} onChange={(e) => setForm((c) => ({ ...c, country_code: e.target.value }))} placeholder="ES" />
                  </label>
                </div>

                <label>
                  <span>Nota</span>
                  <textarea value={form.note} onChange={(e) => setForm((c) => ({ ...c, note: e.target.value }))} placeholder="Qué hizo especial este destino." />
                </label>

                <div className="passport-themes">
                  <span>Diseño del álbum</span>
                  <div>
                    {THEMES.map(([id, label, description]) => (
                      <button
                        key={id}
                        type="button"
                        data-active={form.theme_style === id ? "true" : "false"}
                        onClick={() => setForm((c) => ({ ...c, theme_style: id }))}
                      >
                        <strong>{label}</strong>
                        <small>{description}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <label>
                  <span>Portada opcional</span>
                  <input type="file" accept="image/*" onChange={(e) => setCountryFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <footer>
                <span>Un país, un estilo, un álbum.</span>
                <button type="button" disabled={busy || !form.country_name.trim() || !form.country_code.trim()} onClick={() => void createCountry()}>
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
                  <span>Nueva foto</span>
                  <h3>Agrega un recuerdo a {active.country_name}.</h3>
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

              <footer>
                <span>La foto quedará dentro del álbum del país.</span>
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
