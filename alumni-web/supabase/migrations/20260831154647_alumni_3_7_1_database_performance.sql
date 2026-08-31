-- ALUMNI 3.7.1 - Database Performance
-- Applied to production Supabase:
-- migration name: alumni_3_7_1_database_performance
-- Project: qmsvoytjdivfhqgmvcge

create index if not exists posts_created_at_desc_idx
  on public.posts (created_at desc);

create index if not exists comments_post_created_idx
  on public.comments (post_id, created_at);

create unique index if not exists likes_post_user_unique
  on public.likes (post_id, user_id);

create index if not exists messages_sender_receiver_created_idx
  on public.messages (sender_id, receiver_id, created_at desc);

create index if not exists messages_sender_created_idx
  on public.messages (sender_id, created_at desc);

create index if not exists messages_receiver_created_idx
  on public.messages (receiver_id, created_at desc);

create index if not exists stories_user_expires_created_idx
  on public.stories (user_id, expires_at, created_at);

create index if not exists story_views_viewer_story_idx
  on public.story_views (viewer_id, story_id);

create or replace function public.alumni_can_manage_posts()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.admin_permissions ap
    where ap.user_id = (select auth.uid())
      and ap.manage_posts = true
  );
$function$;

create or replace function public.alumni_mfa_ok()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select case
    when (select auth.uid()) is null then true
    when not exists (
      select 1
      from public.account_security s
      where s.user_id = (select auth.uid())
        and s.mfa_required = true
    ) then true
    else (
      public.alumni_email_2fa_session_verified()
      or coalesce((select auth.jwt()) ->> 'aal', 'aal1') = 'aal2'
    )
  end;
$function$;

create or replace function public.can_view_profile_content(owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    owner_id = (select auth.uid())
    or public.alumni_can_manage_posts()
    or (
      public.alumni_users_not_blocked((select auth.uid()), owner_id)
      and (
        coalesce(
          (
            select p.is_private
            from public.profiles p
            where p.id = owner_id
          ),
          false
        ) = false
        or exists (
          select 1
          from public.follows f
          where f.follower_id = (select auth.uid())
            and f.following_id = owner_id
        )
      )
    );
$function$;

create or replace function public.alumni_can_create_notification(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_post_id bigint,
  p_target_type text,
  p_target_id text
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
  if (select auth.uid()) is null
     or p_actor_id is distinct from (select auth.uid())
     or p_user_id is null
     or p_user_id = (select auth.uid())
     or not public.alumni_users_not_blocked(
       p_actor_id,
       p_user_id
     ) then
    return false;
  end if;

  if p_type = 'like'
     and (
       p_target_type = 'post'
       or p_target_type is null
     )
     and p_post_id is not null then
    return exists (
      select 1
      from public.likes l
      join public.posts p
        on p.id = l.post_id
      where l.post_id = p_post_id
        and l.user_id = p_actor_id
        and p.user_id = p_user_id
    );
  end if;

  if p_type = 'comment'
     and p_post_id is not null then
    return exists (
      select 1
      from public.comments c
      join public.posts p
        on p.id = c.post_id
      where c.post_id = p_post_id
        and c.user_id = p_actor_id
        and p.user_id = p_user_id
        and (
          p_target_id is null
          or (
            p_target_id ~ '^[0-9]+$'
            and c.id =
              p_target_id::bigint
          )
        )
    );
  end if;

  if p_type = 'follow' then
    return exists (
      select 1
      from public.follows f
      where f.follower_id =
        p_actor_id
        and f.following_id =
          p_user_id
    );
  end if;

  if p_type = 'like'
     and p_target_type = 'comment'
     and p_target_id ~ '^[0-9]+$' then
    return exists (
      select 1
      from public.comment_likes cl
      join public.comments c
        on c.id = cl.comment_id
      where cl.comment_id =
        p_target_id::bigint
        and cl.user_id =
          p_actor_id
        and c.user_id =
          p_user_id
    );
  end if;

  if p_type = 'like'
     and p_target_type = 'story'
     and p_target_id ~
       '^[0-9a-fA-F-]{36}$' then
    return exists (
      select 1
      from public.story_likes sl
      join public.stories s
        on s.id = sl.story_id
      where sl.story_id =
        p_target_id::uuid
        and sl.user_id =
          p_actor_id
        and s.user_id =
          p_user_id
    );
  end if;

  if p_type = 'story_reply'
     and p_target_type = 'message'
     and p_target_id ~ '^[0-9]+$' then
    return exists (
      select 1
      from public.messages m
      where m.id =
        p_target_id::bigint
        and m.sender_id =
          p_actor_id
        and m.receiver_id =
          p_user_id
        and m.message_type =
          'story_reply'
    );
  end if;

  return false;
end;
$function$;

do $migration$
declare
  r record;
  q text;
  c text;
  statement text;
begin
  for r in
    select
      schemaname,
      tablename,
      policyname,
      qual,
      with_check
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'posts',
        'likes',
        'comments',
        'post_media',
        'post_reposts',
        'post_saves',
        'stories',
        'story_views',
        'story_likes',
        'notifications',
        'messages',
        'follows',
        'follow_requests'
      )
  loop
    q := r.qual;
    c := r.with_check;

    if q is not null then
      q := replace(
        q,
        'auth.uid()',
        '(select auth.uid())'
      );
      q := replace(
        q,
        'alumni_can_manage_posts()',
        '(select public.alumni_can_manage_posts())'
      );
      q := replace(
        q,
        'alumni_mfa_ok()',
        '(select public.alumni_mfa_ok())'
      );
    end if;

    if c is not null then
      c := replace(
        c,
        'auth.uid()',
        '(select auth.uid())'
      );
      c := replace(
        c,
        'alumni_can_manage_posts()',
        '(select public.alumni_can_manage_posts())'
      );
      c := replace(
        c,
        'alumni_mfa_ok()',
        '(select public.alumni_mfa_ok())'
      );
    end if;

    if q is distinct from r.qual
       or c is distinct from r.with_check then
      statement := format(
        'alter policy %I on %I.%I',
        r.policyname,
        r.schemaname,
        r.tablename
      );

      if q is not null then
        statement :=
          statement ||
          ' using (' ||
          q ||
          ')';
      end if;

      if c is not null then
        statement :=
          statement ||
          ' with check (' ||
          c ||
          ')';
      end if;

      execute statement;
    end if;
  end loop;
end;
$migration$;

analyze public.posts;
analyze public.comments;
analyze public.likes;
analyze public.messages;
analyze public.stories;
analyze public.story_views;
