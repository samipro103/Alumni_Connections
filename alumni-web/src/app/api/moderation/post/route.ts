import { NextResponse } from "next/server";
import {
  combineModerationSignals,
  moderateTextLocally,
  moderationAdminClient,
  verifyModerationUser,
  type AlumniImageSignal,
} from "@/lib/moderationServer";

function sanitizeImageSignal(value: any): AlumniImageSignal | null {
  if (!value || typeof value !== "object") return null;

  const status =
    value.status === "completed" || value.status === "error"
      ? value.status
      : "not_run";

  const classes =
    value.classes && typeof value.classes === "object"
      ? Object.fromEntries(
          Object.entries(value.classes)
            .slice(0, 10)
            .map(([key, raw]) => [
              String(key).slice(0, 40),
              Math.max(0, Math.min(1, Number(raw || 0))),
            ])
        )
      : {};

  return {
    source: String(value.source || "unknown").slice(0, 80),
    status,
    risk_score: Math.max(0, Math.min(1, Number(value.risk_score || 0))),
    flagged: Boolean(value.flagged),
    classes,
    error: value.error ? String(value.error).slice(0, 300) : null,
  };
}

export async function POST(request: Request) {
  const user = await verifyModerationUser(
    request.headers.get("authorization")
  );

  if (!user) {
    return NextResponse.json(
      { error: "Sesión Alumni no válida." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const postId = Number(body?.post_id);

  if (!Number.isFinite(postId) || postId <= 0) {
    return NextResponse.json(
      { error: "Publicación no válida." },
      { status: 400 }
    );
  }

  const admin = moderationAdminClient();
  const { data: post, error: postError } = await admin
    .from("posts")
    .select("id,user_id,content,image_url")
    .eq("id", postId)
    .maybeSingle();

  if (postError || !post) {
    return NextResponse.json(
      { error: "No se encontró la publicación." },
      { status: 404 }
    );
  }

  if (String(post.user_id) !== user.id) {
    return NextResponse.json(
      { error: "No puedes analizar una publicación ajena." },
      { status: 403 }
    );
  }

  const imageSignal = sanitizeImageSignal(body?.image_signal);

  try {
    const textResult = moderateTextLocally(post.content);
    const combined = combineModerationSignals(textResult, imageSignal);

    const categories = {
      ...textResult.categories,
      sexual_image: combined.imageFlagged,
    };

    const categoryScores = {
      ...textResult.categoryScores,
      sexual_image: combined.imageRisk,
    };

    const categoryAppliedInputTypes = Object.fromEntries([
      ...Object.keys(textResult.categoryScores).map((category) => [category, ["text"]]),
      ["sexual_image", post.image_url ? ["image"] : []],
    ]);

    const { error: saveError } = await admin
      .from("post_moderation_results")
      .upsert(
        {
          post_id: post.id,
          user_id: post.user_id,
          provider: "alumni_shield",
          model: "rules-1.1+nsfwjs",
          status: "completed",
          flagged: combined.flagged,
          suggested_action: combined.suggestedAction,
          top_category: combined.topCategory,
          top_score: combined.topScore,
          categories,
          category_scores: categoryScores,
          category_applied_input_types: categoryAppliedInputTypes,
          raw_response: {
            engine: "Alumni Shield",
            version: "8.2",
            text: textResult,
            image: imageSignal,
            coverage: {
              text: [
                "threat",
                "violence",
                "harassment",
                "self_harm",
                "sexual",
                "hate",
                "spam",
                "scam",
                "illicit",
                "suspicious_link",
              ],
              image: post.image_url
                ? ["sexual_explicit", "porn", "hentai", "sexy"]
                : [],
              image_note: post.image_url
                ? "En 8.1 la señal de imagen se ejecuta localmente y se usa solo para calibración en modo sombra."
                : null,
            },
          },
          error_message:
            imageSignal?.status === "error"
              ? imageSignal.error || "Filtro local de imagen no disponible."
              : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "post_id" }
      );

    if (saveError) throw new Error(saveError.message);

    return NextResponse.json({
      ok: true,
      shadow_mode: true,
      engine: "alumni_shield",
      flagged: combined.flagged,
      suggested_action: combined.suggestedAction,
      top_category: combined.topCategory,
      top_score: combined.topScore,
      image_status: combined.imageStatus,
    });
  } catch (error: any) {
    await admin
      .from("post_moderation_results")
      .upsert(
        {
          post_id: post.id,
          user_id: post.user_id,
          provider: "alumni_shield",
          model: "rules-1.1+nsfwjs",
          status: "error",
          error_message: error?.message || "Error de moderación.",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "post_id" }
      );

    return NextResponse.json(
      { error: error?.message || "No se pudo moderar la publicación." },
      { status: 500 }
    );
  }
}
