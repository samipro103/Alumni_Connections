-- ALUMNI 3.7.4 - Events RLS consolidation & RPC surface hardening
-- Already applied to production Supabase project qmsvoytjdivfhqgmvcge.

drop policy if exists comments_select_visible on public.comments;

create policy comments_select_visible_anon
on public.comments
for select
to anon
using (
  exists (
    select 1
    from public.posts p
    where p.id = comments.post_id
      and public.can_view_profile_content(p.user_id)
  )
);

create policy comments_select_visible_authenticated
on public.comments
for select
to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.id = comments.post_id
      and public.can_view_profile_content(p.user_id)
  )
  and (
    (select auth.uid()) is null
    or comments.user_id is null
    or (select public.alumni_can_manage_posts())
    or public.alumni_users_not_blocked((select auth.uid()), comments.user_id)
  )
);

drop policy if exists communities_select_visible on public.communities;

create policy communities_select_visible_anon
on public.communities
for select
to anon
using (visibility = 'public');

create policy communities_select_visible_authenticated
on public.communities
for select
to authenticated
using (
  visibility = 'public'
  or public.alumni_community_visible(id, (select auth.uid()))
);

drop policy if exists community_members_select_visible on public.community_members;

create policy community_members_select_visible_anon
on public.community_members
for select
to anon
using (
  exists (
    select 1
    from public.communities c
    where c.id = community_members.community_id
      and c.visibility = 'public'
  )
);

create policy community_members_select_visible_authenticated
on public.community_members
for select
to authenticated
using (
  public.alumni_community_visible(community_id, (select auth.uid()))
);

drop policy if exists community_posts_select_visible on public.community_posts;

create policy community_posts_select_visible_anon
on public.community_posts
for select
to anon
using (
  deleted_at is null
  and exists (
    select 1
    from public.communities c
    where c.id = community_posts.community_id
      and c.visibility = 'public'
  )
);

create policy community_posts_select_visible_authenticated
on public.community_posts
for select
to authenticated
using (
  deleted_at is null
  and public.alumni_community_visible(community_id, (select auth.uid()))
);

drop policy if exists events_read_visible on public.events;

create policy events_read_visible_anon
on public.events
for select
to anon
using (
  visibility = 'public'
  or (
    community_id is not null
    and exists (
      select 1
      from public.communities c
      where c.id = events.community_id
        and c.visibility = 'public'
    )
  )
);

create policy events_read_visible_authenticated
on public.events
for select
to authenticated
using (
  visibility = 'public'
  or (
    community_id is not null
    and public.alumni_community_visible(community_id, (select auth.uid()))
  )
);

drop policy if exists event_rsvps_select_visible on public.event_rsvps;

create policy event_rsvps_select_visible_anon
on public.event_rsvps
for select
to anon
using (
  exists (
    select 1
    from public.events e
    where e.id = event_rsvps.event_id
      and (
        e.visibility = 'public'
        or (
          e.community_id is not null
          and exists (
            select 1
            from public.communities c
            where c.id = e.community_id
              and c.visibility = 'public'
          )
        )
      )
  )
);

create policy event_rsvps_select_visible_authenticated
on public.event_rsvps
for select
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = event_rsvps.event_id
      and (
        e.visibility = 'public'
        or (
          e.community_id is not null
          and public.alumni_community_visible(e.community_id, (select auth.uid()))
        )
      )
  )
);

drop policy if exists events_admin_insert on public.events;
drop policy if exists events_create_own on public.events;

create policy events_insert_authorized
on public.events
for insert
to authenticated
with check (
  (
    public.has_admin_permission('manage_events')
    and (
      created_by is null
      or created_by = (select auth.uid())
    )
  )
  or
  (
    created_by = (select auth.uid())
    and (
      community_id is null
      or public.alumni_is_community_member(community_id, (select auth.uid()))
    )
  )
);

drop policy if exists events_admin_update on public.events;
drop policy if exists events_update_creator_or_community_manager on public.events;

create policy events_update_authorized
on public.events
for update
to authenticated
using (
  public.has_admin_permission('manage_events')
  or created_by = (select auth.uid())
  or (
    community_id is not null
    and public.alumni_can_manage_community(community_id, (select auth.uid()))
  )
)
with check (
  public.has_admin_permission('manage_events')
  or created_by = (select auth.uid())
  or (
    community_id is not null
    and public.alumni_can_manage_community(community_id, (select auth.uid()))
  )
);

drop policy if exists events_admin_delete on public.events;
drop policy if exists events_delete_creator_or_community_manager on public.events;

create policy events_delete_authorized
on public.events
for delete
to authenticated
using (
  public.has_admin_permission('manage_events')
  or created_by = (select auth.uid())
  or (
    community_id is not null
    and public.alumni_can_manage_community(community_id, (select auth.uid()))
  )
);

revoke execute on function public.alumni_can_manage_community(uuid, uuid) from public, anon;
grant execute on function public.alumni_can_manage_community(uuid, uuid) to authenticated, service_role;

revoke execute on function public.alumni_can_manage_posts() from public, anon;
grant execute on function public.alumni_can_manage_posts() to authenticated, service_role;

revoke execute on function public.alumni_can_view_passport_owner(uuid) from public, anon;
grant execute on function public.alumni_can_view_passport_owner(uuid) to authenticated, service_role;

revoke execute on function public.alumni_community_visible(uuid, uuid) from public, anon;
grant execute on function public.alumni_community_visible(uuid, uuid) to authenticated, service_role;

revoke execute on function public.alumni_email_2fa_session_verified() from public, anon;
grant execute on function public.alumni_email_2fa_session_verified() to authenticated, service_role;

revoke execute on function public.alumni_email_2fa_status() from public, anon;
grant execute on function public.alumni_email_2fa_status() to authenticated, service_role;

revoke execute on function public.alumni_is_community_member(uuid, uuid) from public, anon;
grant execute on function public.alumni_is_community_member(uuid, uuid) to authenticated, service_role;

revoke execute on function public.alumni_cleanup_email_2fa() from public, anon, authenticated;
grant execute on function public.alumni_cleanup_email_2fa() to service_role;

analyze public.comments;
analyze public.communities;
analyze public.community_members;
analyze public.community_posts;
analyze public.events;
analyze public.event_rsvps;
