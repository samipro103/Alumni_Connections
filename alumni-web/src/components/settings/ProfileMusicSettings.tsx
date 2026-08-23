"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ExternalLink,
  Loader2,
  Music2,
  Search,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type {
  ProfileMusic,
  SpotifyTrackImport,
} from "@/lib/profileMusic";
import ProfileMusicCard from "@/components/profile/ProfileMusicCard";

type Props = { userId: string };

export default function ProfileMusicSettings({ userId }: Props) {
  const [current, setCurrent] = useState<ProfileMusic | null>(null);
  const [candidate, setCandidate] = useState<SpotifyTrackImport | null>(null);
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId) void loadMusic();
  }, [userId]);

  async function loadMusic() {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("profile_music")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (queryError) {
      console.error(queryError);
      setError("No se pudo cargar tu canción. Ejecuta primero el SQL de Música 1.0.");
    } else {
      setCurrent((data as ProfileMusic | null) || null);
    }
    setLoading(false);
  }

  async function readSpotifyLink() {
    const cleanUrl = spotifyUrl.trim();
    if (!cleanUrl) {
      setError("Pega primero el enlace de una canción de Spotify.");
      return;
    }

    setReading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/music/spotify?url=${encodeURIComponent(cleanUrl)}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "No se pudo leer esa canción.");
      setCandidate(data as SpotifyTrackImport);
    } catch (readError: any) {
      setCandidate(null);
      setError(readError?.message || "No se pudo leer esa canción.");
    } finally {
      setReading(false);
    }
  }

  async function saveMusic() {
    if (!candidate || !userId || saving) return;
    setSaving(true);
    setError("");

    const { data, error: saveError } = await supabase
      .from("profile_music")
      .upsert(
        {
          user_id: userId,
          ...candidate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("*")
      .single();

    if (saveError) {
      setError(saveError.message);
    } else {
      setCurrent(data as ProfileMusic);
      setCandidate(null);
      setSpotifyUrl("");
    }
    setSaving(false);
  }

  async function removeMusic() {
    if (!userId || removing) return;
    if (!window.confirm("¿Quitar tu canción del perfil?")) return;

    setRemoving(true);
    const { error: removeError } = await supabase
      .from("profile_music")
      .delete()
      .eq("user_id", userId);

    if (removeError) setError(removeError.message);
    else {
      setCurrent(null);
      setCandidate(null);
      setSpotifyUrl("");
    }
    setRemoving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-sm text-zinc-600">
        <Loader2 size={17} className="mr-2 animate-spin" />
        Cargando música...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="border-b border-white/[0.07] pb-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#6d7cff]/10 text-[#8d98ff]">
            <Music2 size={18} />
          </span>
          <div>
            <p className="text-sm font-black text-zinc-200">Tu canción del momento</p>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600">
              Elige una canción que te represente. Alumni mostrará su portada y un reproductor oficial de Spotify.
            </p>
          </div>
        </div>

        {current ? (
          <div className="mt-5">
            <ProfileMusicCard track={current} />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={removeMusic}
                disabled={removing}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 transition hover:text-red-300 disabled:opacity-50"
              >
                {removing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Quitar canción
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 border-l-2 border-[#6d7cff]/35 pl-4">
            <p className="text-sm font-bold text-zinc-400">Aún no tienes una canción.</p>
            <p className="mt-1 text-xs text-zinc-700">
              Cuando la agregues aparecerá directamente en tu perfil.
            </p>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-zinc-200">Elegir canción</p>
            <p className="mt-1 text-xs text-zinc-700">
              Spotify → Compartir → Copiar enlace de la canción.
            </p>
          </div>
          <a
            href="https://open.spotify.com/"
            target="_blank"
            rel="noreferrer"
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-xs font-black text-zinc-500 transition hover:text-zinc-200"
          >
            Abrir Spotify <ExternalLink size={13} />
          </a>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
            <input
              value={spotifyUrl}
              onChange={(event) => {
                setSpotifyUrl(event.target.value);
                setCandidate(null);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void readSpotifyLink();
                }
              }}
              placeholder="https://open.spotify.com/track/..."
              className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] pl-10 pr-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-800 focus:border-[#6d7cff]/45"
            />
          </div>

          <button
            type="button"
            onClick={readSpotifyLink}
            disabled={reading}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white/[0.07] px-4 text-xs font-black text-zinc-300 transition hover:bg-white/[0.1] disabled:opacity-50"
          >
            {reading ? <Loader2 size={15} className="animate-spin" /> : <Music2 size={15} />}
            Cargar canción
          </button>
        </div>

        {error && <p className="mt-3 text-xs font-bold text-red-300/80">{error}</p>}

        {candidate && (
          <div className="mt-5 border-t border-white/[0.06] pt-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-700">
              Vista previa
            </p>
            <ProfileMusicCard track={{ user_id: userId, ...candidate }} />
            <button
              type="button"
              onClick={saveMusic}
              disabled={saving}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6d7cff] text-xs font-black text-white transition hover:bg-[#7b87ff] disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {saving ? "Guardando..." : "Usar esta canción en mi perfil"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
