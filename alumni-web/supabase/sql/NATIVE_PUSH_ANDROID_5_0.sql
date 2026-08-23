-- ============================================================
-- ALUMNI CONNECTIONS - NATIVE PUSH ANDROID 5.0
-- ============================================================

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'android',
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

alter table public.user_devices
  add column if not exists platform text;

alter table public.user_devices
  add column if not exists device_name text;

alter table public.user_devices
  add column if not exists push_provider text;

alter table public.user_devices
  add column if not exists push_token text;

alter table public.user_devices
  add column if not exists app_version text;

alter table public.user_devices
  add column if not exists active boolean not null default true;

alter table public.user_devices
  add column if not exists last_seen_at timestamptz not null default now();

alter table public.user_devices
  add column if not exists created_at timestamptz not null default now();

alter table public.user_devices
  add column if not exists updated_at timestamptz not null default now();

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
  add column if not exists push_enabled boolean not null default true;

alter table public.notification_preferences
  add column if not exists messages boolean not null default true;

alter table public.notification_preferences
  add column if not exists story_replies boolean not null default true;

alter table public.notification_preferences
  add column if not exists likes boolean not null default true;

alter table public.notification_preferences
  add column if not exists comments boolean not null default true;

alter table public.notification_preferences
  add column if not exists follows boolean not null default true;

alter table public.notification_preferences
  add column if not exists events boolean not null default true;

-- Reclama de forma segura un token para la sesión autenticada.
-- Si el mismo teléfono inicia sesión con otra cuenta, el token anterior
-- se desactiva para evitar notificaciones cruzadas.
create or replace function public.register_push_device(
  p_push_token text,
  p_platform text default 'android',
  p_device_name text default null,
  p_push_provider text default 'fcm',
  p_app_version text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(p_push_token), '') is null then
    raise exception 'Push token is required';
  end if;

  update public.user_devices
  set
    active = false,
    updated_at = now()
  where
    push_token = p_push_token
    and user_id <> v_user_id
    and active = true;

  insert into public.user_devices (
    user_id,
    platform,
    device_name,
    push_provider,
    push_token,
    app_version,
    active,
    last_seen_at,
    updated_at
  )
  values (
    v_user_id,
    coalesce(nullif(trim(p_platform), ''), 'android'),
    p_device_name,
    coalesce(nullif(trim(p_push_provider), ''), 'fcm'),
    trim(p_push_token),
    p_app_version,
    true,
    now(),
    now()
  )
  on conflict (user_id, push_token)
  do update set
    platform = excluded.platform,
    device_name = excluded.device_name,
    push_provider = excluded.push_provider,
    app_version = excluded.app_version,
    active = true,
    last_seen_at = now(),
    updated_at = now();
end;
$$;

revoke all on function public.register_push_device(
  text, text, text, text, text
) from public;

grant execute on function public.register_push_device(
  text, text, text, text, text
) to authenticated;

insert into public.notification_preferences (user_id)
select id
from auth.users
on conflict (user_id) do nothing;
