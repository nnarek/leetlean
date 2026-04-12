-- ============================================
-- LeetLean Database Schema
-- Idempotent: safe to run multiple times
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Stores user profile info from Google Auth
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- PROBLEMS TABLE
-- Stores competitive programming problems
-- ============================================
create table if not exists public.problems (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  title text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  description text not null,           -- markdown content
  starter_code text not null default '',-- Lean 4 starter code
  tags text[] default '{}',
  sort_order int default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================
-- SUBMISSIONS TABLE
-- Stores user submissions / attempts
-- ============================================
create table if not exists public.submissions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  problem_id uuid references public.problems(id) on delete cascade not null,
  code text not null,
  status text not null check (status in ('pending', 'accepted', 'wrong')),
  submitted_at timestamptz default now() not null
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Profiles: users can read all, update own
alter table public.profiles enable row level security;

do $$ begin
  create policy "Profiles are viewable by everyone"
    on public.profiles for select
    using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);
exception when duplicate_object then null;
end $$;

-- Problems: everyone can read
alter table public.problems enable row level security;

do $$ begin
  create policy "Problems are viewable by everyone"
    on public.problems for select
    using (true);
exception when duplicate_object then null;
end $$;

-- Submissions: users can read own, insert own
alter table public.submissions enable row level security;

do $$ begin
  create policy "Users can view own submissions"
    on public.submissions for select
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can insert own submissions"
    on public.submissions for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_problems_slug on public.problems(slug);
create index if not exists idx_problems_difficulty on public.problems(difficulty);
create index if not exists idx_submissions_user_id on public.submissions(user_id);
create index if not exists idx_submissions_problem_id on public.submissions(problem_id);
create index if not exists idx_submissions_user_problem on public.submissions(user_id, problem_id);
