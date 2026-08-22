"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MessagesPage() {

  const router = useRouter();
  const { user, loading } = useAuth();

  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading]);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user) return;

    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!messages) return;

    const userIds = new Set<string>();

    messages.forEach((message) => {

      if (message.sender_id !== user.id) {
        userIds.add(message.sender_id);
      }

      if (message.receiver_id !== user.id) {
        userIds.add(message.receiver_id);
      }

    });

    const ids = Array.from(userIds);

    if (ids.length === 0) {
      setConversations([]);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", ids);

    setConversations(profiles || []);
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white">

      <div className="max-w-3xl mx-auto p-6">

        <div className="mb-8">

          <h1 className="text-5xl font-black">
            Mensajes
          </h1>

          <p className="text-zinc-400 mt-2">
            Conversa con estudiantes y graduados.
          </p>

        </div>

        <div className="space-y-4">

          {conversations.length === 0 && (

            <div className="glass rounded-3xl p-8 text-center">

              <h2 className="text-xl font-bold">
                No tienes conversaciones
              </h2>

              <p className="text-zinc-400 mt-2">
                Empieza a seguir usuarios y envíales mensajes.
              </p>

            </div>

          )}

          {conversations.map((user) => (

            <Link
              key={user.id}
              href={`/messages/${user.username}`}
            >

              <div className="
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
              ">

                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Avatar"
                    className="
                      w-14
                      h-14
                      rounded-full
                      object-cover
                      ring-2
                      ring-blue-500/20
                    "
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center">
                    👤
                  </div>
                )}

                <div>

                  <h2 className="font-bold text-lg">
                    @{user.username}
                  </h2>

                  <p className="text-zinc-400">
                    {user.university || "Alumno"}
                  </p>

                </div>

                <div className="ml-auto">
                  <ChevronRight
                    size={20}
                    className="text-zinc-500"
                  />
                </div>

              </div>

            </Link>

          ))}

        </div>

      </div>

    </main>
  );
}