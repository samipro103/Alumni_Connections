-- ============================================================
-- ALUMNI SPOTIFY SESSION 7.4
-- OAuth state + Spotify tokens persistidos en Supabase.
-- Evita depender de cookies entre PWA/Safari/Spotify.
-- ============================================================

create table if not exists public.spotify_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  return_to text not null default '/settings?section=music',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.spotify_oauth_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  scope text,
  token_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.spotify_oauth_states enable row level security;
alter table public.spotify_oauth_tokens enable row level security;

revoke all on table public.spotify_oauth_states from anon, authenticated;
revoke all on table public.spotify_oauth_tokens from anon, authenticated;

-- Las conexiones que existían antes de 7.4 no tenían tokens persistidos.
-- Las dejamos como pendientes para obligar una reconexión limpia.
update public.spotify_connections sc
set product = 'pending',
    updated_at = now()
where not exists (
  select 1
  from public.spotify_oauth_tokens t
  where t.user_id = sc.user_id
);

select
  to_regclass('public.spotify_connections') as spotify_connections,
  to_regclass('public.spotify_oauth_states') as spotify_oauth_states,
  to_regclass('public.spotify_oauth_tokens') as spotify_oauth_tokens;
