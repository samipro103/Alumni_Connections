"use client";

import {
  ArrowLeft,
  Bookmark,
  Check,
  Globe2,
  Heart,
  MessageCircle,
  Plane,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import "./social-passport.css";

async function sign(path?: string | null) {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from("passport-media")
    .createSignedUrl(path, 60 * 30);

  return error ? null : data?.signedUrl || null;
}

function initials(value?: string | null) {
  return (
    String(value || "A")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || "A"
  );
}

export default function SocialPassportPage() {
  const params = useParams();
  const username = String(params.username || "");
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadPassport();
  }, [username, user?.id]);

  useEffect(() => {
    if (!activeId) {
      setMedia([]);
      setLikes([]);
      setComments([]);
      setSaved(false);
      return;
    }

    void loadCountrySocial(activeId);
  }, [activeId, user?.id]);

  async function loadPassport() {
    setLoading(true);

    const { data: profileData } = await supabase
      .from("profiles")
      .select(
        "id,username,full_name,avatar_url,is_private,city,country"
      )
      .eq("username", username)
      .maybeSingle();

    if (!profileData) {
      setProfile(null);
      setCountries([]);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const { data: countryRows } = await supabase
      .from("passport_countries")
      .select(
        "id,user_id,country_name,country_code,note,theme_style,cover_media_path,created_at"
      )
      .eq("user_id", profileData.id)
      .order("created_at", { ascending: false });

    const hydrated = await Promise.all(
      (countryRows || []).map(
        async (row: any) => ({
          ...row,
          cover_url: await sign(row.cover_media_path),
        })
      )
    );

    setCountries(hydrated);

    const requested =
      typeof window !== "undefined"
        ? new URLSearchParams(
            window.location.search
          ).get("country")
        : null;

    const requestedExists =
      requested &&
      hydrated.some(
        (item: any) =>
          String(item.id) === String(requested)
      );

    setActiveId(
      requestedExists
        ? requested
        : hydrated[0]?.id || null
    );

    setLoading(false);
  }

  async function loadCountrySocial(
    countryId: string
  ) {
    const [
      mediaResult,
      likesResult,
      commentsResult,
      savedResult,
    ] = await Promise.all([
      supabase
        .from("passport_media")
        .select(
          "id,media_path,caption,created_at"
        )
        .eq(
          "passport_country_id",
          countryId
        )
        .order("created_at", {
          ascending: false,
        }),
      supabase
        .from("passport_country_likes")
        .select("user_id,created_at")
        .eq("country_id", countryId),
      supabase
        .from("passport_country_comments")
        .select(
          "id,user_id,content,created_at"
        )
        .eq("country_id", countryId)
        .order("created_at", {
          ascending: true,
        }),
      user
        ? supabase
            .from("passport_destination_saves")
            .select("country_id")
            .eq("country_id", countryId)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({
            data: null,
          } as any),
    ]);

    const hydratedMedia = await Promise.all(
      (mediaResult.data || []).map(
        async (row: any) => ({
          ...row,
          media_url: await sign(
            row.media_path
          ),
        })
      )
    );

    const commentUserIds = [
      ...new Set(
        (commentsResult.data || []).map(
          (row: any) => row.user_id
        )
      ),
    ];

    const commentProfiles =
      commentUserIds.length > 0
        ? await supabase
            .from("profiles")
            .select(
              "id,username,full_name,avatar_url"
            )
            .in("id", commentUserIds)
        : { data: [] as any[] };

    const profileMap = new Map(
      (commentProfiles.data || []).map(
        (row: any) => [row.id, row]
      )
    );

    setMedia(hydratedMedia);
    setLikes(likesResult.data || []);
    setComments(
      (commentsResult.data || []).map(
        (row: any) => ({
          ...row,
          profile:
            profileMap.get(row.user_id) ||
            null,
        })
      )
    );
    setSaved(Boolean(savedResult.data));
  }

  const activeCountry = useMemo(
    () =>
      countries.find(
        (item) => item.id === activeId
      ) || null,
    [countries, activeId]
  );

  const liked = useMemo(
    () =>
      Boolean(
        user &&
          likes.some(
            (item: any) =>
              item.user_id === user.id
          )
      ),
    [likes, user?.id]
  );

  async function toggleLike() {
    if (!user || !activeCountry || busy) {
      return;
    }

    setBusy(true);

    if (liked) {
      await supabase
        .from("passport_country_likes")
        .delete()
        .eq("country_id", activeCountry.id)
        .eq("user_id", user.id);
    } else {
      const { error } = await supabase
        .from("passport_country_likes")
        .insert({
          country_id: activeCountry.id,
          user_id: user.id,
        });

      if (error) {
        alert(error.message);
        setBusy(false);
        return;
      }
    }

    setBusy(false);
    await loadCountrySocial(
      activeCountry.id
    );
  }

  async function toggleNextDestination() {
    if (!user || !activeCountry || busy) {
      return;
    }

    setBusy(true);

    if (saved) {
      await supabase
        .from("passport_destination_saves")
        .delete()
        .eq(
          "country_id",
          activeCountry.id
        )
        .eq("user_id", user.id);

      const { data: travel } =
        await supabase
          .from("profile_travel_status")
          .select(
            "source_passport_country_id"
          )
          .eq("user_id", user.id)
          .maybeSingle();

      if (
        travel?.source_passport_country_id ===
        activeCountry.id
      ) {
        await supabase
          .from("profile_travel_status")
          .delete()
          .eq("user_id", user.id);
      }
    } else {
      const { error: saveError } =
        await supabase
          .from("passport_destination_saves")
          .insert({
            country_id: activeCountry.id,
            user_id: user.id,
          });

      if (saveError) {
        alert(saveError.message);
        setBusy(false);
        return;
      }

      const { error: travelError } =
        await supabase
          .from("profile_travel_status")
          .upsert(
            {
              user_id: user.id,
              next_destination_name:
                activeCountry.country_name,
              next_destination_code:
                activeCountry.country_code,
              source_passport_country_id:
                activeCountry.id,
            },
            { onConflict: "user_id" }
          );

      if (travelError) {
        alert(travelError.message);
      }
    }

    setBusy(false);
    await loadCountrySocial(
      activeCountry.id
    );
  }

  async function addComment() {
    if (
      !user ||
      !activeCountry ||
      !commentInput.trim() ||
      busy
    ) {
      return;
    }

    setBusy(true);

    const { error } = await supabase
      .from("passport_country_comments")
      .insert({
        country_id: activeCountry.id,
        user_id: user.id,
        content: commentInput.trim(),
      });

    setBusy(false);

    if (error) {
      alert(error.message);
      return;
    }

    setCommentInput("");
    await loadCountrySocial(
      activeCountry.id
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="social-passport-state">
          Cargando pasaporte...
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="social-passport-state">
          Pasaporte no encontrado.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="social-passport mx-auto w-full max-w-[1040px]">
        <header className="social-passport-hero">
          <Link
            href={`/u/${profile.username}`}
            className="social-passport-back"
          >
            <ArrowLeft size={16} />
            Perfil
          </Link>

          <div className="social-passport-owner">
            <span className="social-passport-avatar">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                />
              ) : (
                initials(
                  profile.full_name ||
                    profile.username
                )
              )}
            </span>

            <div>
              <span>Pasaporte Alumni</span>
              <h1>
                {profile.full_name ||
                  `@${profile.username}`}
              </h1>
              <p>
                Países, recuerdos y lugares
                que forman parte de su historia.
              </p>
            </div>
          </div>
        </header>

        {countries.length === 0 ? (
          <section className="social-passport-empty">
            <Globe2 size={27} />
            <strong>
              Todavía no hay países
              disponibles.
            </strong>
            <p>
              Cuando esta persona agregue su
              primer destino, aparecerá aquí.
            </p>
          </section>
        ) : (
          <>
            <nav className="social-passport-countries">
              {countries.map(
                (country: any) => (
                  <button
                    key={country.id}
                    type="button"
                    data-active={
                      activeId === country.id
                        ? "true"
                        : "false"
                    }
                    onClick={() =>
                      setActiveId(country.id)
                    }
                    className={`theme-${
                      country.theme_style ||
                      "aurora"
                    }`}
                  >
                    <div>
                      {country.cover_url ? (
                        <img
                          src={country.cover_url}
                          alt={
                            country.country_name
                          }
                        />
                      ) : (
                        <Globe2 size={22} />
                      )}
                    </div>
                    <span>
                      {country.country_code}
                    </span>
                    <strong>
                      {country.country_name}
                    </strong>
                  </button>
                )
              )}
            </nav>

            {activeCountry && (
              <section className="social-passport-album">
                <header className="social-passport-album-head">
                  <div>
                    <span>
                      {activeCountry.country_code}
                    </span>
                    <h2>
                      {activeCountry.country_name}
                    </h2>
                    <p>
                      {activeCountry.note ||
                        "Un álbum de recuerdos en Alumni."}
                    </p>
                  </div>

                  <div className="social-passport-actions">
                    <button
                      type="button"
                      data-active={
                        liked
                          ? "true"
                          : "false"
                      }
                      onClick={() =>
                        void toggleLike()
                      }
                    >
                      <Heart
                        size={17}
                        fill={
                          liked
                            ? "currentColor"
                            : "none"
                        }
                      />
                      <span>
                        {likes.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      data-active={
                        saved
                          ? "true"
                          : "false"
                      }
                      onClick={() =>
                        void toggleNextDestination()
                      }
                    >
                      {saved ? (
                        <Check size={17} />
                      ) : (
                        <Plane size={17} />
                      )}
                      <span>
                        {saved
                          ? "Próximo destino"
                          : "Quiero ir"}
                      </span>
                    </button>
                  </div>
                </header>

                {media.length > 0 ? (
                  <div className="social-passport-media">
                    {media.map(
                      (item: any) => (
                        <figure key={item.id}>
                          {item.media_url && (
                            <img
                              src={
                                item.media_url
                              }
                              alt={
                                item.caption ||
                                activeCountry.country_name
                              }
                            />
                          )}
                          {item.caption && (
                            <figcaption>
                              {item.caption}
                            </figcaption>
                          )}
                        </figure>
                      )
                    )}
                  </div>
                ) : (
                  <div className="social-passport-empty compact">
                    <Globe2 size={23} />
                    <strong>
                      Aún no hay fotos en este
                      país.
                    </strong>
                  </div>
                )}

                <section className="social-passport-comments">
                  <header>
                    <div>
                      <span>Conversación</span>
                      <h3>
                        {comments.length}{" "}
                        {comments.length === 1
                          ? "comentario"
                          : "comentarios"}
                      </h3>
                    </div>
                    <MessageCircle size={18} />
                  </header>

                  {comments.length > 0 && (
                    <div className="social-passport-comment-list">
                      {comments.map(
                        (comment: any) => (
                          <article
                            key={comment.id}
                          >
                            <span className="social-passport-comment-avatar">
                              {comment.profile
                                ?.avatar_url ? (
                                <img
                                  src={
                                    comment
                                      .profile
                                      .avatar_url
                                  }
                                  alt=""
                                />
                              ) : (
                                initials(
                                  comment
                                    .profile
                                    ?.full_name ||
                                    comment
                                      .profile
                                      ?.username
                                )
                              )}
                            </span>

                            <div>
                              <strong>
                                {comment.profile
                                  ?.full_name ||
                                  `@${
                                    comment
                                      .profile
                                      ?.username ||
                                    "alumni"
                                  }`}
                              </strong>
                              <p>
                                {
                                  comment.content
                                }
                              </p>
                            </div>
                          </article>
                        )
                      )}
                    </div>
                  )}

                  {user ? (
                    <div className="social-passport-comment-box">
                      <input
                        value={commentInput}
                        maxLength={800}
                        onChange={(event) =>
                          setCommentInput(
                            event.target.value
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey
                          ) {
                            event.preventDefault();
                            void addComment();
                          }
                        }}
                        placeholder="Escribe un comentario..."
                      />
                      <button
                        type="button"
                        disabled={
                          busy ||
                          !commentInput.trim()
                        }
                        onClick={() =>
                          void addComment()
                        }
                        aria-label="Enviar comentario"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  ) : null}
                </section>
              </section>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}

/* ALUMNI_2_3_0_SOCIAL_PASSPORT_PAGE */
