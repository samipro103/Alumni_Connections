"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function ChatPage() {

  const params = useParams();

  const username = params.username as string;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiver, setReceiver] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadChat();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadChat();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  async function loadChat() {

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user) return;

    setCurrentUser(user);

    const { data: receiverData } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (!receiverData) return;

    setReceiver(receiverData);

    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverData.id}),and(sender_id.eq.${receiverData.id},receiver_id.eq.${user.id})`
      )
      .order("created_at", {
        ascending: true,
      });

    setMessages(messagesData || []);
  }

  async function handleSendMessage(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (
      !newMessage.trim() ||
      !currentUser ||
      !receiver
    ) {
      return;
    }

    const { error } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUser.id,
        receiver_id: receiver.id,
        content: newMessage,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setNewMessage("");
    setTimeout(() => {
      loadChat();
    }, 500);
  }

  return (
    <main className="
      flex
      flex-col
      h-screen
      bg-[#09090B]
      bg-[radial-gradient(circle_at_top,#1e293b20,transparent_40%)]
    ">

      {/* HEADER */}
      <div className="
        flex
        items-center
        justify-between
        px-5
        py-4
        backdrop-blur-xl
        bg-zinc-950/80
        border-b
        border-zinc-800
        sticky
        top-0
        z-50
      ">

        <div className="flex items-center gap-3">

          {receiver?.avatar_url ? (

            <img
              src={receiver.avatar_url}
              alt="Avatar"
              className="w-12 h-12 rounded-full object-cover"
            />

          ) : (

            <div className="
              w-12
              h-12
              rounded-full
              bg-gradient-to-r
              from-blue-500
              to-purple-600
              flex
              items-center
              justify-center
              text-white
              font-bold
              shadow-lg
            ">
              👤
            </div>

          )}

          <div>

            <h1 className="text-xl font-bold">
              @{receiver?.username || username}
            </h1>

            <p className="text-zinc-400 text-sm">
              {receiver?.university || "Alumno"}
            </p>

          </div>

        </div>

      </div>

      {/* MESSAGES */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">

        {messages.map((msg) => (

          <motion.div
            key={msg.id}
            initial={{
              opacity: 0,
              y: 15
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.25
            }}
            className={`max-w-[70%] p-4 rounded-3xl shadow-lg ${
              msg.sender_id === currentUser?.id
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-auto"
                : "bg-zinc-800"
            }`}
          >

            <div>

              <p>
                {msg.content}
              </p>

              <p className="text-xs opacity-70 mt-2">
                {new Date(msg.created_at).toLocaleTimeString()}
              </p>

            </div>

          </motion.div>

        ))}

      </div>

      {/* INPUT */}
      <form 
        onSubmit={handleSendMessage}
        className="border-t border-zinc-800 p-4 flex gap-4 bg-[#09090B] sticky bottom-0"
      >

        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="
            flex-1
            bg-zinc-800
            border
            border-zinc-700
            rounded-full
            px-5
            py-3
            text-sm
            focus:border-blue-500
            outline-none
            text-white
            transition
          "
        />

        <button
          type="submit"
          className="
            p-3
            bg-gradient-to-r
            from-blue-500
            to-purple-600
            hover:scale-105
            disabled:opacity-50
            text-white
            rounded-full
            transition-all
            shadow-xl
          "
        >
          Enviar
        </button>

      </form>
    </main>
  );
}