"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";
import AppShell from "@/components/layout/AppShell";
import PostComposer from "@/components/feed/PostComposer";
import { motion } from "framer-motion";

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [commentInputs, setCommentInputs] = useState<any>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  useEffect(() => {
    getPosts();
  }, []);

  async function getPosts() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    setCurrentUser(user);

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
      .order("created_at", { ascending: false });

    if (!postsData) return;

    const { data: commentsData } = await supabase
      .from("comments")
      .select("*");

    const commentUserIds = [
      ...new Set(
        commentsData?.map((comment) => comment.user_id) ||
        []
      ),
    ];

    const { data: commentProfiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", commentUserIds);

    const formattedPosts = postsData.map((post: any) => {
      const liked = post.likes.some(
        (like: any) => like.user_id === user?.id
      );

      const postComments =
        commentsData
          ?.filter(
            (comment: any) => comment.post_id === post.id
          )
          .map((comment: any) => ({
            ...comment,
            profile: commentProfiles?.find(
              (p) => p.id === comment.user_id
            ),
          })) || [];

      return {
        ...post,
        likesCount: post.likes.length,
        liked,
        comments: postComments,
      };
    });

    setPosts(formattedPosts);
  }

  async function uploadImage() {
    if (!image) return null;

    const fileName = `${Date.now()}-${image.name}`;

    const { error } = await supabase.storage
      .from("posts")
      .upload(fileName, image);

    if (error) {
      alert(error.message);
      return null;
    }

    const { data } = supabase.storage
      .from("posts")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function createPost() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user) return;

    let imageUrl = null;
    if (image) {
      imageUrl = await uploadImage();
    }

    const { error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content,
        image_url: imageUrl,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setContent("");
    setImage(null);
    getPosts();
  }

  async function deletePost(postId: number) {
    const confirmDelete = confirm(
      "¿Eliminar publicación?"
    );
    if (!confirmDelete) return;

    await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    getPosts();
  }

  async function toggleLike(
    postId: number,
    liked: boolean
  ) {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user) return;

    if (liked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("likes")
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      const post = posts.find(
        (p: any) => p.id === postId
      );

      if (post && post.user_id !== user.id) {
        await supabase
          .from("notifications")
          .insert({
            user_id: post.user_id,
            actor_id: user.id,
            type: "like",
            post_id: postId,
          });
      }
    }

    getPosts();
  }

  async function addComment(postId: number) {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user) return;

    const comment = commentInputs[postId];
    if (!comment) return;

    const { error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content: comment,
      });

    const post = posts.find(
      (p: any) => p.id === postId
    );

    if (post && post.user_id !== user.id) {
      await supabase
        .from("notifications")
        .insert({
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

    setCommentInputs({
      ...commentInputs,
      [postId]: "",
    });

    getPosts();
  }

  async function sharePost(username: string) {
    await navigator.clipboard.writeText(
      `${window.location.origin}/u/${username}`
    );

    alert("Enlace copiado");
  }

  return (
    <AppShell>
      <main className="text-white">
        <div className="max-w-3xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-5xl font-black gradient-text">
              AlumniConnections
            </h1>
            <p className="text-zinc-400 mt-2">
              Conecta estudiantes y graduados.
            </p>
          </div>

          <PostComposer
            content={content}
            setContent={setContent}
            image={image}
            setImage={setImage}
            createPost={createPost}
          />

          {/* POSTS */}
          <div className="space-y-6">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass hover:scale-[1.01] transition-all duration-300">
                  {/* USER */}
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
                        <a
                          href={`/u/${post.profiles?.username}`}
                          className="font-semibold text-lg hover:text-blue-400 transition"
                        >
                          {post.profiles?.username
                            ? `@${post.profiles.username}`
                            : "Alumno"}
                        </a>

                        <span className="text-sm text-zinc-500">
                          {post.profiles?.university || "Universidad"}
                        </span>

                        {post.user_id === currentUser?.id && (
                          <button
                            onClick={() => deletePost(post.id)}
                            className="
                            text-red-500
                            hover:text-red-400
                            text-sm
                          "
                          >
                            🗑 Eliminar
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-zinc-500 mt-1">
                        {formatDistanceToNow(
                          new Date(post.created_at),
                          {
                            addSuffix: true,
                            locale: es,
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <p className="text-lg whitespace-pre-wrap mb-4">
                    {post.content}
                  </p>

                  {/* IMAGE */}
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      onClick={() =>
                        setSelectedImage(post.image_url)
                      }
                      className="
                      cursor-pointer
                      rounded-2xl
                      w-full
                      max-h-[650px]
                      object-cover
                      mb-4
                    "
                      alt="Post"
                    />
                  )}

                  <div className="flex items-center justify-between text-zinc-400 gap-4 mb-4">
                    <button
                      onClick={() => toggleLike(post.id, post.liked)}
                      className="flex items-center gap-2 hover:text-red-500 transition"
                    >
                      <Heart
                        fill={post.liked ? "currentColor" : "none"}
                        size={22}
                      />
                      <span>{post.likesCount}</span>
                    </button>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-2">
                        <span>💬</span>
                        <span>{post.comments?.length || 0}</span>
                      </span>
                    </div>
                  </div>

                  {/* COMMENTS */}
                  <div className="mt-6 space-y-3">
                    {post.comments?.map((comment: any) => (
                      <div
                        key={comment.id}
                        className="bg-zinc-800 rounded-xl p-3"
                      >
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
                          <p className="font-semibold text-sm">
                            @{comment.profile?.username}
                          </p>
                        </div>

                        <p className="text-zinc-300">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* ADD COMMENT */}
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe un comentario..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs({
                          ...commentInputs,
                          [post.id]: e.target.value,
                        })
                      }
                      className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 outline-none"
                    />

                    <button
                      onClick={() => addComment(post.id)}
                      className="bg-blue-500 hover:bg-blue-600 transition px-4 rounded-xl"
                    >
                      Comentar
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {selectedImage && (
          <div
            onClick={() => setSelectedImage(null)}
            className="
            fixed
            inset-0
            bg-black/90
            z-[9999]
            flex
            items-center
            justify-center
            p-8
          "
          >
            <img
              src={selectedImage}
              className="
              max-h-[90vh]
              max-w-[90vw]
              rounded-2xl
            "
            />
          </div>
        )}
      </main>
    </AppShell>
  );
}

