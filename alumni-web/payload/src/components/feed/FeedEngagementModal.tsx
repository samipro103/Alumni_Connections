"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";

type Mode = "likes" | "reposts";

export default function FeedEngagementModal({
  postId,
  mode,
  onClose,
}: {
  postId: number | null;
  mode: Mode;
  onClose: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!postId) {
      setProfiles([]);
      return;
    }

    let active = true;

    void (async () => {
      setLoading(true);

      const table = mode === "likes" ? "likes" : "post_reposts";

      const { data: rows } = await supabase
        .from(table)
        .select("user_id,created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      const ids = [
        ...new Set(
          (rows || [])
            .map((row: any) => row.user_id)
            .filter(Boolean)
        ),
      ];

      let profileRows: any[] = [];

      if (ids.length) {
        const { data } = await supabase
          .from("profiles")
          .select(
            "id,username,full_name,avatar_url,university,career"
          )
          .in("id", ids);

        const order = new Map(
          ids.map((id, index) => [id, index])
        );

        profileRows = (data || []).sort(
          (a: any, b: any) =>
            (order.get(a.id) ?? 999) -
            (order.get(b.id) ?? 999)
        );
      }

      if (active) {
        setProfiles(profileRows);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [postId, mode]);

  if (!ready || !postId) return null;

  return createPortal(
    <div
      className="alumni-feed-modal-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <section className="alumni-feed-people-modal">
        <header>
          <div>
            <span>Actividad</span>
            <h3>
              {mode === "likes"
                ? "Me gusta"
                : "Compartidos"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="alumni-feed-people-list">
          {loading ? (
            <p className="alumni-feed-modal-empty">
              Cargando...
            </p>
          ) : profiles.length ? (
            profiles.map((profile) => (
              <a
                key={profile.id}
                href={`/u/${profile.username}`}
                onClick={onClose}
                className="alumni-feed-person"
              >
                <span className="alumni-feed-person-avatar">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                    />
                  ) : (
                    profile.username?.charAt(0)?.toUpperCase() ||
                    "A"
                  )}
                </span>

                <span className="alumni-feed-person-copy">
                  <strong>
                    {profile.full_name ||
                      `@${profile.username}`}
                  </strong>
                  <small>
                    @{profile.username}
                    {profile.career
                      ? ` · ${profile.career}`
                      : ""}
                  </small>
                </span>
              </a>
            ))
          ) : (
            <p className="alumni-feed-modal-empty">
              Todavía no hay actividad.
            </p>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}

/* ALUMNI_1_4_0_ENGAGEMENT_MODAL */
