"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CircleHelp,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";

function percent(value: any) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function labelCategory(value: string | null) {
  const labels: Record<string, string> = {
    safe: "sin señal",
    threat: "amenaza",
    violence: "violencia",
    harassment: "acoso",
    self_harm: "autolesión",
    sexual: "sexual",
    sexual_image: "sexual en imagen",
    hate: "odio",
    spam: "spam",
    scam: "estafa",
    illicit: "actividad ilícita",
    suspicious_link: "enlace sospechoso",
  };

  return labels[value || ""] || value || "sin señal";
}

function imageSummary(result: any) {
  const image = result?.raw_response?.image;

  if (!image) {
    return result?.raw_response?.coverage?.image?.length
      ? "imagen sin señal local"
      : "sin imagen";
  }

  if (image.status === "error") return "imagen no analizada";

  const top = Object.entries(image.classes || {})
    .map(([name, score]) => ({ name, score: Number(score || 0) }))
    .sort((a, b) => b.score - a.score)[0];

  return top ? `${top.name} ${percent(top.score)}` : "imagen analizada";
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [moderation, setModeration] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);

    const [postsResult, moderationResult] = await Promise.all([
      supabase
        .from("posts")
        .select("*, profiles(username, avatar_url, university, career)")
        .order("created_at", { ascending: false }),
      supabase
        .from("post_moderation_results")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    setPosts(postsResult.data || []);
    setModeration(moderationResult.data || []);
    setLoading(false);
  }

  async function deletePost(id: number) {
    if (!confirm("¿Eliminar esta publicación?")) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPosts();
  }

  async function review(
    resultId: number,
    label: "safe" | "unsafe" | "unsure"
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("post_moderation_results")
      .update({
        human_label: label,
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", resultId);

    if (error) {
      alert(error.message);
      return;
    }

    setModeration((current) =>
      current.map((item) =>
        item.id === resultId
          ? { ...item, human_label: label, reviewed_at: new Date().toISOString() }
          : item
      )
    );
  }

  const moderationByPost = useMemo(
    () => new Map(moderation.map((item) => [Number(item.post_id), item])),
    [moderation]
  );

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return posts;

    return posts.filter((post: any) =>
      [
        post.content,
        post.profiles?.username,
        post.profiles?.university,
        post.profiles?.career,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value))
    );
  }, [posts, search]);

  const totals = useMemo(() => {
    const completed = moderation.filter((item) => item.status === "completed");

    return {
      analyzed: completed.length,
      flagged: completed.filter(
        (item) => item.suggested_action === "review"
      ).length,
      reviewed: moderation.filter((item) => Boolean(item.human_label)).length,
      shield: completed.filter((item) => item.provider === "alumni_shield").length,
    };
  }, [moderation]);

  return (
    <AdminShell
      title="Publicaciones"
      description="Alumni Shield en modo sombra: reglas propias + filtro local de imagen, sin costo por publicación."
    >
      <div className="mb-6 grid grid-cols-4 gap-3 border-b border-white/[0.07] pb-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-700">Analizadas</p>
          <p className="mt-1 text-xl font-black text-zinc-200">{totals.analyzed}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-700">A revisar</p>
          <p className="mt-1 text-xl font-black text-amber-300">{totals.flagged}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-700">Revisadas</p>
          <p className="mt-1 text-xl font-black text-zinc-200">{totals.reviewed}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-700">Shield</p>
          <p className="mt-1 text-xl font-black text-emerald-300">{totals.shield}</p>
        </div>
      </div>

      <div className="mb-5 flex h-11 items-center border-b border-white/[0.07] px-1">
        <Search size={16} className="text-zinc-700" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar publicación..."
          className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700"
        />
        <span className="text-[11px] font-bold text-zinc-700">{filtered.length}</span>
      </div>

      {loading ? (
        <div className="py-14 text-center text-sm text-zinc-600">Cargando publicaciones...</div>
      ) : (
        <div className="space-y-5">
          {filtered.map((post: any) => {
            const result = moderationByPost.get(Number(post.id));

            return (
              <article key={post.id} className="border-b border-white/[0.07] pb-5">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-xs font-bold">
                    {post.profiles?.avatar_url ? (
                      <img src={post.profiles.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      post.profiles?.username?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-zinc-300">@{post.profiles?.username || "usuario"}</p>
                    <p className="mt-1 text-[11px] text-zinc-700">
                      {new Date(post.created_at).toLocaleString("es-SV")}
                    </p>
                    {post.content && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-500">{post.content}</p>
                    )}
                  </div>

                  <button
                    onClick={() => deletePost(post.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-zinc-700 transition hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {post.image_url && (
                  <img src={post.image_url} alt="Publicación" className="mt-4 max-h-72 w-full rounded-2xl object-cover" />
                )}

                <div className="mt-4 border-l border-white/[0.08] pl-4">
                  {!result ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-700">
                      <CircleHelp size={15} />
                      Sin análisis registrado
                    </div>
                  ) : result.status === "error" ? (
                    <div className="text-xs text-red-300/70">Error de moderación: {result.error_message}</div>
                  ) : result.status !== "completed" ? (
                    <div className="text-xs text-zinc-700">Analizando...</div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-3">
                        {result.flagged ? (
                          <span className="flex items-center gap-1.5 text-xs font-black text-red-300">
                            <ShieldAlert size={15} />
                            RIESGO ALTO
                          </span>
                        ) : result.suggested_action === "review" ? (
                          <span className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                            <ShieldAlert size={15} />
                            REVISAR
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
                            <ShieldCheck size={15} />
                            SIN ALERTA
                          </span>
                        )}

                        <span className="text-xs text-zinc-600">
                          Señal mayor: <strong className="text-zinc-400">{labelCategory(result.top_category)}</strong>
                          {" · "}{percent(result.top_score)}
                        </span>

                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-800">
                          {result.provider === "alumni_shield" ? "Alumni Shield" : result.provider}
                        </span>
                      </div>

                      {result.provider === "alumni_shield" && (
                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-zinc-700">
                          <span>
                            Texto: {labelCategory(result?.raw_response?.text?.topCategory || "safe")}
                            {" · "}{percent(result?.raw_response?.text?.topScore || 0)}
                          </span>
                          {post.image_url && <span>Imagen: {imageSummary(result)}</span>}
                        </div>
                      )}

                      {result.error_message && (
                        <p className="mt-2 text-[10px] text-amber-300/65">Nota: {result.error_message}</p>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        <span className="mr-1 text-[10px] font-bold text-zinc-700">Tu revisión:</span>

                        <button
                          type="button"
                          onClick={() => review(result.id, "safe")}
                          className={`flex h-8 items-center gap-1.5 px-2 text-[10px] font-black transition ${
                            result.human_label === "safe"
                              ? "text-emerald-300"
                              : "text-zinc-700 hover:text-zinc-300"
                          }`}
                        >
                          <Check size={13} />
                          Seguro
                        </button>

                        <button
                          type="button"
                          onClick={() => review(result.id, "unsafe")}
                          className={`flex h-8 items-center gap-1.5 px-2 text-[10px] font-black transition ${
                            result.human_label === "unsafe"
                              ? "text-red-300"
                              : "text-zinc-700 hover:text-zinc-300"
                          }`}
                        >
                          <X size={13} />
                          No seguro
                        </button>

                        <button
                          type="button"
                          onClick={() => review(result.id, "unsure")}
                          className={`flex h-8 items-center gap-1.5 px-2 text-[10px] font-black transition ${
                            result.human_label === "unsure"
                              ? "text-amber-300"
                              : "text-zinc-700 hover:text-zinc-300"
                          }`}
                        >
                          <CircleHelp size={13} />
                          Dudoso
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
