-- Listening clips (Voscreen-style): students receive the shared listenClips collection.
-- Run once in the Supabase SQL editor.
do $$
declare d text;
begin
  d := pg_get_functiondef('public.load_session_state(text)'::regprocedure);
  d := replace(d,
    $old$'testimonials', coalesce(doc->'testimonials', '[]'::jsonb),$old$,
    $new$'testimonials', coalesce(doc->'testimonials', '[]'::jsonb), 'listenClips', coalesce(doc->'listenClips', '[]'::jsonb),$new$);
  if d !~ 'listenClips' then raise exception 'patch did not apply: load_session_state changed'; end if;
  execute d;
end $$;
