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
