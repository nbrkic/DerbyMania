-- Lets player profile URLs use the username instead of the raw UUID
-- (e.g. /igraci/marko instead of /igraci/f1d388fd-...), without having to
-- know or touch the existing public_profiles view definition.
-- Run this in the Supabase SQL editor, same as the previous migration.

create or replace view public.player_usernames as
  select id, username
  from public.profiles
  where username is not null;

grant select on public.player_usernames to anon, authenticated;
