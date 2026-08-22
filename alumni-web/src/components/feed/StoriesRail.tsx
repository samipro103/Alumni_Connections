"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function StoriesRail() {
  const { user } = useAuth();
  const [me, setMe] = useState<any>(null);
  const [people, setPeople] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setMe(null);
      setPeople([]);
      return;
    }

    loadPreview();
  }, [user?.id]);

  async function loadPreview() {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    setMe(profile);

    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .limit(10);

    const ids = (follows || []).map((row: any) => row.following_id);

    if (ids.length === 0) {
      setPeople([]);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", ids);

    setPeople((profiles || []).slice(0, 9));
  }

  function storiesComingSoon() {
    alert(
      "Historias está lista visualmente. En la siguiente fase activamos publicación, visor, vistas y expiración a las 24 horas."
    );
  }

  if (!user) return null;

  return (
    <section className="mb-5 border-b border-white/[0.07] pb-5">
      <div className="scrollbar-thin flex items-start gap-4 overflow-x-auto px-1 pb-1">
        <button
          onClick={storiesComingSoon}
          className="w-[72px] shrink-0 text-center"
          aria-label="Crear historia"
        >
          <div className="relative mx-auto h-14 w-14">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#171b23] text-sm font-bold shadow-[0_8px_24px_rgba(0,0,0,.16)]">
              {me?.avatar_url ? (
                <img
                  src={me.avatar_url}
                  alt="Tu historia"
                  className="h-full w-full object-cover"
                />
              ) : (
                me?.username?.charAt(0)?.toUpperCase() || "T"
              )}
            </div>

            <span
              className="absolute -bottom-1 -right-2 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-[var(--app-bg)] bg-[var(--app-accent-2)] text-[var(--app-on-accent)] shadow-[0_4px_14px_var(--app-shadow)]"
              aria-hidden="true"
            >
              <Camera size={11} strokeWidth={2.4} />
            </span>
          </div>

          <p className="mt-2 truncate text-[11px] font-semibold text-zinc-300">
            Tu historia
          </p>
        </button>

        {people.map((person) => (
          <button
            key={person.id}
            onClick={storiesComingSoon}
            className="w-[72px] shrink-0 text-center"
          >
            <div className="mx-auto rounded-full bg-[var(--app-accent-fill)] p-[2px]">
              <div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full border-[2px] border-[var(--app-bg)] bg-[#171b23] text-sm font-bold">
                {person.avatar_url ? (
                  <img
                    src={person.avatar_url}
                    alt={person.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  person.username?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>
            </div>

            <p className="mt-2 truncate text-[11px] text-zinc-500">
              @{person.username}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
