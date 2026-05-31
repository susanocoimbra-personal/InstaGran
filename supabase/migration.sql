-- ============================================
-- VOVO - Family Photo Sharing (Next.js webapp)
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor).
-- Safe to run on a fresh project.
-- ============================================

-- 1. USERS TABLE
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  role text not null check (role in ('parent', 'grandmother', 'grandfather')),
  avatar_emoji text not null default '👤',
  pin_code text not null,
  expo_push_token text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can view all family members"
  on public.users for select
  using (auth.uid() is not null);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. ALBUMS TABLE
create table if not exists public.albums (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  emoji text not null default '📸',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.albums enable row level security;

create policy "All family members can view albums"
  on public.albums for select
  using (auth.uid() is not null);

create policy "Parents can create albums"
  on public.albums for insert
  with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'parent')
  );

create policy "Parents can delete albums"
  on public.albums for delete
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'parent')
  );

-- 3. PHOTOS TABLE
create table if not exists public.photos (
  id uuid default gen_random_uuid() primary key,
  uploaded_by uuid references public.users(id) on delete cascade not null,
  image_url text not null,
  thumbnail_url text,
  caption text,
  album_id uuid references public.albums(id) on delete set null,
  -- Photos uploaded together in one batch share a group_id, so the feed can
  -- render them as a single carousel post (Instagram-style). A single photo
  -- has group_id = null and shows on its own.
  group_id uuid,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

-- Group lookups for the carousel.
create index if not exists idx_photos_group on public.photos (group_id);

alter table public.photos enable row level security;

create policy "All family members can view photos"
  on public.photos for select
  using (auth.uid() is not null);

create policy "Parents can upload photos"
  on public.photos for insert
  with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'parent')
  );

-- Parents can move photos between albums (album_id update) and delete them.
create policy "Parents can update photos"
  on public.photos for update
  using (exists (select 1 from public.users where id = auth.uid() and role = 'parent'))
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'parent'));

create policy "Parents can delete photos"
  on public.photos for delete
  using (exists (select 1 from public.users where id = auth.uid() and role = 'parent'));

-- 4. COMMENTS TABLE
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  photo_id uuid references public.photos(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "All family members can view comments"
  on public.comments for select
  using (auth.uid() is not null);

create policy "All family members can add comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Defence in depth: even though RLS checks auth.uid() = user_id on insert,
-- force the stored user_id to equal the JWT identity so a tampered client
-- can never record a comment under someone else's name.
create or replace function public.enforce_comment_user_id()
returns trigger
language plpgsql
as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists comment_user_id_guard on public.comments;
create trigger comment_user_id_guard
  before insert on public.comments
  for each row execute function public.enforce_comment_user_id();

-- Parents can delete any comment (used when removing a photo).
create policy "Parents can delete any comment"
  on public.comments for delete
  using (exists (select 1 from public.users where id = auth.uid() and role = 'parent'));

-- 5. REACTIONS TABLE
create table if not exists public.reactions (
  id uuid default gen_random_uuid() primary key,
  photo_id uuid references public.photos(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (photo_id, user_id, emoji)
);

alter table public.reactions enable row level security;

create policy "All family members can view reactions"
  on public.reactions for select
  using (auth.uid() is not null);

create policy "All family members can add reactions"
  on public.reactions for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own reactions"
  on public.reactions for delete
  using (auth.uid() = user_id);

create policy "Parents can delete any reaction"
  on public.reactions for delete
  using (exists (select 1 from public.users where id = auth.uid() and role = 'parent'));

-- Same defence in depth as comments: pin the reaction's user_id to the JWT.
create or replace function public.enforce_reaction_user_id()
returns trigger
language plpgsql
as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists reaction_user_id_guard on public.reactions;
create trigger reaction_user_id_guard
  before insert on public.reactions
  for each row execute function public.enforce_reaction_user_id();

-- 6. PIN LOGIN: lookup + brute-force protection
-- The login screen resolves a 6-digit PIN -> email so the family never types
-- an email. A 6-digit PIN is only 1,000,000 combinations, so without throttling
-- an attacker with the public anon key could enumerate every PIN in seconds.
-- We keep the function signature identical (get_user_by_pin(pin) -> email) so
-- the app keeps working, but add a global rate limit + a small delay.

create table if not exists public.login_attempts (
  id uuid default gen_random_uuid() primary key,
  succeeded boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_login_attempts_time
  on public.login_attempts (attempted_at desc);

-- RLS on but no policies => only SECURITY DEFINER functions (below) can touch it.
alter table public.login_attempts enable row level security;

-- Tunables. The family of 5 rarely fails a PIN, so 15 failures / 10 min is
-- generous for them but cuts a brute-force attacker from ~unlimited to a
-- trickle. Block lasts 10 min. (Trade-off: an attacker hammering the endpoint
-- can lock out the login for everyone for 10 min — acceptable DoS surface for
-- a private 5-person app; the alternative, per-IP limits, needs the real client
-- IP which a browser RPC call can't reliably provide.)
create or replace function public.get_user_by_pin(pin text)
returns table (email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_failures int;
  found_email text;
begin
  -- Throttle: count failed attempts in the trailing window.
  select count(*) into recent_failures
  from public.login_attempts
  where succeeded = false
    and attempted_at > now() - interval '10 minutes';

  if recent_failures >= 15 then
    -- Locked out: behave exactly like a wrong PIN (return no rows).
    insert into public.login_attempts (succeeded) values (false);
    return;
  end if;

  -- Small constant delay slows scripted brute-force without annoying humans.
  perform pg_sleep(0.3);

  select u.email into found_email
  from public.users u
  where u.pin_code = pin
  limit 1;

  insert into public.login_attempts (succeeded) values (found_email is not null);

  if found_email is null then
    return;
  end if;

  email := found_email;
  return next;
end;
$$;

grant execute on function public.get_user_by_pin(text) to anon, authenticated;

-- Housekeeping: a parent can prune old attempt rows if desired.
-- delete from public.login_attempts where attempted_at < now() - interval '1 day';

-- 7. STORAGE BUCKET (public read)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "Anyone authenticated can view photos"
  on storage.objects for select
  using (bucket_id = 'photos' and auth.uid() is not null);

create policy "Parents can upload to photos bucket"
  on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and exists (select 1 from public.users where id = auth.uid() and role = 'parent')
  );

create policy "Parents can delete from photos bucket"
  on storage.objects for delete
  using (
    bucket_id = 'photos'
    and exists (select 1 from public.users where id = auth.uid() and role = 'parent')
  );

-- 8. ENABLE REALTIME
alter publication supabase_realtime add table public.photos;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.albums;
