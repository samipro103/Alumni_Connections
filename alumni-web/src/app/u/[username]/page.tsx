"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";

export default function UserProfilePage() {

  const params = useParams();
  const username = params.username as string;
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [following, setFollowing] = useState(false);
  const [commentInputs, setCommentInputs] = useState<any>({});

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (!data) return;

    setProfile(data);

    const { data: followersData } = await supabase
      .from("follows")
      .select("*")
      .eq("following_id", data.id);

    setFollowers(followersData?.length || 0);

    const { data: followingData } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", data.id);

    setFollowingCount(followingData?.length || 0);

    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (
          username,
          avatar_url,
          university,
          career
        ),
        likes (
          user_id
        )
      `)
      .eq("user_id", data.id)
      .order("created_at", { ascending: false });

    if (!postsData || postsData.length === 0) {
      setPosts([]);
      return;
    }

    const postIds = postsData.map((p: any) => p.id);

    // COMMENTS
    const { data: commentsData } = await supabase
      .from("comments")
      .select("*")
      .in("post_id", postIds);

    const commentUserIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
    const { data: commentProfiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", commentUserIds);

    const formattedPosts = postsData.map((post: any) => {
      const liked = post.likes.some((like: any) => like.user_id === user?.id);
      const postComments = commentsData
        ?.filter((c: any) => c.post_id === post.id)
        .map((c: any) => ({
          ...c,
          profile: commentProfiles?.find(p => p.id === c.user_id),
        })) || [];

      return {
        ...post,
        likesCount: post.likes.length,
        liked,
        comments: postComments,
      };
    });

    setPosts(formattedPosts);

    const currentUser = session?.user;
    if (currentUser) {

      const { data: followData } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", currentUser.id)
        .eq("following_id", data.id)
        .maybeSingle();

      setFollowing(!!followData);
    }
  }

  async function toggleFollow() {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!profile) return;

    if (following) {

      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profile.id);

      setFollowing(false);
      setFollowers((prev: number) => prev - 1);

    } else {

      await supabase
        .from("follows")
        .insert({
          follower_id: user.id,
          following_id: profile.id,
        });

      await supabase
        .from("notifications")
        .insert({
          user_id: profile.id,
          actor_id: user.id,
          type: "follow",
        });

      setFollowing(true);
      setFollowers((prev: number) => prev + 1);
    }
  }

  async function deletePost(postId: number) {
    const confirmDelete = confirm("¿Eliminar publicación?");
    if (!confirmDelete) return;

    await supabase.from("posts").delete().eq("id", postId);
    getProfile();
  }

  async function toggleLike(postId: number, liked: boolean) {
    if (!user) {
      router.push("/login");
      return;
    }

    if (liked) {
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
      
      const post = posts.find(p => p.id === postId);
      if (post && post.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: "like",
          post_id: postId,
        });
      }
    }
    getProfile();
  }

  async function addComment(postId: number) {
    if (!user) {
      router.push("/login");
      return;
    }

    const comment = commentInputs[postId];
    if (!comment) return;

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: comment,
    });

    const post = posts.find(p => p.id === postId);
    if (post && post.user_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: post.user_id,
        actor_id: user.id,
        type: "comment",
        post_id: postId,
      });
    }

    if (error) {
      alert(error.message);
      return;
    }

    setCommentInputs({ ...commentInputs, [postId]: "" });
    getProfile();
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Perfil no encontrado
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white">

      <div className="relative">
        {profile.banner_url ? (
          <img
            src={profile.banner_url}
            alt="Banner"
            className="h-72 w-full object-cover"
          />
        ) : (
          <div className="h-72 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
        )}
        <div className="absolute inset-x-0 -bottom-16 flex justify-center px-6">
          <div className="w-full max-w-4xl rounded-3xl bg-[#0f1720] border border-zinc-800 shadow-2xl p-6 backdrop-blur">

            <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-end">

              <div className="relative -mt-16 flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="
                      w-36
                      h-36
                      rounded-full
                      object-cover
                      border-4
                      border-[#09090B]
                      ring-4
                      ring-blue-500/20
                      shadow-2xl
                    "
                  />
                ) : (
                  <div className="w-36 h-36 rounded-full bg-zinc-700 border-4 border-[#09090B] flex items-center justify-center text-5xl font-bold text-white shadow-xl">
                    {profile.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>

              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-4xl font-bold">
                  {profile.username ? `@${profile.username}` : "Alumno"}
                </h1>
                <p className="text-lg text-zinc-400 mt-2">
                  {profile.career || "Profesional"}
                </p>
                <p className="text-zinc-500">
                  {profile.university || "Universidad"}
                </p>
                <p className="mt-3 text-zinc-300 max-w-2xl mx-auto lg:mx-0">
                  {profile.bio || "Sin biografía disponible."}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-4">
                    <p className="text-sm text-zinc-500">Universidad</p>
                    <p className="mt-2 font-semibold text-white">
                      {profile.university || "No especificada"}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-4">
                    <p className="text-sm text-zinc-500">Carrera</p>
                    <p className="mt-2 font-semibold text-white">
                      {profile.career || "No especificada"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={toggleFollow}
                  className={`
                    px-8
                    py-3
                    rounded-3xl
                    font-semibold
                    shadow-xl
                    transition-all
                    hover:scale-105
                    ${
                      following
                        ? "bg-zinc-700 hover:bg-zinc-600"
                        : "bg-gradient-to-r from-blue-500 to-purple-600"
                    }
                  `}
                >
                  {following ? "Siguiendo" : "Seguir"}
                </button>

                <button
                  onClick={() => {
                    if (!user) {
                      router.push("/login");
                    } else {
                      router.push(`/messages/${profile.username}`);
                    }
                  }}
                  className="
                    px-6
                    py-3
                    rounded-3xl
                    font-semibold
                    bg-zinc-800
                    hover:bg-zinc-700
                    transition
                  "
                >
                  💬 Mensaje
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="glass rounded-3xl p-5 text-center"
              >
                <p className="text-3xl font-bold">
                  {followers}
                </p>
                <p className="text-zinc-400">
                  Seguidores
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="glass rounded-3xl p-5 text-center"
              >
                <p className="text-3xl font-bold">
                  {followingCount}
                </p>
                <p className="text-zinc-400">
                  Siguiendo
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="glass rounded-3xl p-5 text-center"
              >
                <p className="text-3xl font-bold">
                  {posts.length}
                </p>
                <p className="text-zinc-400">
                  Posts
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-28">
        <h2 className="text-2xl font-bold mb-6">Publicaciones</h2>

        {posts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            Este usuario aún no tiene publicaciones.
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass hover:scale-[1.01] transition-all duration-300">
                  <div className="flex items-start gap-3 mb-4">
                    {post.profiles?.avatar_url ? (
                      <img
                        src={post.profiles.avatar_url}
                        alt="Avatar"
                        className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {post.profiles?.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-1">
                        <span className="font-semibold text-lg">
                          {post.profiles?.username ? `@${post.profiles.username}` : "Alumno"}
                        </span>
                        <span className="text-sm text-zinc-500">
                          {post.profiles?.university || "Universidad"}
                        </span>
                      {post.user_id === user?.id && (
                          <button
                            onClick={() => deletePost(post.id)}
                            className="text-red-500 hover:text-red-400 text-sm"
                          >
                            🗑 Eliminar
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>

                  <p className="text-lg whitespace-pre-wrap mb-4">{post.content}</p>

                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="rounded-2xl w-full max-h-[650px] object-cover mb-4"
                    />
                  )}

                  <div className="flex items-center justify-between text-zinc-400 gap-4 mb-4">
                    <button
                      onClick={() => toggleLike(post.id, post.liked)}
                      className="flex items-center gap-2 hover:text-red-500 transition"
                    >
                      <Heart fill={post.liked ? "currentColor" : "none"} size={22} />
                      <span>{post.likesCount}</span>
                    </button>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-2">
                        <span>💬</span>
                        <span>{post.comments?.length || 0}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {post.comments?.map((comment: any) => (
                      <div key={comment.id} className="bg-zinc-800 rounded-xl p-3">
                        <div className="flex items-center gap-3 mb-2">
                          {comment.profile?.avatar_url ? (
                            <img
                              src={comment.profile.avatar_url}
                              alt="Avatar"
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
                              {comment.profile?.username?.charAt(0).toUpperCase() || "U"}
                            </div>
                          )}
                          <p className="font-semibold text-sm">@{comment.profile?.username}</p>
                        </div>
                        <p className="text-zinc-300">{comment.content}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe un comentario..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 outline-none"
                    />
                    <Button onClick={() => addComment(post.id)}>Comentar</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
