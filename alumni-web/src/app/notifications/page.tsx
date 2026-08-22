"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

export default function NotificationsPage() {

  const router = useRouter();
  const { user, loading } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading]);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user) return;

    const { data: notificationsData } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!notificationsData) return;

    const actorIds = notificationsData.map(
      (n) => n.actor_id
    );

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .in("id", actorIds);

    const formatted = notificationsData.map(
      (notification) => ({
        ...notification,
        profile: profilesData?.find(
          (p) => p.id === notification.actor_id
        ),
      })
    );

    setNotifications(formatted);
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white">

      <div className="max-w-3xl mx-auto p-6">

        <div className="mb-8">
          <h1 className="text-5xl font-black">
            Notificaciones
          </h1>
          <p className="text-zinc-400 mt-2">
            Mantente al día con tu actividad.
          </p>
        </div>

        <div className="space-y-4">

          {notifications.length === 0 && (

            <div className="glass rounded-3xl p-8 text-center shadow-xl">
              No tienes notificaciones.
            </div>

          )}

          {notifications.map((notification) => (

            <Link
              key={notification.id}
              href={`/u/${notification.profile?.username}`}
            >
              <div
                className="
                  glass
                  rounded-3xl
                  p-5
                  flex
                  items-center
                  gap-4
                  hover:-translate-y-1
                  hover:border-blue-500/30
                  transition-all
                  duration-300
                  cursor-pointer
                  shadow-xl
                "
              >

              {notification.profile?.avatar_url ? (

                <img
                  src={notification.profile.avatar_url}
                  alt="Avatar"
                  className="
                    w-12
                    h-12
                    rounded-full
                    object-cover
                    ring-2
                    ring-blue-500/20
                  "
                />

              ) : (

                <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
                  {notification.profile?.username?.charAt(0).toUpperCase() || "U"}
                </div>

              )}

              <div>

                {notification.type === "follow" && (

                  <p>
                    <span className="font-bold text-white">
                      @{notification.profile?.username}
                    </span>{" "}
                    comenzó a seguirte.
                  </p>

                )}

                {notification.type === "like" && (

                  <p>
                    ❤️ <span className="font-bold text-white">
                      @{notification.profile?.username}
                    </span>{" "}
                    le dio like a tu publicación.
                  </p>

                )}

                {notification.type === "comment" && (

                  <p>
                    💬 <span className="font-bold text-white">
                      @{notification.profile?.username}
                    </span>{" "}
                    comentó tu publicación.
                  </p>

                )}

                <p className="text-xs text-zinc-500 mt-2">
                  {formatDistanceToNow(
                    new Date(notification.created_at),
                    {
                      addSuffix: true,
                      locale: es,
                    }
                  )}
                </p>

              </div>

            </div>
          </Link>

          ))}

        </div>

      </div>

    </main>
  );
}