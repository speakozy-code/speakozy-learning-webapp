-- Automatic subscription expiry.
-- Run once in the Supabase SQL editor. The admin sets "subscriptionEnd" (YYYY-MM-DD, the last day) on a student;
-- from the next day load_session_state returns subscribed=false for that student (Egypt time), so the app locks the
-- paid content by itself — no cron job needed. The student also receives their own subscriptionEnd.
do $$
declare d text;
begin
  d := pg_get_functiondef('public.load_session_state(text)'::regprocedure);
  d := replace(d,
    $old$'subscribed', u.value->'subscribed',$old$,
    $new$'subscribed', case when u.value->>'subscriptionEnd' ~ '^\d{4}-\d{2}-\d{2}$'
                             and (u.value->>'subscriptionEnd')::date < (now() at time zone 'Africa/Cairo')::date
                        then to_jsonb(false) else u.value->'subscribed' end,
        'subscriptionEnd', case when u.value->>'id' = student_key then u.value->'subscriptionEnd' else null end,$new$);
  if d !~ 'subscriptionEnd' then raise exception 'patch did not apply: load_session_state changed'; end if;
  execute d;
end $$;
