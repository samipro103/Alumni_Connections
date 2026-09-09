-- ALUMNI 3.7.3 - Secondary Performance & Reliability
-- Applied to production Supabase:
-- migration name: alumni_3_7_3_secondary_performance_reliability
-- project: qmsvoytjdivfhqgmvcge
--
-- Mechanical performance changes only:
-- 1) covering indexes for every FK still flagged by the Performance Advisor
-- 2) auth.uid() initplan optimization in secondary RLS policies
--
-- Event permissive-policy consolidation is intentionally NOT part of this migration.

create index if not exists admin_audit_log_actor_user_id_idx
  on public.admin_audit_log (actor_user_id);

create index if not exists admin_audit_log_target_user_id_idx
  on public.admin_audit_log (target_user_id);

create index if not exists feedback_reports_user_id_idx
  on public.feedback_reports (user_id);

create index if not exists group_message_reactions_user_id_idx
  on public.group_message_reactions (user_id);

create index if not exists message_reactions_user_id_idx
  on public.message_reactions (user_id);

create index if not exists passport_country_comments_user_id_idx
  on public.passport_country_comments (user_id);

create index if not exists passport_country_likes_user_id_idx
  on public.passport_country_likes (user_id);

create index if not exists post_hashtags_user_id_idx
  on public.post_hashtags (user_id);

create index if not exists post_moderation_results_reviewed_by_idx
  on public.post_moderation_results (reviewed_by);

create index if not exists profile_pinned_posts_post_id_idx
  on public.profile_pinned_posts (post_id);

create index if not exists profile_travel_status_source_passport_country_id_idx
  on public.profile_travel_status (source_passport_country_id);

create index if not exists profiles_education_institution_id_idx
  on public.profiles (education_institution_id);

create index if not exists profiles_education_program_id_idx
  on public.profiles (education_program_id);

create index if not exists spotify_oauth_states_user_id_idx
  on public.spotify_oauth_states (user_id);

-- Preserve each policy's command, roles, permissiveness and boolean logic.
-- Only turn raw auth.uid() calls into initplans while leaving already-optimized
-- calls untouched.
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
        'passport_countries',
        'comment_likes',
        'web_push_subscriptions',
        'feedback_reports',
        'profile_music',
        'user_devices',
        'spotify_connections',
        'story_saves',
        'profiles',
        'events',
        'account_security',
        'user_blocks',
        'user_mutes',
        'user_reports',
        'message_reactions',
        'message_groups',
        'message_group_members',
        'group_messages',
        'group_message_reactions',
        'message_hidden_users',
        'post_hashtags',
        'discovery_signals',
        'notification_preferences',
        'profile_identity_settings',
        'profile_interests',
        'profile_pinned_posts',
        'communities',
        'community_members',
        'community_invites',
        'community_posts',
        'event_rsvps',
        'event_reminder_deliveries',
        'event_invites',
        'passport_media',
        'friend_recommendations',
        'passport_country_likes',
        'profile_travel_status',
        'passport_country_comments',
        'passport_destination_saves'
      )
  loop
    q := r.qual;
    c := r.with_check;

    if q is not null then
      q := replace(
        q,
        '(select auth.uid())',
        '__ALUMNI_AUTH_UID__'
      );
      q := replace(
        q,
        'auth.uid()',
        '(select auth.uid())'
      );
      q := replace(
        q,
        '__ALUMNI_AUTH_UID__',
        '(select auth.uid())'
      );
    end if;

    if c is not null then
      c := replace(
        c,
        '(select auth.uid())',
        '__ALUMNI_AUTH_UID__'
      );
      c := replace(
        c,
        'auth.uid()',
        '(select auth.uid())'
      );
      c := replace(
        c,
        '__ALUMNI_AUTH_UID__',
        '(select auth.uid())'
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

analyze public.profiles;
analyze public.communities;
analyze public.community_members;
analyze public.community_posts;
analyze public.events;
analyze public.event_rsvps;
analyze public.message_reactions;
analyze public.group_message_reactions;
analyze public.passport_countries;
analyze public.passport_country_comments;
analyze public.passport_country_likes;
analyze public.profile_pinned_posts;
analyze public.profile_travel_status;
analyze public.notification_preferences;
