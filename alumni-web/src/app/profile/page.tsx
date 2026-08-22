"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {

  const router = useRouter();
  const { user, loading } = useAuth();

  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading]);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {

    try {

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setProfileLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      setProfile(data);

      // Followers
      const { data: followersData } = await supabase
        .from("follows")
        .select("*")
        .eq("following_id", authUser.id);

      setFollowers(followersData?.length || 0);

      // Following
      const { data: followingData } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", authUser.id);

      setFollowing(followingData?.length || 0);

      // Posts
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", authUser.id);

      setPostsCount(postsData?.length || 0);
      setPosts(postsData || []);

    } catch (err) {

      console.log(err);

    } finally {

      setProfileLoading(false);
    }
  }

  if (profileLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Cargando perfil...
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        No se encontró perfil.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white">

      {/* Banner */}
      {profile.banner_url ? (
        <img
          src={profile.banner_url}
          alt="Banner"
          className="h-72 w-full object-cover"
        />
      ) : (
        <div className="h-72 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-2xl"></div>
      )}

      <div className="max-w-4xl mx-auto px-6">

        {/* Avatar */}
        <div className="-mt-16">

          {profile.avatar_url ? (

            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-40 h-40 rounded-full object-cover border-4 border-[#09090B] ring-4 ring-blue-500/20 shadow-2xl"
            />

          ) : (

            <div className="w-40 h-40 rounded-full bg-zinc-700 border-4 border-[#09090B] ring-4 ring-blue-500/20 flex items-center justify-center text-5xl shadow-2xl">
              👤
            </div>

          )}

        </div>

        {/* Info */}
        <div className="mt-4">

          <h1 className="text-5xl font-bold">
            @{profile.username}
          </h1>

          <p className="text-zinc-400 mt-2 text-lg">
            {profile.career || "Profesional"}
          </p>

          <p className="text-zinc-500">
            {profile.university || "Universidad"}
          </p>

          <Link
            href="/settings"
            className="
              inline-flex
              items-center
              gap-2
              mt-4
              bg-gradient-to-r
              from-blue-500
              to-purple-600
              hover:scale-105
              transition-all
              px-5
              py-3
              rounded-2xl
              font-semibold
              shadow-xl
            "
          >
            ✏️ Editar perfil
          </Link>

          <p className="text-zinc-400 mt-4">
            {profile.bio || "Sin biografía"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">

              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass rounded-3xl p-5 shadow-2xl text-center"
            >

              <p className="text-zinc-500 text-sm">
                Seguidores
              </p>

              <h3 className="text-3xl font-bold mt-2">
                {followers}
              </h3>

            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass rounded-3xl p-5 shadow-2xl text-center"
            >

              <p className="text-zinc-500 text-sm">
                Siguiendo
              </p>

              <h3 className="text-3xl font-bold mt-2">
                {following}
              </h3>

            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass rounded-3xl p-5 shadow-2xl text-center"
            >

              <p className="text-zinc-500 text-sm">
                Publicaciones
              </p>

              <h3 className="text-3xl font-bold mt-2">
                {postsCount}
              </h3>

            </motion.div>

          </div>

          <div className="flex flex-wrap gap-6 mt-4 text-zinc-400">

            <p>
              🎓 {profile.university || "Universidad no agregada"}
            </p>

            <p>
              💻 {profile.career || "Carrera no agregada"}
            </p>

          </div>

          <div className="
            mt-10
            glass
            rounded-3xl
            p-8
            shadow-2xl
          ">

            <h2 className="text-2xl font-bold mb-4">
              Acerca de mí
            </h2>

            <p className="text-zinc-300 leading-relaxed">
              {profile.bio || "Este usuario todavía no ha agregado una biografía."}
            </p>

          </div>

        </div>

      </div>

      <div className="max-w-4xl mx-auto px-6 pb-10 mt-10">

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

          <h2 className="text-2xl font-bold mb-6">
            Publicaciones
          </h2>

          {posts.length === 0 ? (

            <p className="text-zinc-500">
              No has publicado nada todavía.
            </p>

          ) : (

            <div className="space-y-6">

              {posts.map((post) => (

                <div
                  key={post.id}
                  className="
                    bg-zinc-800
                    rounded-2xl
                    p-5
                    hover:bg-zinc-700
                    transition
                  "
                >

                  <p className="whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {post.image_url && (

                    <img
                      src={post.image_url}
                      alt="Post"
                      className="
                        mt-4
                        rounded-2xl
                        w-full
                        max-h-[500px]
                        object-cover
                      "
                    />

                  )}

                  <p className="text-zinc-500 text-sm mt-4">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </main>
  );
}