import { supabase } from "./supabase";

export async function uploadImage(
  file: File,
  folder: "avatars" | "banners" | "posts",
  userId: string
) {
  const extension = file.name.split(".").pop();

  const fileName = `${folder}/${userId}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("profiles")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("profiles")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

function profileImageExtension(
  file: File
) {
  switch (file.type) {
    case "image/webp":
      return "webp";
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    default:
      return (
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "img"
      );
  }
}

export async function uploadProfileImage(
  file: File,
  folder: "avatars" | "banners",
  userId: string
) {
  const extension =
    profileImageExtension(file);

  const fileName =
    `${folder}/${userId}-${Date.now()}.${extension}`;

  const { error } =
    await supabase.storage
      .from("profiles")
      .upload(
        fileName,
        file,
        {
          cacheControl:
            "31536000",
          upsert: false,
          contentType:
            file.type ||
            undefined,
        }
      );

  if (error) throw error;

  const { data } =
    supabase.storage
      .from("profiles")
      .getPublicUrl(
        fileName
      );

  return data.publicUrl;
}

