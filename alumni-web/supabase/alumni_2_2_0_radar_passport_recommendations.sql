-- ============================================================
-- ALUMNI 2.2.0
-- RADAR + PASAPORTE + RECOMENDACIONES ENTRE AMIGOS
-- Ejecutar en Supabase SQL Editor
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.passport_countries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null,
  country_name text not null,
  note text,
  theme_style text not null default 'aurora',
  cover_photo_url text,
  created_at timestamptz not null default now(),
  unique (user_id, country_code)
);

create table if not exists public.passport_media (
  id uuid primary key default gen_random_uuid(),
  passport_country_id uuid not null references public.passport_countries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  media_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.friend_recommendations (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (
    category in ('restaurant', 'place', 'movie', 'trip', 'music', 'other')
  ),
  title text not null,
  subtitle text,
  description text,
  location_text text,
  external_url text,
  cover_image_url text,
  created_at timestamptz not null default now()
);

create index if not exists passport_countries_user_idx
  on public.passport_countries (user_id);

create index if not exists passport_media_country_idx
  on public.passport_media (passport_country_id);

create index if not exists friend_recommendations_user_idx
  on public.friend_recommendations (user_id);

create index if not exists friend_recommendations_category_idx
  on public.friend_recommendations (category);

alter table public.passport_countries enable row level security;
alter table public.passport_media enable row level security;
alter table public.friend_recommendations enable row level security;

drop policy if exists "passport_countries_select_authenticated" on public.passport_countries;
create policy "passport_countries_select_authenticated"
  on public.passport_countries
  for select
  to authenticated
  using (true);

drop policy if exists "passport_countries_insert_owner" on public.passport_countries;
create policy "passport_countries_insert_owner"
  on public.passport_countries
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "passport_countries_update_owner" on public.passport_countries;
create policy "passport_countries_update_owner"
  on public.passport_countries
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "passport_countries_delete_owner" on public.passport_countries;
create policy "passport_countries_delete_owner"
  on public.passport_countries
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "passport_media_select_authenticated" on public.passport_media;
create policy "passport_media_select_authenticated"
  on public.passport_media
  for select
  to authenticated
  using (true);

drop policy if exists "passport_media_insert_owner" on public.passport_media;
create policy "passport_media_insert_owner"
  on public.passport_media
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "passport_media_update_owner" on public.passport_media;
create policy "passport_media_update_owner"
  on public.passport_media
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "passport_media_delete_owner" on public.passport_media;
create policy "passport_media_delete_owner"
  on public.passport_media
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "friend_recommendations_select_authenticated" on public.friend_recommendations;
create policy "friend_recommendations_select_authenticated"
  on public.friend_recommendations
  for select
  to authenticated
  using (true);

drop policy if exists "friend_recommendations_insert_owner" on public.friend_recommendations;
create policy "friend_recommendations_insert_owner"
  on public.friend_recommendations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "friend_recommendations_update_owner" on public.friend_recommendations;
create policy "friend_recommendations_update_owner"
  on public.friend_recommendations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "friend_recommendations_delete_owner" on public.friend_recommendations;
create policy "friend_recommendations_delete_owner"
  on public.friend_recommendations
  for delete
  to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('passport-media', 'passport-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('recommendation-media', 'recommendation-media', true)
on conflict (id) do nothing;

drop policy if exists "passport_media_read" on storage.objects;
create policy "passport_media_read"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'passport-media');

drop policy if exists "passport_media_insert" on storage.objects;
create policy "passport_media_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'passport-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "passport_media_update" on storage.objects;
create policy "passport_media_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'passport-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'passport-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "passport_media_delete" on storage.objects;
create policy "passport_media_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'passport-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "recommendation_media_read" on storage.objects;
create policy "recommendation_media_read"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'recommendation-media');

drop policy if exists "recommendation_media_insert" on storage.objects;
create policy "recommendation_media_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'recommendation-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "recommendation_media_update" on storage.objects;
create policy "recommendation_media_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'recommendation-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'recommendation-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "recommendation_media_delete" on storage.objects;
create policy "recommendation_media_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'recommendation-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Marcadores útiles
comment on table public.passport_countries is 'ALUMNI_2_2_0_PASSPORT_COUNTRIES';
comment on table public.passport_media is 'ALUMNI_2_2_0_PASSPORT_MEDIA';
comment on table public.friend_recommendations is 'ALUMNI_2_2_0_FRIEND_RECOMMENDATIONS';
