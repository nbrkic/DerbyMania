-- Lets the login form resolve a username to its account email so the user
-- can sign in with either username+password or email+password.
-- Run this in the Supabase SQL editor (or via `supabase db push` if you use the CLI).

create or replace function public.email_for_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(p_username)
  limit 1;
$$;

-- Anon needs this to resolve the email before a session exists. It only ever
-- returns a single email for an exact username match (same exposure as the
-- existing is_username_available check), never a list or partial matches.
grant execute on function public.email_for_username(text) to anon, authenticated;
