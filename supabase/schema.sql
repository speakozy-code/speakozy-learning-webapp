-- Speakozy Supabase backend (run once in the Supabase SQL editor)
-- The app keeps one JSON document per academy; all writes go through an
-- admin-only SECURITY DEFINER function. Student keys never enter the browser.

create table if not exists public.academy_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'student')),
  student_id text,
  created_at timestamptz not null default now()
);

insert into public.academy_state (id, data)
values ('academy/main', '{}'::jsonb)
on conflict (id) do nothing;

alter table public.academy_state enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "academy read" on public.academy_state;
create policy "academy read" on public.academy_state
  for select to authenticated using (true);

drop policy if exists "roles own read" on public.user_roles;
create policy "roles own read" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create or replace function public.load_academy_state(p_doc_id text)
returns jsonb
language sql stable security definer set search_path = public
as $$ select data from public.academy_state where id = p_doc_id $$;

create or replace function public.save_academy_state(p_doc_id text, p_data jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;
  insert into public.academy_state (id, data, updated_at)
  values (p_doc_id, p_data, now())
  on conflict (id) do update set data = excluded.data, updated_at = now();
end;
$$;

create or replace function public.init_academy_state(p_doc_id text, p_data jsonb)
returns void language plpgsql security definer set search_path = public
as $$
begin
  insert into public.academy_state (id, data, updated_at)
  values (p_doc_id, p_data, now())
  on conflict (id) do nothing;
end;
$$;

revoke all on function public.load_academy_state(text) from public;
revoke all on function public.save_academy_state(text, jsonb) from public;
grant execute on function public.load_academy_state(text) to authenticated;
grant execute on function public.save_academy_state(text, jsonb) to authenticated;
grant execute on function public.init_academy_state(text, jsonb) to authenticated;

-- After creating an admin in Supabase Auth, grant the role:
-- insert into public.user_roles (user_id, role) values ('<auth-user-uuid>', 'admin');
