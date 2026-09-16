-- ============================================================
-- ALUMNI — RECOMMENDATIONS 2.0
-- Server-side candidate generation + ranking
-- 2026-09-16
-- ============================================================

begin;

create index if not exists alumni_recs_follows_follower_following_idx
on public.follows (follower_id, following_id);

create index if not exists alumni_recs_follows_following_follower_idx
on public.follows (following_id, follower_id);

create index if not exists alumni_recs_follow_requests_requester_target_idx
on public.follow_requests (requester_id, target_id);

create index if not exists alumni_recs_posts_user_created_idx
on public.posts (user_id, created_at desc);

create or replace function public.alumni_recommended_profiles_v2(
  p_limit integer default 12
)
returns table (
  id uuid,
  username text,
  avatar_url text,
  full_name text,
  university text,
  education_institution_name text,
  education_program_name text,
  career text,
  city text,
  country text,
  residence_country_code text,
  bio text,
  is_private boolean,
  score integer,
  mutual_count bigint,
  reason text,
  recommendation_bucket text
)
language sql
stable
security invoker
set search_path = public
as $$
with settings as (
  select
    auth.uid() as viewer_id,
    greatest(1, least(coalesce(p_limit, 12), 30)) as wanted
),
me as (
  select
    p.id,
    lower(btrim(coalesce(p.education_institution_name, p.university, ''))) as institution_key,
    lower(btrim(coalesce(p.education_program_name, ''))) as program_key,
    lower(btrim(coalesce(p.career, ''))) as career_key,
    lower(btrim(coalesce(p.city, ''))) as city_key,
    lower(btrim(coalesce(p.residence_country_code, p.country, ''))) as country_key
  from public.profiles p
  join settings s on s.viewer_id = p.id
),
excluded as (
  select s.viewer_id as profile_id
  from settings s

  union

  select f.following_id
  from public.follows f
  join settings s on f.follower_id = s.viewer_id

  union

  select fr.target_id
  from public.follow_requests fr
  join settings s on fr.requester_id = s.viewer_id
),
mutuals as (
  select
    cf.follower_id as candidate_id,
    count(*)::bigint as mutual_count
  from public.follows cf
  join public.follows mine_f
    on mine_f.following_id = cf.following_id
  join settings s
    on mine_f.follower_id = s.viewer_id
  where cf.follower_id <> s.viewer_id
  group by cf.follower_id
),
recent_activity as (
  select
    p.user_id,
    count(*)::integer as posts_30d
  from public.posts p
  where p.created_at >= now() - interval '30 days'
  group by p.user_id
),
scored as (
  select
    p.id,
    p.username,
    p.avatar_url,
    p.full_name,
    p.university,
    p.education_institution_name,
    p.education_program_name,
    p.career,
    p.city,
    p.country,
    p.residence_country_code,
    p.bio,
    coalesce(p.is_private, false) as is_private,
    coalesce(m.mutual_count, 0) as mutual_count,
    (
      case
        when me.program_key <> ''
          and lower(btrim(coalesce(p.education_program_name, ''))) = me.program_key
          then 52 else 0
      end
      +
      case
        when me.career_key <> ''
          and lower(btrim(coalesce(p.career, ''))) = me.career_key
          then 40 else 0
      end
      +
      case
        when me.institution_key <> ''
          and lower(btrim(coalesce(p.education_institution_name, p.university, ''))) = me.institution_key
          then 36 else 0
      end
      + least(coalesce(m.mutual_count, 0) * 9, 27)::integer
      +
      case
        when me.city_key <> ''
          and lower(btrim(coalesce(p.city, ''))) = me.city_key
          then 12
        when me.country_key <> ''
          and lower(btrim(coalesce(p.residence_country_code, p.country, ''))) = me.country_key
          then 5
        else 0
      end
      + least(coalesce(a.posts_30d, 0) * 2, 8)
      + case when nullif(btrim(coalesce(p.avatar_url, '')), '') is not null then 3 else 0 end
      + case when nullif(btrim(coalesce(p.bio, '')), '') is not null then 2 else 0 end
    )::integer as score,
    case
      when me.program_key <> ''
        and lower(btrim(coalesce(p.education_program_name, ''))) = me.program_key
        then 'program'
      when me.career_key <> ''
        and lower(btrim(coalesce(p.career, ''))) = me.career_key
        then 'career'
      when me.institution_key <> ''
        and lower(btrim(coalesce(p.education_institution_name, p.university, ''))) = me.institution_key
        then 'institution'
      when coalesce(m.mutual_count, 0) > 0 then 'mutual'
      when me.city_key <> ''
        and lower(btrim(coalesce(p.city, ''))) = me.city_key
        then 'local'
      when coalesce(a.posts_30d, 0) > 0 then 'active'
      else 'discover'
    end as recommendation_bucket,
    case
      when me.program_key <> ''
        and lower(btrim(coalesce(p.education_program_name, ''))) = me.program_key
        and nullif(btrim(coalesce(p.education_program_name, '')), '') is not null
        then p.education_program_name
      when coalesce(m.mutual_count, 0) > 0
        then coalesce(m.mutual_count, 0)::text ||
          case when coalesce(m.mutual_count, 0) = 1
            then ' conexión en común'
            else ' conexiones en común'
          end
      when me.career_key <> ''
        and lower(btrim(coalesce(p.career, ''))) = me.career_key
        and nullif(btrim(coalesce(p.career, '')), '') is not null
        then p.career
      when me.institution_key <> ''
        and lower(btrim(coalesce(p.education_institution_name, p.university, ''))) = me.institution_key
        then coalesce(
          nullif(btrim(p.education_institution_name), ''),
          p.university
        )
      when me.city_key <> ''
        and lower(btrim(coalesce(p.city, ''))) = me.city_key
        then p.city
      when coalesce(a.posts_30d, 0) > 0
        then 'Activo en ALUMNI'
      else coalesce(
        nullif(btrim(p.career), ''),
        nullif(btrim(p.education_institution_name), ''),
        nullif(btrim(p.university), ''),
        'Perfil de la comunidad'
      )
    end as reason
  from public.profiles p
  cross join me
  left join mutuals m on m.candidate_id = p.id
  left join recent_activity a on a.user_id = p.id
  where p.id not in (select e.profile_id from excluded e)
    and nullif(btrim(coalesce(p.username, '')), '') is not null
),
bucketed as (
  select
    scored.*,
    row_number() over (
      partition by recommendation_bucket
      order by score desc, id
    ) as bucket_rank
  from scored
),
final_rank as (
  select
    bucketed.*,
    (
      score - greatest(bucket_rank - 2, 0) * 3
    ) as diversified_score
  from bucketed
)
select
  f.id,
  f.username,
  f.avatar_url,
  f.full_name,
  f.university,
  f.education_institution_name,
  f.education_program_name,
  f.career,
  f.city,
  f.country,
  f.residence_country_code,
  f.bio,
  f.is_private,
  f.score,
  f.mutual_count,
  f.reason,
  f.recommendation_bucket
from final_rank f
cross join settings s
order by
  f.diversified_score desc,
  f.score desc,
  f.id
limit (select wanted from settings);
$$;

revoke all
on function public.alumni_recommended_profiles_v2(integer)
from public;

grant execute
on function public.alumni_recommended_profiles_v2(integer)
to authenticated;

commit;

-- ALUMNI_RECOMMENDATIONS_2_0
