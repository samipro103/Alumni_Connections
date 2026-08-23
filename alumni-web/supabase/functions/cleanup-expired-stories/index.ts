import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const secretKeys = JSON.parse(
      Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"
    );

    const secretKey =
      secretKeys.default ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !secretKey) {
      return Response.json(
        { error: "Supabase server credentials are unavailable." },
        { status: 500 }
      );
    }

    const admin = createClient(supabaseUrl, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const now = new Date().toISOString();

    const { data: expiredStories, error: loadError } =
      await admin
        .from("stories")
        .select("id, media_path")
        .lt("expires_at", now)
        .limit(500);

    if (loadError) throw loadError;

    if (!expiredStories?.length) {
      return Response.json({
        ok: true,
        deletedStories: 0,
        deletedFiles: 0,
        message: "No expired stories found.",
      });
    }

    const paths = expiredStories
      .map((story) => story.media_path)
      .filter(Boolean) as string[];

    let deletedFiles = 0;

    if (paths.length > 0) {
      for (let i = 0; i < paths.length; i += 100) {
        const chunk = paths.slice(i, i + 100);

        const { data, error } = await admin.storage
          .from("stories")
          .remove(chunk);

        if (error) {
          console.error("Storage cleanup error:", error);
        } else {
          deletedFiles += data?.length || 0;
        }
      }
    }

    const ids = expiredStories.map((story) => story.id);

    const { error: deleteError } = await admin
      .from("stories")
      .delete()
      .in("id", ids);

    if (deleteError) throw deleteError;

    return Response.json({
      ok: true,
      deletedStories: ids.length,
      deletedFiles,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected cleanup error.",
      },
      { status: 500 }
    );
  }
});
