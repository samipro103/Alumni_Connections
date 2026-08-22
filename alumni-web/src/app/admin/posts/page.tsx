"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);

    const { data } = await supabase
      .from("posts")
      .select("*, profiles(username, avatar_url, university, career)")
      .order("created_at", { ascending: false });

    setPosts(data || []);
    setLoading(false);
  }

  async function deletePost(id: number) {
    if (!confirm("¿Eliminar esta publicación?")) return;

    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPosts();
  }

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return posts;

    return posts.filter((post: any) =>
      [post.content, post.profiles?.username, post.profiles?.university, post.profiles?.career]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value))
    );
  }, [posts, search]);

  return (
    <AdminShell title="Publicaciones" description="Moderación del contenido publicado en la plataforma.">
      <div className="mb-5 flex h-11 items-center rounded-xl border border-white/[0.07] bg-white/[0.035] px-3">
        <Search size={16} className="text-zinc-700" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar publicación..." className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700" />
        <span className="text-[11px] font-bold text-zinc-700">{filtered.length}</span>
      </div>

      {loading ? (
        <div className="py-14 text-center text-sm text-zinc-600">Cargando publicaciones...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post: any) => (
            <article key={post.id} className="overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#101318]/95">
              <div className="flex gap-3 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-xs font-bold">
                  {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="Avatar" className="h-full w-full object-cover" /> : post.profiles?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-zinc-300">@{post.profiles?.username || "usuario"}</p>
                  <p className="mt-1 text-[11px] text-zinc-700">{new Date(post.created_at).toLocaleString("es-SV")}</p>
                  {post.content && <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-zinc-500">{post.content}</p>}
                </div>

                <button onClick={() => deletePost(post.id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-700 transition hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>

              {post.image_url && <img src={post.image_url} alt="Publicación" className="max-h-72 w-full object-cover" />}
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
