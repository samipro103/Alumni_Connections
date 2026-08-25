begin;

alter table public.stories
  add column if not exists story_overlay jsonb;

comment on column public.stories.story_overlay is
  'ALUMNI Stories 2.0: texto libre, posicion, enlace y publicacion compartida como metadata JSON.';

commit;
