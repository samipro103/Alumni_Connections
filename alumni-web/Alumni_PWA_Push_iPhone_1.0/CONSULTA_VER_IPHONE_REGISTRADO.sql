select
  user_id,
  platform,
  active,
  left(endpoint, 45) || '...' as endpoint_preview,
  last_seen_at
from public.web_push_subscriptions
order by last_seen_at desc;
