"use client";

import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Hash,
  Pin,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { hydratePostMedia } from "@/lib/privateMedia";
import styles from "./identity-settings.module.css";

type Visibility =
  | "public"
  | "followers"
  | "private";

type IdentityState = {
  current_kind: string;
  current_text: string;
  current_emoji: string;
  current_visibility: Visibility;
  interests_visibility: Visibility;
  connections_visibility: Visibility;
};

const DEFAULTS: IdentityState = {
  current_kind: "doing",
  current_text: "",
  current_emoji: "✦",
  current_visibility: "public",
  interests_visibility: "public",
  connections_visibility: "followers",
};

const CURRENT_OPTIONS = [
  ["doing", "Haciendo"],
  ["listening", "Escuchando"],
  ["learning", "Aprendiendo"],
  ["watching", "Viendo"],
  ["thinking", "Pensando en"],
  ["other", "Actualmente"],
] as const;

function visibilityLabel(
  value: Visibility
) {
  if (value === "public") {
    return "Público";
  }

  if (value === "followers") {
    return "Seguidores";
  }

  return "Solo yo";
}

export default function IdentitySettingsPage() {
  const router = useRouter();
  const { user, loading } =
    useAuth();

  const [form, setForm] =
    useState<IdentityState>(
      DEFAULTS
    );

  const [interests, setInterests] =
    useState<any[]>([]);

  const [interestInput, setInterestInput] =
    useState("");

  const [posts, setPosts] =
    useState<any[]>([]);

  const [pinnedIds, setPinnedIds] =
    useState<number[]>([]);

  const [saving, setSaving] =
    useState(false);

  const [loadingData, setLoadingData] =
    useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    void loadData();
  }, [user?.id]);

  async function loadData() {
    if (!user) return;

    setLoadingData(true);

    const [
      settingsResult,
      interestsResult,
      postsResult,
      pinsResult,
    ] = await Promise.all([
      supabase
        .from(
          "profile_identity_settings"
        )
        .select("*")
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle(),

      supabase
        .from(
          "profile_interests"
        )
        .select(
          "id,interest,sort_order"
        )
        .eq(
          "user_id",
          user.id
        )
        .order(
          "sort_order",
          {
            ascending: true,
          }
        )
        .order("id", {
          ascending: true,
        }),

      supabase
        .from("posts")
        .select(
          "id,content,image_url,created_at"
        )
        .eq(
          "user_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(30),

      supabase
        .from(
          "profile_pinned_posts"
        )
        .select(
          "post_id,sort_order"
        )
        .eq(
          "user_id",
          user.id
        )
        .order(
          "sort_order",
          {
            ascending: true,
          }
        ),
    ]);

    setForm({
      ...DEFAULTS,
      ...(settingsResult.data ||
        {}),
    });

    setInterests(
      interestsResult.data ||
        []
    );

    const hydratedPosts =
      await hydratePostMedia(
        (postsResult.data || []) as any[]
      );

    setPosts(
      hydratedPosts
    );

    setPinnedIds(
      (
        pinsResult.data ||
        []
      ).map(
        (item: any) =>
          Number(item.post_id)
      )
    );

    setLoadingData(false);
  }

  async function addInterest() {
    if (!user) return;

    const value =
      interestInput
        .trim()
        .replace(/\s+/g, " ");

    if (
      value.length < 2 ||
      interests.length >= 12
    ) {
      return;
    }

    if (
      interests.some(
        (item) =>
          item.interest
            .toLowerCase() ===
          value.toLowerCase()
      )
    ) {
      setInterestInput("");
      return;
    }

    const { data, error } =
      await supabase
        .from(
          "profile_interests"
        )
        .insert({
          user_id: user.id,
          interest: value,
          sort_order:
            interests.length,
        })
        .select(
          "id,interest,sort_order"
        )
        .single();

    if (error) {
      alert(error.message);
      return;
    }

    setInterests(
      (current) => [
        ...current,
        data,
      ]
    );

    setInterestInput("");
  }

  async function removeInterest(
    id: number
  ) {
    if (!user) return;

    const previous =
      interests;

    setInterests(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
    );

    const { error } =
      await supabase
        .from(
          "profile_interests"
        )
        .delete()
        .eq(
          "user_id",
          user.id
        )
        .eq("id", id);

    if (error) {
      setInterests(previous);
      alert(error.message);
    }
  }

  function togglePin(
    postId: number
  ) {
    setPinnedIds(
      (current) => {
        if (
          current.includes(
            postId
          )
        ) {
          return current.filter(
            (id) =>
              id !== postId
          );
        }

        if (
          current.length >= 3
        ) {
          return current;
        }

        return [
          ...current,
          postId,
        ];
      }
    );
  }

  async function save() {
    if (!user || saving) {
      return;
    }

    setSaving(true);

    try {
      const {
        error:
          settingsError,
      } = await supabase
        .from(
          "profile_identity_settings"
        )
        .upsert(
          {
            user_id: user.id,
            current_kind:
              form.current_text.trim()
                ? form.current_kind
                : null,
            current_text:
              form.current_text
                .trim() ||
              null,
            current_emoji:
              form.current_text.trim()
                ? form.current_emoji
                    .trim()
                    .slice(
                      0,
                      12
                    ) || "✦"
                : null,
            current_visibility:
              form.current_visibility,
            interests_visibility:
              form.interests_visibility,
            connections_visibility:
              form.connections_visibility,
            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              "user_id",
          }
        );

      if (settingsError) {
        throw settingsError;
      }

      const {
        error:
          deletePinsError,
      } = await supabase
        .from(
          "profile_pinned_posts"
        )
        .delete()
        .eq(
          "user_id",
          user.id
        );

      if (deletePinsError) {
        throw deletePinsError;
      }

      if (
        pinnedIds.length
      ) {
        const {
          error:
            pinsError,
        } = await supabase
          .from(
            "profile_pinned_posts"
          )
          .insert(
            pinnedIds.map(
              (
                postId,
                index
              ) => ({
                user_id:
                  user.id,
                post_id:
                  postId,
                sort_order:
                  index,
              })
            )
          );

        if (pinsError) {
          throw pinsError;
        }
      }

      router.push(
        "/profile"
      );
    } catch (
      error: any
    ) {
      alert(
        error?.message ||
          "No se pudo guardar."
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedPins =
    useMemo(
      () =>
        new Set(
          pinnedIds
        ),
      [pinnedIds]
    );

  if (
    loadingData
  ) {
    return (
      <AppShell>
        <div className={styles.loading}>
          Preparando tu identidad...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className={styles.page}>
        <header className={styles.header}>
          <button
            type="button"
            onClick={() =>
              router.back()
            }
          >
            <ArrowLeft
              size={17}
            />
            Volver
          </button>

          <div>
            <span>
              Perfil
            </span>

            <h1>
              Tu identidad en Alumni
            </h1>

            <p>
              No es un currículum. Es una forma rápida de mostrar qué te interesa y qué te representa ahora.
            </p>
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <div>
              <span>
                Actualmente
              </span>
              <h2>
                Qué está pasando contigo
              </h2>
            </div>

            <Sparkles
              size={18}
            />
          </div>

          <div className={styles.currentGrid}>
            <label>
              <span>
                Estado
              </span>

              <select
                value={
                  form.current_kind
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      current_kind:
                        event
                          .target
                          .value,
                    })
                  )
                }
              >
                {CURRENT_OPTIONS.map(
                  ([
                    value,
                    label,
                  ]) => (
                    <option
                      key={
                        value
                      }
                      value={
                        value
                      }
                    >
                      {
                        label
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span>
                Emoji
              </span>

              <input
                value={
                  form.current_emoji
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      current_emoji:
                        event
                          .target
                          .value,
                    })
                  )
                }
                maxLength={
                  12
                }
                placeholder="✦"
              />
            </label>
          </div>

          <label className={styles.textareaLabel}>
            <span>
              Cuéntalo en una frase
            </span>

            <textarea
              value={
                form.current_text
              }
              onChange={(
                event
              ) =>
                setForm(
                  (
                    current
                  ) => ({
                    ...current,
                    current_text:
                      event
                        .target
                        .value,
                  })
                )
              }
              maxLength={
                120
              }
              placeholder="Ej. aprendiendo fotografía analógica, viendo una serie nueva, entrenando para una carrera..."
            />

            <small>
              {
                form
                  .current_text
                  .length
              }
              /120
            </small>
          </label>

          <VisibilityControl
            value={
              form.current_visibility
            }
            onChange={(
              value
            ) =>
              setForm(
                (
                  current
                ) => ({
                  ...current,
                  current_visibility:
                    value,
                })
              )
            }
          />
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <div>
              <span>
                Intereses
              </span>

              <h2>
                Lo que te mueve
              </h2>
            </div>

            <Hash
              size={18}
            />
          </div>

          <div className={styles.interestInput}>
            <input
              value={
                interestInput
              }
              onChange={(
                event
              ) =>
                setInterestInput(
                  event
                    .target
                    .value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault();
                  void addInterest();
                }
              }}
              maxLength={
                36
              }
              placeholder="Música, fútbol, cine, gaming, fotografía..."
            />

            <button
              type="button"
              onClick={() =>
                void addInterest()
              }
              disabled={
                interests.length >=
                12
              }
            >
              <Plus
                size={15}
              />
              Agregar
            </button>
          </div>

          <div className={styles.interests}>
            {interests.map(
              (item) => (
                <span
                  key={
                    item.id
                  }
                >
                  {
                    item.interest
                  }

                  <button
                    type="button"
                    onClick={() =>
                      void removeInterest(
                        item.id
                      )
                    }
                  >
                    <X
                      size={
                        12
                      }
                    />
                  </button>
                </span>
              )
            )}
          </div>

          <p className={styles.helper}>
            Máximo 12. No hace falta llenar todo; pocos intereses bien elegidos dicen más.
          </p>

          <VisibilityControl
            value={
              form.interests_visibility
            }
            onChange={(
              value
            ) =>
              setForm(
                (
                  current
                ) => ({
                  ...current,
                  interests_visibility:
                    value,
                })
              )
            }
          />
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <div>
              <span>
                Fijado
              </span>

              <h2>
                Elige hasta 3 publicaciones
              </h2>
            </div>

            <Pin
              size={18}
            />
          </div>

          {posts.length ? (
            <div className={styles.postList}>
              {posts.map(
                (
                  post: any
                ) => {
                  const active =
                    selectedPins.has(
                      Number(
                        post.id
                      )
                    );

                  return (
                    <button
                      key={
                        post.id
                      }
                      type="button"
                      data-active={
                        active
                          ? "true"
                          : "false"
                      }
                      onClick={() =>
                        togglePin(
                          Number(
                            post.id
                          )
                        )
                      }
                    >
                      <span className={styles.postPreview}>
                        {post.image_url ? (
                          <img
                            src={
                              post.image_url
                            }
                            alt=""
                          />
                        ) : (
                          <span>
                            {String(
                              post.content ||
                                ""
                            )
                              .slice(
                                0,
                                80
                              )
                              .trim() ||
                              "Publicación"}
                          </span>
                        )}
                      </span>

                      <span className={styles.postCopy}>
                        <strong>
                          {String(
                            post.content ||
                              ""
                          )
                            .slice(
                              0,
                              100
                            )
                            .trim() ||
                            "Publicación con imagen"}
                        </strong>

                        <small>
                          {new Date(
                            post.created_at
                          ).toLocaleDateString(
                            "es-SV",
                            {
                              day:
                                "numeric",
                              month:
                                "short",
                            }
                          )}
                        </small>
                      </span>

                      <span className={styles.pinCheck}>
                        {active ? (
                          <Check
                            size={
                              15
                            }
                          />
                        ) : (
                          <Pin
                            size={
                              14
                            }
                          />
                        )}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          ) : (
            <p className={styles.helper}>
              Cuando publiques algo podrás fijarlo aquí.
            </p>
          )}

          <p className={styles.helper}>
            {
              pinnedIds.length
            }
            /3 seleccionadas
          </p>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <div>
              <span>
                Conexiones
              </span>

              <h2>
                Quién puede ver tu red
              </h2>
            </div>

            <Eye
              size={18}
            />
          </div>

          <VisibilityControl
            value={
              form.connections_visibility
            }
            onChange={(
              value
            ) =>
              setForm(
                (
                  current
                ) => ({
                  ...current,
                  connections_visibility:
                    value,
                })
              )
            }
            standalone
          />
        </section>

        <footer className={styles.footer}>
          <button
            type="button"
            onClick={() =>
              router.back()
            }
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() =>
              void save()
            }
            disabled={
              saving
            }
          >
            <Check
              size={16}
            />
            {saving
              ? "Guardando..."
              : "Guardar cambios"}
          </button>
        </footer>
      </main>
    </AppShell>
  );
}

function VisibilityControl({
  value,
  onChange,
  standalone = false,
}: {
  value: Visibility;
  onChange: (
    value: Visibility
  ) => void;
  standalone?: boolean;
}) {
  return (
    <div
      className={`${styles.visibility} ${
        standalone
          ? styles.visibilityStandalone
          : ""
      }`}
    >
      <span>
        Visibilidad
      </span>

      <div>
        {(
          [
            "public",
            "followers",
            "private",
          ] as Visibility[]
        ).map(
          (option) => (
            <button
              key={
                option
              }
              type="button"
              data-active={
                value ===
                option
                  ? "true"
                  : "false"
              }
              onClick={() =>
                onChange(
                  option
                )
              }
            >
              {option ===
              "private" ? (
                <EyeOff
                  size={
                    12
                  }
                />
              ) : (
                <Eye
                  size={
                    12
                  }
                />
              )}
              {
                visibilityLabel(
                  option
                )
              }
            </button>
          )
        )}
      </div>
    </div>
  );
}

/* ALUMNI_1_8_0_IDENTITY_SETTINGS */
