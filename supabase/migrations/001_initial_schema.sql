-- profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  consent_research boolean default false,
  created_at timestamptz default now()
);

-- workspaces (one per strategic picture)
create table workspaces (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null default 'Hovedscenario',
  state jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- generation_log (rate limiting)
create table generation_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- Index for rate limit queries
create index generation_log_user_date on generation_log (user_id, created_at);

-- Row-Level Security: profiles
alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Row-Level Security: workspaces
alter table workspaces enable row level security;

create policy "Users CRUD own workspaces"
  on workspaces for all using (auth.uid() = user_id);

-- Row-Level Security: generation_log
alter table generation_log enable row level security;

create policy "Users read own generation log"
  on generation_log for select using (auth.uid() = user_id);

create policy "Users insert own generation log"
  on generation_log for insert with check (auth.uid() = user_id);

-- Auto-update updated_at on workspaces
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger workspaces_updated_at
  before update on workspaces
  for each row execute function update_updated_at();

-- Auto-create profile on signup (with consent from user_meta_data)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, consent_research)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    coalesce((new.raw_user_meta_data->>'consent_research')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
