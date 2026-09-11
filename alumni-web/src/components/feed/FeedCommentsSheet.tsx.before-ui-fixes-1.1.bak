"use client";

import { Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CommentLikeButton from "@/components/social/CommentLikeButton";

type ReplyTarget = { id: number; username: string } | null;
type ThreadedComment = { comment: any; depth: number };

function threadedComments(comments: any[]): ThreadedComment[] {
  const byId = new Map<number, any>();
  const children = new Map<number, any[]>();
  const roots: any[] = [];

  for (const comment of comments) {
    const id = Number(comment?.id);
    if (Number.isFinite(id) && id > 0) byId.set(id, comment);
  }

  for (const comment of comments) {
    const parentId = Number(comment?.parent_comment_id);
    if (Number.isFinite(parentId) && parentId > 0 && byId.has(parentId)) {
      const list = children.get(parentId) || [];
      list.push(comment);
      children.set(parentId, list);
    } else {
      roots.push(comment);
    }
  }

  const output: ThreadedComment[] = [];
  const visited = new Set<number>();

  function walk(comment: any, depth: number) {
    const id = Number(comment?.id);
    if (Number.isFinite(id) && id > 0) {
      if (visited.has(id)) return;
      visited.add(id);
    }

    output.push({ comment, depth });
    for (const reply of children.get(id) || []) walk(reply, depth + 1);
  }

  for (const root of roots) walk(root, 0);

  for (const comment of comments) {
    const id = Number(comment?.id);
    if (!Number.isFinite(id) || id <= 0 || !visited.has(id)) {
      output.push({ comment, depth: 0 });
    }
  }

  return output;
}

export default function FeedCommentsSheet({
  post,
  currentUserId,
  onSend,
  onClose,
  focusedCommentId,
  loading = false,
}: {
  post: any | null;
  currentUserId?: string | null;
  onSend: (value: string, parentCommentId?: number | null) => Promise<boolean>;
  onClose: () => void;
  focusedCommentId?: number | null;
  loading?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTarget>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    setInput("");
    setSending(false);
    setReplyTo(null);
  }, [post?.id]);

  async function submitComment() {
    const value = input.trim();
    if (!value || !currentUserId || sending) return;

    const parentCommentId = replyTo?.id ?? null;
    setInput("");
    setSending(true);

    try {
      const ok = await onSend(value, parentCommentId);
      if (ok) setReplyTo(null);
      else setInput((current) => (current.trim() ? current : value));
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (!post) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = old; };
  }, [post]);

  useEffect(() => {
    if (!post || !focusedCommentId) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`feed-comment-${focusedCommentId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [post?.id, focusedCommentId]);

  const comments = post?.comments || [];
  const threaded = useMemo(() => threadedComments(comments), [comments]);

  function beginReply(comment: any) {
    const id = Number(comment?.id);
    if (!currentUserId || !Number.isFinite(id) || id <= 0) return;
    setReplyTo({ id, username: comment.profile?.username || "usuario" });
    window.setTimeout(() => inputRef.current?.focus(), 20);
  }

  if (!ready || !post) return null;

  return createPortal(
    <div className="alumni-comments-backdrop" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <section className="alumni-comments-sheet alumni-comments-messaging-font">
        <header className="alumni-comments-header">
          <div><span>Publicación</span><h3>Comentarios</h3></div>
          <button type="button" onClick={onClose} aria-label="Cerrar comentarios"><X size={20} /></button>
        </header>

        <div className="alumni-comments-list">
          {loading ? (
            <div className="alumni-feed-modal-empty">Cargando comentarios...</div>
          ) : threaded.length ? (
            threaded.map(({ comment, depth }) => {
              const visualDepth = Math.min(depth, 3);
              return (
                <div
                  id={`feed-comment-${comment.id}`}
                  key={comment.id}
                  className={`alumni-feed-comment alumni-thread-comment ${visualDepth > 0 ? "is-reply" : ""} ${focusedCommentId === comment.id ? "is-focused" : ""}`}
                  data-thread-depth={visualDepth}
                  style={{ marginLeft: visualDepth > 0 ? `${visualDepth * 18}px` : undefined }}
                >
                  <a href={`/u/${comment.profile?.username || ""}`} className="alumni-feed-comment-avatar">
                    {comment.profile?.avatar_url ? <img src={comment.profile.avatar_url} alt="" /> : (comment.profile?.username?.charAt(0)?.toUpperCase() || "A")}
                  </a>

                  <div className="alumni-feed-comment-body">
                    <p>
                      <a href={`/u/${comment.profile?.username || ""}`}>@{comment.profile?.username || "usuario"}</a>
                      <span>{comment.content}</span>
                    </p>

                    <div className="alumni-comment-thread-actions">
                      {Number(comment.id) > 0 && (
                        <CommentLikeButton
                          commentId={comment.id}
                          commentOwnerId={comment.user_id}
                          currentUserId={currentUserId}
                        />
                      )}
                      {currentUserId && Number(comment.id) > 0 && (
                        <button type="button" className="alumni-comment-reply-button" onClick={() => beginReply(comment)}>
                          Responder
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="alumni-feed-modal-empty">Sé la primera persona en comentar.</div>
          )}
        </div>

        <div className="alumni-comments-composer-wrap">
          {replyTo && (
            <div className="alumni-comment-reply-target">
              <span>Respondiendo a <strong>@{replyTo.username}</strong></span>
              <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancelar respuesta"><X size={14} /></button>
            </div>
          )}

          <div className="alumni-comments-composer">
            <input
              ref={inputRef}
              type="text"
              value={input}
              disabled={!currentUserId}
              placeholder={currentUserId ? (replyTo ? `Responder a @${replyTo.username}...` : "Escribe un comentario...") : "Inicia sesión para comentar"}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void submitComment();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void submitComment()}
              disabled={!currentUserId || !input.trim() || sending}
              aria-busy={sending}
              aria-label={replyTo ? "Enviar respuesta" : "Enviar comentario"}
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}

/* ALUMNI_1_4_0_COMMENTS_SHEET */
/* ALUMNI_PERFORMANCE_HARDENING_FEED_V2_LAZY_COMMENTS */
/* ALUMNI_PERFORMANCE_HARDENING_COMMENT_DRAFT_LOCAL_V8 */
/* ALUMNI_1_7_0_STORIES_HIDDEN_COMMENTS_GEIST */
/* ALUMNI_COMMENT_THREADS_1_0 */
