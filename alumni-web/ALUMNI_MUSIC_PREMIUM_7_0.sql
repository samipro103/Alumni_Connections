-- ============================================================
-- ALUMNI MUSIC PREMIUM 7.0
-- Spotify Premium obligatorio para guardar música de perfil.
-- ============================================================

create table if not exists public.spotify_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  spotify_account_id text not null,
  spotify_user_id text,
  display_name text,
  product text not null default 'unknown',
  verified_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.spotify_connections
  enable row level security;

-- El usuario únicamente puede LEER el estado de su propia conexión.
-- No permitimos INSERT/UPDATE desde el cliente:
-- esas operaciones las hace el backend luego de verificar Spotify.
drop policy if exists
  "spotify_connections_select_own"
on public.spotify_connections;

create policy
  "spotify_connections_select_own"
on public.spotify_connections
for select
to authenticated
using (auth.uid() = user_id);

-- Seguridad real:
-- aunque alguien intente escribir directamente profile_music
-- desde DevTools, la BD exige una verificación Premium reciente.
create or replace function
public.require_spotify_premium_for_profile_music()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.spotify_connections sc
    where sc.user_id = new.user_id
      and lower(sc.product) = 'premium'
      and sc.verified_at >= now() - interval '30 days'
  ) then
    raise exception
      'SPOTIFY_PREMIUM_REQUIRED'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists
  trg_profile_music_requires_spotify_premium
on public.profile_music;

create trigger
  trg_profile_music_requires_spotify_premium
before insert or update
on public.profile_music
for each row
execute function
public.require_spotify_premium_for_profile_music();

-- Comprobación.
select
  tgname as trigger_name,
  tgrelid::regclass as tabla,
  case
    when tgenabled = 'O'
      then 'ACTIVO'
    else tgenabled::text
  end as estado
from pg_trigger
where tgname =
  'trg_profile_music_requires_spotify_premium';
