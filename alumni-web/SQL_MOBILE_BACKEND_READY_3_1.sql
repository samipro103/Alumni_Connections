-- =========================================================
-- ALUMNI CONNECTIONS - MOBILE/BACKEND READY 3.1
-- Ejecutar después de Social Intelligence 3.0
-- =========================================================

-- ---------------------------------------------------------
-- 1. DISPOSITIVOS DEL USUARIO
-- Preparado para web, Android e iOS.
-- ---------------------------------------------------------

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  platform text not null
    check (platform in ('web', 'android', 'ios')),

  device_name text,
  push_provider text,
  push_token text,

  app_version text,
  active boolean not null default true,

  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, push_token)
);

create index if not exists user_devices_user_idx
  on public.user_devices(user_id);

create index if not exists user_devices_push_idx
  on public.user_devices(push_token);

alter table public.user_devices enable row level security;

drop policy if exists "user_devices_select_own"
on public.user_devices;

create policy "user_devices_select_own"
on public.user_devices
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "user_devices_insert_own"
on public.user_devices;

create policy "user_devices_insert_own"
on public.user_devices
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "user_devices_update_own"
on public.user_devices;

create policy "user_devices_update_own"
on public.user_devices
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "user_devices_delete_own"
on public.user_devices;

create policy "user_devices_delete_own"
on public.user_devices
for delete
to authenticated
using (user_id = auth.uid());


-- ---------------------------------------------------------
-- 2. PREFERENCIAS DE NOTIFICACIONES
-- Se usarán tanto en web como en móvil.
-- ---------------------------------------------------------

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,

  push_enabled boolean not null default true,

  messages boolean not null default true,
  story_replies boolean not null default true,
  likes boolean not null default true,
  comments boolean not null default true,
  follows boolean not null default true,
  events boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences
enable row level security;

drop policy if exists "notification_preferences_select_own"
on public.notification_preferences;

create policy "notification_preferences_select_own"
on public.notification_preferences
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "notification_preferences_insert_own"
on public.notification_preferences;

create policy "notification_preferences_insert_own"
on public.notification_preferences
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "notification_preferences_update_own"
on public.notification_preferences;

create policy "notification_preferences_update_own"
on public.notification_preferences
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());


-- ---------------------------------------------------------
-- 3. CREAR PREFERENCIAS AUTOMÁTICAMENTE
-- para usuarios nuevos.
-- ---------------------------------------------------------

create or replace function public.create_default_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_notification_preferences_after_signup
on auth.users;

create trigger create_notification_preferences_after_signup
after insert on auth.users
for each row
execute function public.create_default_notification_preferences();


-- ---------------------------------------------------------
-- 4. CREAR PREFERENCIAS PARA USUARIOS EXISTENTES
-- ---------------------------------------------------------

insert into public.notification_preferences (user_id)
select id
from auth.users
on conflict (user_id) do nothing;
