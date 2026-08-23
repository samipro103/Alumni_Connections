"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Send,
  X,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { APP_VERSION } from "@/lib/appVersion";

type FeedbackType =
  | "bug"
  | "ui"
  | "suggestion"
  | "missing_feature"
  | "other";

type Priority = "low" | "medium" | "high" | "blocker";

const MAX_FILES = 4;
const MAX_FILE_SIZE = 8 * 1024 * 1024;

function detectPlatform() {
  if (typeof navigator === "undefined") return "Web";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("android")) return "Android";
  if (/iphone|ipad|ipod/.test(ua)) return "iOS";
  return "Web";
}

export default function FeedbackPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [type, setType] = useState<FeedbackType>("bug");
  const [priority, setPriority] = useState<Priority>("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expected, setExpected] = useState("");
  const [steps, setSteps] = useState("");
  const [sourcePath, setSourcePath] = useState("/");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [successId, setSuccessId] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSourcePath(
      sessionStorage.getItem("alumni_feedback_from") ||
        document.referrer ||
        "/"
    );
  }, []);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  useEffect(() => {
    return () => previews.forEach((item) => URL.revokeObjectURL(item.url));
  }, [previews]);

  function addFiles(selected: FileList | null) {
    if (!selected) return;

    const next = [...files];

    for (const file of Array.from(selected)) {
      if (!file.type.startsWith("image/")) continue;

      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" supera 8 MB.`);
        continue;
      }

      if (next.length >= MAX_FILES) break;
      next.push(file);
    }

    setFiles(next.slice(0, MAX_FILES));
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index));
  }

  async function submitFeedback() {
    if (!user || sending || !title.trim() || !description.trim()) return;

    setSending(true);

    const reportId = crypto.randomUUID();
    const uploadedPaths: string[] = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const extension =
          file.name.split(".").pop()?.toLowerCase() ||
          (file.type.includes("png") ? "png" : "jpg");

        const path = `${user.id}/${reportId}/${Date.now()}-${index}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("feedback")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
      }

      const { error } = await supabase.from("feedback_reports").insert({
        id: reportId,
        user_id: user.id,
        type,
        priority,
        title: title.trim(),
        description: description.trim(),
        expected_behavior: expected.trim() || null,
        steps_to_reproduce: steps.trim() || null,
        source_path: sourcePath,
        platform: detectPlatform(),
        app_version: APP_VERSION,
        attachments: uploadedPaths,
      });

      if (error) throw error;

      setSuccessId(reportId);
      sessionStorage.removeItem("alumni_feedback_from");
    } catch (error: any) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("feedback").remove(uploadedPaths);
      }

      console.error(error);
      alert(error?.message || "No se pudo enviar el reporte.");
    } finally {
      setSending(false);
    }
  }

  if (loading || !user) {
    return (
      <AppShell>
        <div className="py-16 text-center text-sm text-zinc-600">
          Preparando feedback...
        </div>
      </AppShell>
    );
  }

  if (successId) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-[-0.04em]">
            Reporte enviado
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
            Gracias. El equipo de Alumni ya puede revisar tu reporte, las
            capturas y el contexto técnico.
          </p>
          <p className="mt-4 text-[11px] font-bold text-zinc-700">
            ID {successId.slice(0, 8).toUpperCase()}
          </p>
          <button
            onClick={() => router.push("/feed")}
            className="mt-6 rounded-xl bg-[#6d7cff] px-5 py-3 text-xs font-black"
          >
            Volver a Alumni
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[820px]">
        <button
          onClick={() => router.back()}
          className="mb-5 flex items-center gap-2 text-xs font-bold text-zinc-600 transition hover:text-zinc-300"
        >
          <ArrowLeft size={15} />
          Volver
        </button>

        <div className="border-b border-white/[0.07] pb-6">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[#8d98ff]">
            Alumni Beta
          </p>
          <h1 className="mt-2 text-[30px] font-black tracking-[-0.04em]">
            Cuéntanos qué encontraste
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Reporta errores, detalles visuales o ideas. Guardaremos
            automáticamente la versión, plataforma y sección desde donde
            llegaste.
          </p>
        </div>

        <div className="mt-6 space-y-7">
          <section>
            <p className="text-sm font-black text-zinc-200">Tipo de reporte</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["bug", "Error"],
                ["ui", "Algo se ve mal"],
                ["suggestion", "Sugerencia"],
                ["missing_feature", "Función que falta"],
                ["other", "Otro"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setType(value as FeedbackType)}
                  className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                    type === value
                      ? "border-[#6d7cff]/40 bg-[#6d7cff]/10 text-[#a8b0ff]"
                      : "border-white/[0.07] text-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-2 block text-xs font-black text-zinc-500">
                Título corto
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. El botón Enviar no responde"
                maxLength={120}
                className="h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm outline-none transition placeholder:text-zinc-700 focus:border-[#6d7cff]/45"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-2 block text-xs font-black text-zinc-500">
                ¿Qué pasó?
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe lo que viste con el mayor detalle posible."
                rows={5}
                className="w-full resize-none rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 text-sm leading-6 outline-none transition placeholder:text-zinc-700 focus:border-[#6d7cff]/45"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-black text-zinc-500">
                ¿Qué esperabas?
              </span>
              <textarea
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                placeholder="Lo que debería haber ocurrido."
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 text-sm leading-6 outline-none placeholder:text-zinc-700 focus:border-[#6d7cff]/45"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-black text-zinc-500">
                Pasos para repetirlo
              </span>
              <textarea
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder={"1. Abrí...\n2. Toqué...\n3. Apareció..."}
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 text-sm leading-6 outline-none placeholder:text-zinc-700 focus:border-[#6d7cff]/45"
              />
            </label>
          </section>

          <section>
            <p className="text-sm font-black text-zinc-200">
              ¿Qué tan grave es?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["low", "Baja"],
                ["medium", "Media"],
                ["high", "Alta"],
                ["blocker", "No puedo usar la app"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setPriority(value as Priority)}
                  className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                    priority === value
                      ? "border-[#6d7cff]/40 bg-[#6d7cff]/10 text-[#a8b0ff]"
                      : "border-white/[0.07] text-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-black text-zinc-200">Capturas</p>
                <p className="mt-1 text-xs text-zinc-700">
                  Hasta {MAX_FILES} imágenes · máximo 8 MB cada una.
                </p>
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-black text-zinc-500 transition hover:text-zinc-200">
                <ImagePlus size={15} />
                Agregar
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>
            </div>

            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {previews.map((item, index) => (
                  <div
                    key={`${item.file.name}-${index}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]"
                  >
                    <img
                      src={item.url}
                      alt="Captura"
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
                      title="Quitar captura"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[11px] leading-5 text-zinc-700">
              <p>Origen: {sourcePath}</p>
              <p>
                {detectPlatform()} · Alumni {APP_VERSION}
              </p>
            </div>

            <button
              onClick={submitFeedback}
              disabled={sending || !title.trim() || !description.trim()}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#6d7cff] px-5 text-xs font-black text-white transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-700"
            >
              {sending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {sending ? "Enviando..." : "Enviar reporte"}
            </button>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
