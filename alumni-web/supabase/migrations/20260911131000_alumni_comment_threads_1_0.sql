-- ALUMNI COMMENT THREADS 1.0
-- Applied to production Supabase on 2026-09-11.

alter table public.comments
  add column if not exists parent_comment_id bigint null;

alter table public.comments
  drop constraint if exists comments_parent_comment_id_fkey;

alter table public.comments
  add constraint comments_parent_comment_id_fkey
  foreign key (parent_comment_id)
  references public.comments(id)
  on delete set null;

create index if not exists comments_parent_comment_idx
  on public.comments(parent_comment_id, created_at, id)
  where parent_comment_id is not null;

create or replace function public.alumni_validate_comment_parent()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_parent_post_id bigint;
begin
  if new.parent_comment_id is null then return new; end if;

  select c.post_id into v_parent_post_id
  from public.comments c
  where c.id = new.parent_comment_id;

  if v_parent_post_id is null then raise exception 'COMMENT_PARENT_NOT_FOUND'; end if;
  if v_parent_post_id is distinct from new.post_id then raise exception 'COMMENT_PARENT_POST_MISMATCH'; end if;
  if new.id is not null and new.parent_comment_id = new.id then raise exception 'COMMENT_SELF_PARENT_NOT_ALLOWED'; end if;
  return new;
end;
$$;

drop trigger if exists alumni_validate_comment_parent_trigger on public.comments;
create trigger alumni_validate_comment_parent_trigger
before insert or update of parent_comment_id, post_id
on public.comments
for each row execute function public.alumni_validate_comment_parent();

create or replace function public.alumni_post_comments_v1(p_post_id bigint, p_limit integer default 500)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'post_id', c.post_id,
        'user_id', c.user_id,
        'content', c.content,
        'created_at', c.created_at,
        'parent_comment_id', c.parent_comment_id,
        'profile', case when p.id is null then null else jsonb_build_object(
          'id', p.id, 'username', p.username, 'full_name', p.full_name, 'avatar_url', p.avatar_url
        ) end
      ) order by c.created_at asc, c.id asc
    ),
    '[]'::jsonb
  )
  from (
    select c0.* from public.comments c0
    where c0.post_id = p_post_id
    order by c0.created_at desc, c0.id desc
    limit least(greatest(coalesce(p_limit, 500), 1), 500)
  ) c
  left join public.profiles p on p.id = c.user_id;
$$;

create or replace function public.alumni_notify_comment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
  v_parent_owner uuid;
begin
  select p.user_id into v_owner from public.posts p where p.id = new.post_id;

  if new.parent_comment_id is not null then
    select c.user_id into v_parent_owner from public.comments c where c.id = new.parent_comment_id;
    if v_parent_owner is not null and v_parent_owner <> new.user_id then
      insert into public.notifications(user_id,actor_id,type,post_id,target_type,target_id)
      values(v_parent_owner,new.user_id,'comment_reply',new.post_id,'post_comment',new.id::text);
    end if;
  end if;

  if v_owner is not null and v_owner <> new.user_id and v_owner is distinct from v_parent_owner then
    insert into public.notifications(user_id,actor_id,type,post_id,target_type,target_id)
    values(v_owner,new.user_id,'comment',new.post_id,'post_comment',new.id::text);
  end if;

  return new;
end;
$$;

analyze public.comments;
