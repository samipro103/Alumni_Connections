"use client";

import {
  Check,
  X,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./InvitationNotificationActions.module.css";

export default function InvitationNotificationActions({
  type,
  targetId,
  actorId,
  onDone,
}: {
  type: string;
  targetId: string;
  actorId?: string | null;
  onDone?: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);

  if (
    ![
      "community_invite",
      "event_invite",
      "community_join_request",
    ].includes(type)
  ) {
    return null;
  }

  async function respond(accept: boolean) {
    if (busy) return;

    setBusy(accept ? "accept" : "reject");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;

      if (!userId) {
        throw new Error("Inicia sesión nuevamente.");
      }

      let error: any = null;

      if (type === "community_invite") {
        const invite = await supabase
          .from("community_invites")
          .select("id")
          .eq("community_id", targetId)
          .eq("invitee_id", userId)
          .eq("status", "pending")
          .maybeSingle();

        if (invite.error) throw invite.error;
        if (!invite.data?.id) throw new Error("La invitación ya no está pendiente.");

        const result = await supabase.rpc(
          "alumni_respond_community_invite",
          {
            p_invite: invite.data.id,
            p_accept: accept,
          }
        );
        error = result.error;
      } else if (type === "event_invite") {
        const invite = await supabase
          .from("event_invites")
          .select("id")
          .eq("event_id", Number(targetId))
          .eq("invitee_id", userId)
          .eq("status", "pending")
          .maybeSingle();

        if (invite.error) throw invite.error;
        if (!invite.data?.id) throw new Error("La invitación ya no está pendiente.");

        const result = await supabase.rpc(
          "alumni_respond_event_invite",
          {
            p_invite: invite.data.id,
            p_accept: accept,
          }
        );
        error = result.error;
      } else {
        if (!actorId) {
          throw new Error("No encontramos la solicitud.");
        }

        const result = await supabase.rpc(
          "alumni_moderate_community_member",
          {
            p_community: targetId,
            p_user: actorId,
            p_action: accept ? "approve" : "reject",
          }
        );
        error = result.error;
      }

      if (error) throw error;

      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId)
        .eq("type", type)
        .eq("target_id", targetId);

      await onDone?.();
    } catch (error: any) {
      alert(error?.message || "No se pudo completar.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={styles.actions}>
      <button
        type="button"
        data-primary="true"
        disabled={Boolean(busy)}
        onClick={() => void respond(true)}
      >
        <Check size={14} />
        {busy === "accept" ? "Procesando..." : "Aceptar"}
      </button>

      <button
        type="button"
        disabled={Boolean(busy)}
        onClick={() => void respond(false)}
      >
        <X size={14} />
        Rechazar
      </button>
    </div>
  );
}

/* ALUMNI_2_1_2_NOTIFICATION_INVITE_ACTIONS */
