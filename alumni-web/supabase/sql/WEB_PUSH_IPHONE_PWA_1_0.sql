-- ============================================================
-- ALUMNI CONNECTIONS
-- WEB PUSH GRATIS PARA iPHONE / PWA 1.0
-- ============================================================

create table if not exists public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  platform text not null default 'web',
  active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.web_push_subscriptions
  add column if not exists endpoint text;

alter table public.web_push_subscriptions
  add column if not exists p256dh text;

alter table public.web_push_subscriptions
  add column if not exists auth text;

alter table public.web_push_subscriptions
  add column if not exists user_agent text;

alter table public.web_push_subscriptions
  add column if not exists platform text not null default 'web';

alter table public.web_push_subscriptions
  add column if not exists active boolean not null default true;

alter table public.web_push_subscriptions
  add column if not exists last_seen_at timestamptz not null default now();

alter table public.web_push_subscriptions
  add column if not exists created_at timestamptz not null default now();

alter table public.web_push_subscriptions
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists web_push_subscriptions_user_endpoint_uidx
  on public.web_push_subscriptions(user_id, endpoint);

create index if not exists web_push_subscriptions_user_active_idx
  on public.web_push_subscriptions(user_id, active);

alter table public.web_push_subscriptions enable row level security;

drop policy if exists "web_push_select_own"
on public.web_push_subscriptions;

create policy "web_push_select_own"
on public.web_push_subscriptions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "web_push_insert_own"
on public.web_push_subscriptions;

create policy "web_push_insert_own"
on public.web_push_subscriptions
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "web_push_update_own"
on public.web_push_subscriptions;

create policy "web_push_update_own"
on public.web_push_subscriptions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "web_push_delete_own"
on public.web_push_subscriptions;

create policy "web_push_delete_own"
on public.web_push_subscriptions
for delete
to authenticated
using (user_id = auth.uid());

create or replace function public.register_web_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(p_endpoint), '') is null then
    raise exception 'Push endpoint is required';
  end if;

  if nullif(trim(p_p256dh), '') is null then
    raise exception 'p256dh is required';
  end if;

  if nullif(trim(p_auth), '') is null then
    raise exception 'auth is required';
  end if;

  update public.web_push_subscriptions
  set
    active = false,
    updated_at = now()
  where endpoint = p_endpoint
    and user_id <> v_user_id
    and active = true;

  insert into public.web_push_subscriptions (
    user_id,
    endpoint,
    p256dh,
    auth,
    user_agent,
    platform,
    active,
    last_seen_at,
    updated_at
  )
  values (
    v_user_id,
    trim(p_endpoint),
    trim(p_p256dh),
    trim(p_auth),
    p_user_agent,
    'ios-pwa',
    true,
    now(),
    now()
  )
  on conflict (user_id, endpoint)
  do update set
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    user_agent = excluded.user_agent,
    platform = excluded.platform,
    active = true,
    last_seen_at = now(),
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.register_web_push_subscription(
  text, text, text, text
) from public;

grant execute on function public.register_web_push_subscription(
  text, text, text, text
) to authenticated;

create or replace function public.unregister_web_push_subscription(
  p_endpoint text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.web_push_subscriptions
  set
    active = false,
    updated_at = now()
  where user_id = auth.uid()
    and endpoint = p_endpoint;
$$;

revoke all on function public.unregister_web_push_subscription(text)
from public;

grant execute on function public.unregister_web_push_subscription(text)
to authenticated;
