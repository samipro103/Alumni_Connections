"use client";

import { Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CommentLikeButton from "@/components/social/CommentLikeButton";

export default function FeedCommentsSheet({
  post,
  currentUserId,
  input,
  setInput,
  onSend,
  onClose,
  focusedCommentId,
  loading = false,
}: {
  post: any | null;
  currentUserId?: string | null;
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
  focusedCommentId?: number | null;
  loading?: boolean;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!post) return;

    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = old;
    };
  }, [post]);

  useEffect(() => {
    if (!post || !focusedCommentId) return;

    const timer = window.setTimeout(() => {
      document
        .getElementById(`feed-comment-${focusedCommentId}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [post?.id, focusedCommentId]);

  if (!ready || !post) return null;

  const comments = post.comments || [];

  return createPortal(
    <div
      className="alumni-comments-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <section className="alumni-comments-sheet">
        <header className="alumni-comments-header">
          <div>
            <span>Publicación</span>
            <h3>Comentarios</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar comentarios"
          >
            <X size={20} />
          </button>
        </header>

        <div className="alumni-comments-list">
          {loading ? (
            <div className="alumni-feed-modal-empty">
              Cargando comentarios...
            </div>
          ) : comments.length ? (
            comments.map((comment: any) => (
              <div
                id={`feed-comment-${comment.id}`}
                key={comment.id}
                className={`alumni-feed-comment ${
                  focusedCommentId === comment.id
                    ? "is-focused"
                    : ""
                }`}
              >
                <a
                  href={`/u/${comment.profile?.username || ""}`}
                  className="alumni-feed-comment-avatar"
                >
                  {comment.profile?.avatar_url ? (
                    <img
                      src={comment.profile.avatar_url}
                      alt=""
                    />
                  ) : (
                    comment.profile?.username
                      ?.charAt(0)
                      ?.toUpperCase() || "A"
                  )}
                </a>

                <div className="alumni-feed-comment-body">
                  <p>
                    <a
                      href={`/u/${comment.profile?.username || ""}`}
                    >
                      @{comment.profile?.username || "usuario"}
                    </a>
                    <span>{comment.content}</span>
                  </p>

                  <CommentLikeButton
                    commentId={comment.id}
                    commentOwnerId={comment.user_id}
                    currentUserId={currentUserId}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="alumni-feed-modal-empty">
              Sé la primera persona en comentar.
            </div>
          )}
        </div>

        <div className="alumni-comments-composer">
          <input
            type="text"
            value={input}
            disabled={!currentUserId}
            placeholder={
              currentUserId
                ? "Escribe un comentario..."
                : "Inicia sesión para comentar"
            }
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSend();
              }
            }}
          />

          <button
            type="button"
            onClick={onSend}
            disabled={!currentUserId || !input.trim()}
            aria-label="Enviar comentario"
          >
            <Send size={17} />
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}

/* ALUMNI_1_4_0_COMMENTS_SHEET */

/* ALUMNI_PERFORMANCE_HARDENING_FEED_V2_LAZY_COMMENTS */
