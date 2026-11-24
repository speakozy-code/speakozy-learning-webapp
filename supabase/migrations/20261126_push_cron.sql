-- Daily push at 19:00 Cairo (17:00 UTC). Replace CHANGE_ME with the same value you set as the CRON_SECRET function secret.
create extension if not exists pg_net;
create extension if not exists pg_cron;
select cron.unschedule('speakozy-daily-push') where exists (select 1 from cron.job where jobname = 'speakozy-daily-push');
select cron.schedule('speakozy-daily-push', '0 17 * * *', $$
  select net.http_post(
    url := 'https://jhcaqlhzfavpjqukaamu.supabase.co/functions/v1/daily-push',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','CHANGE_ME'),
    body := '{}'::jsonb)
$$);
