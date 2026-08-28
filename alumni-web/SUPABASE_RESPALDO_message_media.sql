-- YA APLICADO EN SUPABASE. SOLO RESPALDO.
alter table public.messages
  add column if not exists media_path text,
  add column if not exists media_type text,
  add column if not exists media_mime text,
  add column if not exists media_name text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-media','message-media',false,52428800,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
