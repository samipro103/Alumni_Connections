"use client";

import {
  Check,
  Search,
  Send,
  UserPlus,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import styles from "./SocialInvitePicker.module.css";

type Scope = "community" | "event";

export default function SocialInvitePicker({
  scope,
  targetId,
  communityId,
  label = "Invitar personas",
}: {
  scope: Scope;
  targetId: string | number;
  communityId?: string | null;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<any[]>([]);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void loadPeople();
  }, [open]);

  async function loadPeople() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const me = session?.user?.id;

    if (!me) {
      setPeople([]);
      setLoading(false);
      return;
    }

    const [followingResult, followersResult] = await Promise.all([
      supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", me),
      supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", me),
    ]);

    let ids = [
      ...new Set([
        ...(followingResult.data || []).map(
          (row: any) => row.following_id
        ),
        ...(followersResult.data || []).map(
          (row: any) => row.follower_id
        ),
      ]),
    ].filter((id) => id && id !== me);

    if (scope === "event" && communityId && ids.length) {
      const { data: memberRows } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", communityId)
        .eq("status", "active")
        .in("user_id", ids);

      const allowed = new Set(
        (memberRows || []).map((row: any) => row.user_id)
      );

      ids = ids.filter((id) => allowed.has(id));
    }

    const profilesResult = ids.length
      ? await supabase
          .from("profiles")
          .select(
            "id,username,full_name,avatar_url"
          )
          .in("id", ids)
          .order("username")
      : { data: [] as any[] };

    const invitesResult =
      scope === "community"
        ? await supabase
            .from("community_invites")
            .select("invitee_id,status")
            .eq("community_id", String(targetId))
            .eq("status", "pending")
        : await supabase
            .from("event_invites")
            .select("invitee_id,status")
            .eq("event_id", Number(targetId))
            .eq("status", "pending");

    setPeople(profilesResult.data || []);
    setInvitedIds(
      (invitesResult.data || []).map(
        (row: any) => row.invitee_id
      )
    );
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return people;

    return people.filter((person) =>
      [person.username, person.full_name]
        .filter(Boolean)
        .some((item) =>
          String(item).toLowerCase().includes(value)
        )
    );
  }, [people, query]);

  async function invite(person: any) {
    if (busy || invitedIds.includes(person.id)) return;

    setBusy(person.id);

    const result =
      scope === "community"
        ? await supabase.rpc(
            "alumni_invite_to_community",
            {
              p_community: String(targetId),
              p_invitee: person.id,
            }
          )
        : await supabase.rpc(
            "alumni_invite_to_event",
            {
              p_event: Number(targetId),
              p_invitee: person.id,
            }
          );

    setBusy(null);

    if (result.error) {
      alert(result.error.message);
      return;
    }

    setInvitedIds((current) => [
      ...current,
      person.id,
    ]);
  }

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
      >
        <UserPlus size={15} />
        {label}
      </button>

      {open && (
        <div
          className={styles.backdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <section
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
          >
            <header>
              <div>
                <span>Invitaciones</span>
                <h2>
                  {scope === "community"
                    ? "Invita a tu comunidad"
                    : "Invita a este evento"}
                </h2>
                <p>
                  Solo mostramos personas con las que ya tienes conexión en Alumni.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </header>

            <label className={styles.search}>
              <Search size={15} />
              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Buscar persona..."
                autoFocus
              />
            </label>

            <div className={styles.list}>
              {loading ? (
                <p className={styles.state}>
                  Cargando personas...
                </p>
              ) : filtered.length === 0 ? (
                <p className={styles.state}>
                  No hay personas disponibles para invitar.
                </p>
              ) : (
                filtered.map((person) => {
                  const invited = invitedIds.includes(
                    person.id
                  );

                  return (
                    <div
                      key={person.id}
                      className={styles.row}
                    >
                      <span className={styles.avatar}>
                        {person.avatar_url ? (
                          <img
                            src={person.avatar_url}
                            alt=""
                          />
                        ) : (
                          person.username
                            ?.charAt(0)
                            ?.toUpperCase() || "A"
                        )}
                      </span>

                      <span className={styles.identity}>
                        <strong>
                          {person.full_name ||
                            `@${person.username}`}
                        </strong>
                        <small>
                          @{person.username}
                        </small>
                      </span>

                      <button
                        type="button"
                        data-done={invited ? "true" : "false"}
                        disabled={busy === person.id || invited}
                        onClick={() =>
                          void invite(person)
                        }
                      >
                        {invited ? (
                          <>
                            <Check size={14} />
                            Invitada
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Invitar
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

/* ALUMNI_2_1_2_SOCIAL_INVITE_PICKER */
