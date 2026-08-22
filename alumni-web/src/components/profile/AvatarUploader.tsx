"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/storage";

interface Props {
  userId: string;
  currentAvatar?: string;
  onUploaded: (url: string) => void;
}

export default function AvatarUploader({
  userId,
  currentAvatar,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      const url = await uploadImage(
        file,
        "avatars",
        userId
      );

      onUploaded(url);

    } catch (err) {
      console.error(err);
      alert("Error al subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">

      <div
        className="relative cursor-pointer group"
        onClick={() => inputRef.current?.click()}
      >
        <img
          src={
            currentAvatar ||
            "https://placehold.co/200x200?text=Avatar"
          }
          alt="Avatar"
          className="
            w-40
            h-40
            rounded-full
            object-cover
            border-4
            border-zinc-800
            transition
            group-hover:brightness-75
          "
        />

        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
            rounded-full
            opacity-0
            group-hover:opacity-100
            bg-black/50
            text-white
            font-semibold
            transition
          "
        >
          Cambiar
        </div>
      </div>

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={handleUpload}
      />

      {uploading && (
        <p className="text-sm text-zinc-400">
          Subiendo...
        </p>
      )}

    </div>
  );
}
