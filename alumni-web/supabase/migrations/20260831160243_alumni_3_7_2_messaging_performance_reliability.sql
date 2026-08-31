-- ALUMNI 3.7.2 - Messaging Performance & Reliability
-- Applied to production Supabase:
-- migration name: alumni_3_7_2_messaging_performance_reliability
-- project: qmsvoytjdivfhqgmvcge

create or replace function public.get_my_direct_conversations()
returns table(
  peer_id uuid,
  username text,
  avatar_url text,
  university text,
  career text,
  last_message_id bigint,
  last_sender_id uuid,
  last_receiver_id uuid,
  last_content text,
  last_message_type text,
  last_media_type text,
  last_media_name text,
  last_read_at timestamp with time zone,
  last_created_at timestamp with time zone,
  unread_count bigint
)
language sql
stable
security invoker
set search_path to 'public'
as $function$
  with me as (
    select auth.uid() as uid
  ),
  direct_rows as (
    select
      m.id,
      m.sender_id,
      m.receiver_id,
      m.content,
      m.message_type,
      m.media_type,
      m.media_name,
      m.read_at,
      m.created_at,
      m.receiver_id as peer_id
    from public.messages m
    cross join me
    where me.uid is not null
      and m.sender_id = me.uid

    union all

    select
      m.id,
      m.sender_id,
      m.receiver_id,
      m.content,
      m.message_type,
      m.media_type,
      m.media_name,
      m.read_at,
      m.created_at,
      m.sender_id as peer_id
    from public.messages m
    cross join me
    where me.uid is not null
      and m.receiver_id = me.uid
  ),
  ranked as (
    select
      d.*,
      row_number() over (
        partition by d.peer_id
        order by d.created_at desc, d.id desc
      ) as row_rank,
      count(*) filter (
        where d.receiver_id = (select uid from me)
          and d.read_at is null
      ) over (
        partition by d.peer_id
      ) as unread_count
    from direct_rows d
  )
  select
    r.peer_id,
    p.username::text,
    p.avatar_url::text,
    p.university::text,
    p.career::text,
    r.id as last_message_id,
    r.sender_id as last_sender_id,
    r.receiver_id as last_receiver_id,
    r.content as last_content,
    r.message_type as last_message_type,
    r.media_type as last_media_type,
    r.media_name as last_media_name,
    r.read_at as last_read_at,
    r.created_at as last_created_at,
    r.unread_count
  from ranked r
  join public.profiles p
    on p.id = r.peer_id
  where r.row_rank = 1
  order by r.created_at desc, r.id desc;
$function$;

revoke all
  on function public.get_my_direct_conversations()
  from public;

revoke execute
  on function public.get_my_direct_conversations()
  from anon;

grant execute
  on function public.get_my_direct_conversations()
  to authenticated;

grant execute
  on function public.get_my_direct_conversations()
  to service_role;

analyze public.messages;
analyze public.profiles;
