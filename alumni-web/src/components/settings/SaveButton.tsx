"use client";

interface Props {
  saving: boolean;
  onClick: () => void;
}

export default function SaveButton({
  saving,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="
        w-full
        py-4
        rounded-2xl
        font-bold
        text-lg
        bg-gradient-to-r
        from-blue-500
        to-purple-600
        hover:scale-[1.02]
        transition-all
        disabled:opacity-60
      "
    >
      {saving ? "Guardando..." : "💾 Guardar cambios"}
    </button>
  );
}
