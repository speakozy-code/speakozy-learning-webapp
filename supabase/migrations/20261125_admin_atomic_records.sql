-- Atomic per-record writes for admins (fixes lost updates: subscription / level
-- edits being overwritten by a stale whole-document save).
-- Run once in the Supabase SQL Editor.

create or replace function public.admin_upsert_record(p_key text, p_record jsonb)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare cur jsonb;
begin
  if p_key !~ '^[A-Za-z]+$' or jsonb_typeof(p_record) is distinct from 'object' or (p_record->>'id') is null then
    raise exception 'invalid record';
  end if;
  if not exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin' and active) then
    raise exception 'not authorized';
  end if;
  -- row lock: concurrent writers queue here instead of overwriting each other
  select coalesce(data->p_key, '[]'::jsonb) into cur from public.academy_state where id = 'academy/main' for update;
  if not found then raise exception 'academy data is not initialized'; end if;
  if exists (select 1 from jsonb_array_elements(cur) e where e->>'id' = p_record->>'id') then
    select coalesce(jsonb_agg(case when e->>'id' = p_record->>'id' then p_record else e end order by o), '[]'::jsonb)
      into cur from jsonb_array_elements(cur) with ordinality t(e, o);
  else
    cur := cur || jsonb_build_array(p_record);
  end if;
  update public.academy_state
     set data = jsonb_set(data, array[p_key], cur, true), updated_at = now()
   where id = 'academy/main';
end;
$$;

create or replace function public.admin_delete_record(p_key text, p_id text)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare cur jsonb;
begin
  if p_key !~ '^[A-Za-z]+$' then raise exception 'invalid key'; end if;
  if not exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin' and active) then
    raise exception 'not authorized';
  end if;
  select coalesce(data->p_key, '[]'::jsonb) into cur from public.academy_state where id = 'academy/main' for update;
  if not found then raise exception 'academy data is not initialized'; end if;
  select coalesce(jsonb_agg(e order by o), '[]'::jsonb) into cur
    from jsonb_array_elements(cur) with ordinality t(e, o) where e->>'id' is distinct from p_id;
  update public.academy_state
     set data = jsonb_set(data, array[p_key], cur, true), updated_at = now()
   where id = 'academy/main';
end;
$$;

revoke all on function public.admin_upsert_record(text, jsonb) from public, anon;
revoke all on function public.admin_delete_record(text, text) from public, anon;
grant execute on function public.admin_upsert_record(text, jsonb) to authenticated;
grant execute on function public.admin_delete_record(text, text) to authenticated;
