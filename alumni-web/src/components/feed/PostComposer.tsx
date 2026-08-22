"use client";

import { useRef } from "react";
import { CalendarDays, FileText, ImagePlus, Send, X } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";

interface Props {
  content: string;
  setContent: (v: string) => void;
  image: File | null;
  setImage: (file: File | null) => void;
  createPost: () => void;
}

export default function PostComposer({
  content,
  setContent,
  image,
  setImage,
  createPost,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="mb-8">
      <div className="flex gap-4">
        <img
          src="https://placehold.co/100"
          className="w-14 h-14 rounded-full object-cover"
        />

        <div className="flex-1 space-y-5">
          <Textarea
            rows={4}
            value={content}
            placeholder="¿Qué quieres compartir hoy?"
            onChange={(e) => setContent(e.target.value)}
          />

          {image && (
            <div className="relative">
              <img
                src={URL.createObjectURL(image)}
                className="rounded-2xl max-h-96 w-full object-cover"
              />

              <button
                onClick={() => setImage(null)}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/70 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 hover:bg-zinc-800 transition"
              >
                <ImagePlus size={20} />
                Foto
              </button>

              <button className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 hover:bg-zinc-800 transition">
                <CalendarDays size={20} />
                Evento
              </button>

              <button className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 hover:bg-zinc-800 transition">
                <FileText size={20} />
                Documento
              </button>
            </div>

            <Button onClick={createPost} className="w-auto px-8">
              <span className="flex items-center gap-2">
                <Send size={18} />
                Publicar
              </span>
            </Button>
          </div>

          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setImage(e.target.files[0]);
              }
            }}
          />
        </div>
      </div>
    </Card>
  );
}
