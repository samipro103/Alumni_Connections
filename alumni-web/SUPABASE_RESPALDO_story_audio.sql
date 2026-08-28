-- RESPALDO: la migración ya fue aplicada al Supabase de Alumni.
-- NO necesitas ejecutarla nuevamente.

alter table public.stories
  add column if not exists music_storage_path text;

-- Bucket: story-audio
-- Público porque las stories actuales también usan URLs públicas.
-- Escritura/borrado: solo dentro de la carpeta auth.uid().
