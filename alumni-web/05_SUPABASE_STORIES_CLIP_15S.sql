-- ============================================================
-- ALUMNI MUSIC + STORIES 15s 2.3
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

alter table public.stories
  add column if not exists music_clip_start_seconds integer not null default 0;

alter table public.stories
  add column if not exists music_clip_duration_seconds integer not null default 15;

-- Las historias musicales nuevas usan siempre 15 segundos.
-- Normalizamos las historias existentes también.
update public.stories
set music_clip_duration_seconds = 15
where music_clip_duration_seconds is distinct from 15;

select
  id,
  media_type,
  music_title,
  music_clip_start_seconds,
  music_clip_duration_seconds
from public.stories
order by created_at desc
limit 10;
