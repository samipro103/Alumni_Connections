import { NextResponse } from "next/server";
import {
  moderatePostWithOpenAI,
  moderationAdminClient,
  verifyModerationUser,
} from "@/lib/moderationServer";

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

  await admin
    .from("post_moderation_results")
    .upsert(
      {
        post_id: post.id,
        user_id: post.user_id,
        provider: "openai",
        model: "omni-moderation-latest",
        status: "pending",
        flagged: null,
        suggested_action: null,
        top_category: null,
        top_score: null,
        error_message: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "post_id" }
    );

  try {
    const result = await moderatePostWithOpenAI({
      text: post.content,
      imageUrl: post.image_url,
    });

    const { error: saveError } = await admin
      .from("post_moderation_results")
      .upsert(
        {
          post_id: post.id,
          user_id: post.user_id,
          provider: "openai",
          model: "omni-moderation-latest",
          status: "completed",
          flagged: result.flagged,
          suggested_action: result.suggestedAction,
          top_category: result.topCategory,
          top_score: result.topScore,
          categories: result.categories,
          category_scores: result.categoryScores,
          category_applied_input_types:
            result.categoryAppliedInputTypes,
          raw_response: result.rawResponse,
          error_message: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "post_id" }
      );

    if (saveError) {
      throw new Error(saveError.message);
    }

    return NextResponse.json({
      ok: true,
      shadow_mode: true,
      flagged: result.flagged,
      suggested_action: result.suggestedAction,
      top_category: result.topCategory,
      top_score: result.topScore,
    });
  } catch (moderationError: any) {
    await admin
      .from("post_moderation_results")
      .upsert(
        {
          post_id: post.id,
          user_id: post.user_id,
          provider: "openai",
          model: "omni-moderation-latest",
          status: "error",
          error_message:
            moderationError?.message || "Error de moderación.",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "post_id" }
      );

    return NextResponse.json(
      {
        error:
          moderationError?.message ||
          "No se pudo moderar la publicación.",
        shadow_mode: true,
      },
      { status: 502 }
    );
  }
}
