-- Adds a unique, Instagram-style username to profiles.
-- Run this in the Supabase SQL editor (or via `supabase db push` if you use the CLI).

alter table public.profiles
  add column if not exists username text;

-- Format: only English letters and digits, at least 3 characters. NULL is allowed
-- so existing accounts created before this migration are not broken.
alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[A-Za-z0-9]{3,}$');

-- Case-insensitive uniqueness (marko and Marko are the same username).
create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username));

-- Lets the registration form check availability before the account (and its
-- session) exists, without exposing the rest of the profiles table to anon.
create or replace function public.is_username_available(p_username text, p_exclude_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles
    where lower(username) = lower(p_username)
      and (p_exclude_id is null or id <> p_exclude_id)
  );
$$;

grant execute on function public.is_username_available(text, uuid) to anon, authenticated;
