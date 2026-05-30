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
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

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

-- 6. PIN LOOKUP FUNCTION
-- Lets the login screen resolve a PIN -> email without exposing the users table.
-- SECURITY DEFINER bypasses RLS; runs with the function owner's rights.
create or replace function public.get_user_by_pin(pin text)
returns table (email text)
language sql
security definer
set search_path = public
as $$
  select email from public.users where pin_code = pin limit 1;
$$;

grant execute on function public.get_user_by_pin(text) to anon, authenticated;

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
