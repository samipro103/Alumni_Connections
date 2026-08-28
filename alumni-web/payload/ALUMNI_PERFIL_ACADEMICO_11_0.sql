-- ============================================================
-- ALUMNI CONNECTIONS
-- PERFIL ACADÉMICO 11.0
-- Carrera dependiente de universidad
-- ============================================================

alter table public.profiles
  add column if not exists career text;

-- Opcional: índices suaves para búsquedas futuras.
create index if not exists profiles_university_idx
  on public.profiles (university);

create index if not exists profiles_career_idx
  on public.profiles (career);

select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('university', 'career', 'program')
order by ordinal_position;
