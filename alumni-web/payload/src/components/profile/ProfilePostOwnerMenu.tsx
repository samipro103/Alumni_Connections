"use client";

import {
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  X,
  Check,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

export default function ProfilePostOwnerMenu({
  post,
  pinned,
  onEdit,
  onTogglePin,
  onDelete,
}: {
  post: any;
  pinned: boolean;
  onEdit: (content: string) => Promise<void> | void;
  onTogglePin: () => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(
    String(post.content || "")
  );
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const createdAt = new Date(post.created_at).getTime();
  const editDeadline = createdAt + 24 * 60 * 60 * 1000;
  const canEdit =
    Number.isFinite(createdAt) &&
    Date.now() <= editDeadline;

  useEffect(() => {
    if (!open) return;

    function close(event: PointerEvent) {
      if (
        ref.current &&
        event.target instanceof Node &&
        !ref.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", close);
    return () =>
      document.removeEventListener("pointerdown", close);
  }, [open]);

  async function saveEdit() {
    if (!canEdit || saving) return;

    setSaving(true);

    try {
      await onEdit(content.trim());
      setEditing(false);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        ref={ref}
        className="alumni-profile-post-owner-menu"
      >
        <button
          type="button"
          className="alumni-profile-post-owner-trigger"
          onClick={() => setOpen((value) => !value)}
          aria-label="Más opciones"
        >
          <MoreHorizontal size={20} />
        </button>

        {open && (
          <div className="alumni-profile-post-owner-popover">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setContent(String(post.content || ""));
                  setEditing(true);
                }}
              >
                <Pencil size={16} />
                Editar
                <small>Disponible 24 h</small>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void onTogglePin();
              }}
            >
              {pinned ? (
                <PinOff size={16} />
              ) : (
                <Pin size={16} />
              )}
              {pinned ? "Desfijar del perfil" : "Fijar en el perfil"}
            </button>

            <button
              type="button"
              data-danger="true"
              onClick={() => {
                setOpen(false);
                void onDelete();
              }}
            >
              <Trash2 size={16} />
              Borrar publicación
            </button>
          </div>
        )}
      </div>

      {editing && (
        <div
          className="alumni-profile-post-edit-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEditing(false);
            }
          }}
        >
          <section
            className="alumni-profile-post-edit-modal"
            role="dialog"
            aria-modal="true"
          >
            <header>
              <div>
                <span>Publicación</span>
                <h2>Editar texto</h2>
                <p>
                  Puedes editar una publicación durante las
                  primeras 24 horas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </header>

            <textarea
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              maxLength={5000}
              autoFocus
              placeholder="Escribe algo..."
            />

            <footer>
              <span>{content.length}/5000</span>

              <button
                type="button"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void saveEdit()}
              >
                <Check size={15} />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

/* ALUMNI_1_8_1_PROFILE_POST_OWNER_MENU */
