"use client";

import {
  ArrowLeft,
  Hash,
  TrendingUp,
} from "lucide-react";
import { useParams } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";
import AppShell from "@/components/layout/AppShell";
import ExplorePostCard from "@/components/explore/ExplorePostCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { hydratePostMedia } from "@/lib/privateMedia";
import { hydratePostMediaItems } from "@/lib/feedMedia";
import "../../explore-pro.css";

async function hydratePosts(postIds: number[]) {
  if (!postIds.length) return [];

  const [
    { data: postsData },
    { data: commentsData },
    { data: repostData },
    { data: mediaRaw },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select(`
        *,
        profiles (
          id,
          username,
          avatar_url,
          full_name,
          university,
          education_institution_name,
          education_program_name,
          career,
          city,
          country,
          residence_country_code
        ),
        likes (
          user_id
        )
      `)
      .in("id", postIds),
    supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds),
    supabase
      .from("post_reposts")
      .select("post_id")
      .in("post_id", postIds),
    supabase
      .from("post_media")
      .select("*")
      .in("post_id", postIds)
      .order("sort_order", { ascending: true }),
  ]);

  const hydrated = await hydratePostMedia(
    (postsData || []) as any[]
  );
  const mediaRows = await hydratePostMediaItems(
    (mediaRaw || []) as any[]
  );

  const byId = new Map(
    hydrated.map((post: any) => [
      post.id,
      {
        ...post,
        likesCount: post.likes?.length || 0,
        commentsCount: (commentsData || []).filter(
          (row: any) => row.post_id === post.id
        ).length,
        repostsCount: (repostData || []).filter(
          (row: any) => row.post_id === post.id
        ).length,
        mediaItems: mediaRows.filter(
          (row: any) => row.post_id === post.id
        ),
      },
    ])
  );

  return postIds
    .map((id) => byId.get(id))
    .filter(Boolean);
}

export default function ExploreTagPage() {
  const { user } = useAuth();
  const params = useParams<{ tag: string }>();
  const tag = decodeURIComponent(
    String(params?.tag || "")
  )
    .replace(/^#/, "")
    .toLowerCase();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tag) return;

    let active = true;

    void (async () => {
      setLoading(true);

      const { data } = await supabase.rpc(
        "alumni_search_post_ids",
        {
          p_query: `#${tag}`,
          p_limit: 80,
        }
      );

      const ids = (data || []).map(
        (row: any) => Number(row.post_id)
      );

      const hydrated = await hydratePosts(ids);

      if (!active) return;

      const filtered = hydrated.filter((post: any) =>
        (
          String(post.content || "").match(
            /#[A-Za-z0-9_]{2,40}/g
          ) || []
        ).some(
          (value) =>
            value.slice(1).toLowerCase() === tag
        )
      );

      setPosts(filtered);
      setLoading(false);

      if (user) {
        void supabase.rpc(
          "alumni_record_discovery_signal",
          {
            p_signal_type: "hashtag",
            p_signal_value: tag,
            p_weight: 2.2,
          }
        );
      }
    })();

    return () => {
      active = false;
    };
  }, [tag, user?.id]);

  return (
    <AppShell>
      <main className="alumni-explore-pro mx-auto w-full max-w-[860px]">
        <header className="alumni-explore-hero">
          <a
            href="/explore"
            className="mb-5 inline-flex items-center gap-2 text-[12px] font-bold text-[var(--app-muted-2)] hover:text-[var(--app-text)]"
          >
            <ArrowLeft size={16} />
            Explorar
          </a>

          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <Hash size={20} />
            </span>

            <div>
              <p className="alumni-explore-eyebrow">
                Tema
              </p>
              <h1 className="!mt-1 !text-[34px] sm:!text-[42px]">
                #{tag}
              </h1>
            </div>
          </div>

          <p className="alumni-explore-lead">
            Publicaciones recientes y relevantes de este tema dentro de Alumni.
          </p>
        </header>

        <section className="alumni-explore-section">
          <div className="alumni-explore-section-title">
            <div>
              <span>Conversación</span>
              <h2>
                {posts.length}{" "}
                {posts.length === 1
                  ? "publicación"
                  : "publicaciones"}
              </h2>
            </div>

            <TrendingUp size={18} />
          </div>

          {loading ? (
            <div className="alumni-explore-empty">
              Cargando #{tag}...
            </div>
          ) : posts.length ? (
            <div className="alumni-explore-post-list">
              {posts.map((post) => (
                <ExplorePostCard
                  key={post.id}
                  post={post}
                  onOpen={() => {
                    if (!user) return;

                    void supabase.rpc(
                      "alumni_record_discovery_signal",
                      {
                        p_signal_type: "post",
                        p_signal_value: String(post.id),
                        p_weight: 1.6,
                      }
                    );
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="alumni-explore-empty">
              Todavía no hay publicaciones visibles con #{tag}.
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}

/* ALUMNI_1_6_0_HASHTAG_FEED */
