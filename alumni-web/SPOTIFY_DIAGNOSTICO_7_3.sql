-- ============================================================
-- ALUMNI - DIAGNOSTICO SPOTIFY 7.3
-- Solo lectura. No modifica nada.
-- ============================================================

-- 1) Confirmar que la tabla existe.
select
  to_regclass('public.spotify_connections') as tabla_spotify_connections;

-- 2) Ver conexiones registradas recientemente.
select
  user_id,
  spotify_account_id,
  spotify_user_id,
  display_name,
  product,
  verified_at,
  updated_at
from public.spotify_connections
order by updated_at desc
limit 20;

-- 3) Confirmar el trigger Premium del perfil.
select
  tgname as trigger_name,
  tgrelid::regclass as tabla,
  case
    when tgenabled = 'O' then 'ACTIVO'
    else tgenabled::text
  end as estado
from pg_trigger
where tgname =
  'trg_profile_music_requires_spotify_premium';
