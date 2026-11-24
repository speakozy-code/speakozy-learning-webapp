-- Web Push: stores each student's device subscriptions. Only the server (service role) reads it.
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;  -- no policies: no direct client access

create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path to 'pg_catalog','public' as $$
begin
  if auth.uid() is null then raise exception 'not authorized'; end if;
  if not exists (select 1 from public.user_roles where user_id = auth.uid() and active) then raise exception 'not authorized'; end if;
  if length(p_endpoint) > 1000 or p_endpoint !~ '^https://' then raise exception 'invalid subscription'; end if;
  insert into public.push_subscriptions(endpoint, user_id, p256dh, auth) values (p_endpoint, auth.uid(), p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = auth.uid(), p256dh = excluded.p256dh, auth = excluded.auth;
end $$;

create or replace function public.delete_push_subscription(p_endpoint text)
returns void language plpgsql security definer set search_path to 'pg_catalog','public' as $$
begin
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid();
end $$;

revoke all on function public.save_push_subscription(text,text,text) from public, anon;
revoke all on function public.delete_push_subscription(text) from public, anon;
grant execute on function public.save_push_subscription(text,text,text) to authenticated;
grant execute on function public.delete_push_subscription(text) to authenticated;
