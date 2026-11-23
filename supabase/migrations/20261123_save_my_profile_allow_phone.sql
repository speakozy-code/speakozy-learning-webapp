-- Lets a student save their own phone number (collected at sign-up) in their profile.
-- Run once in the Supabase SQL editor.
CREATE OR REPLACE FUNCTION public.save_my_profile(p_updates jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare key text; doc jsonb; users jsonb;
begin
  select student_id into key from public.user_roles where user_id=auth.uid() and active;
  if key is null then raise exception 'not authorized'; end if;
  if jsonb_typeof(p_updates) is distinct from 'object' then raise exception 'invalid profile updates'; end if;
  if exists (select 1 from jsonb_object_keys(p_updates) as k(value) where k.value not in ('avatar','name','phone')) then
    raise exception 'unsupported profile fields';
  end if;
  if p_updates ? 'avatar' and length(p_updates->>'avatar') > 16 then raise exception 'avatar too long'; end if;
  if p_updates ? 'name' and length(btrim(p_updates->>'name')) < 2 then raise exception 'name too short'; end if;
  if p_updates ? 'phone' and (length(p_updates->>'phone') > 24 or (p_updates->>'phone') !~ '^[0-9+ ()-]*$') then raise exception 'invalid phone'; end if;
  select data into doc from public.academy_state where id='academy/main' for update;
  if doc is null then raise exception 'academy data is not initialized'; end if;
  select coalesce(jsonb_agg(case when u.value->>'id'=key then u.value || p_updates else u.value end),'[]'::jsonb)
    into users from jsonb_array_elements(coalesce(doc->'users','[]'::jsonb)) as u(value);
  update public.academy_state set data=jsonb_set(doc,'{users}',users), updated_at=now() where id='academy/main';
end; $function$;
