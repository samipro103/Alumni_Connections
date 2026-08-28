-- ============================================================
-- ALUMNI CONNECTIONS
-- PUSH ACTIVIDAD SOCIAL 6.0
--
-- Hace que TODA fila nueva de public.notifications llame
-- directamente a la Edge Function "push".
--
-- Cubre:
--   - me gusta en publicación
--   - comentario en publicación
--   - me gusta en comentario
--   - me gusta en historia
--   - respuesta a historia
--   - follows y otros tipos que ya creen una fila en notifications
--
-- Los mensajes privados siguen usando trg_alumni_push_message.
-- ============================================================

create extension if not exists pg_net
with schema extensions;

create or replace function
public.alumni_push_notification_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url :=
      'https://qmsvoytjdivfhqgmvcge.supabase.co/functions/v1/push',
    headers := jsonb_build_object(
      'Content-Type',
      'application/json'
    ),
    body := jsonb_build_object(
      'type',
      'INSERT',
      'table',
      'notifications',
      'schema',
      'public',
      'record',
      to_jsonb(new),
      'old_record',
      null
    ),
    timeout_milliseconds := 10000
  );

  return new;
end;
$$;

drop trigger if exists
trg_alumni_push_notification
on public.notifications;

create trigger
trg_alumni_push_notification
after insert on public.notifications
for each row
execute function
public.alumni_push_notification_after_insert();

-- Confirmación de los dos disparadores de Push que queremos:
-- messages      -> push directo de mensajes
-- notifications -> push de actividad social
select
  tgname as trigger_name,
  tgrelid::regclass as tabla,
  case
    when tgenabled = 'O'
      then 'ACTIVO'
    else tgenabled::text
  end as estado
from pg_trigger
where tgname in (
  'trg_alumni_push_message',
  'trg_alumni_push_notification'
)
order by tgname;
