-- ============================================================
-- Digital Lineage — Initial Schema
-- Paste this into Supabase SQL Editor and run it.
-- ============================================================

-- Enums
create type permission_type as enum ('view', 'edit');
create type request_status  as enum ('pending', 'accepted', 'rejected');
create type user_role       as enum ('user', 'admin');

-- ============================================================
-- 1. profiles  (extends auth.users)
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  updated_at  timestamptz,
  full_name   text,
  role        user_role default 'user'
);

-- Auto-create profile row when a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- 2. people
-- ============================================================
create table people (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  first_name   text not null,
  last_name    text,
  maiden_name  text,
  birth_year   text,
  death_year   text,
  birth_place  text,
  death_place  text,
  is_alive     boolean default true,
  is_patriarch boolean default false,
  avatar_url   text,
  biography    text,
  quote        text,
  father_id    uuid references people(id) on delete set null,
  mother_id    uuid references people(id) on delete set null,
  spouse_id    uuid references people(id) on delete set null,
  gender       text check (gender in ('male','female','other')) default 'other',
  created_at   timestamptz default now()
);

-- ============================================================
-- 3. timeline_events
-- ============================================================
create table timeline_events (
  id             uuid primary key default gen_random_uuid(),
  person_id      uuid not null references people(id) on delete cascade,
  year           text not null,
  month_and_year text,
  title          text not null,
  description    text,
  type           text check (type in ('birth','marriage','child','death','other')) default 'other',
  created_at     timestamptz default now()
);

-- ============================================================
-- 4. archive_records
-- ============================================================
create table archive_records (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  title         text not null,
  type          text not null,
  description   text,
  image_url     text,
  date_str      text,
  year          integer,
  location      text,
  tags          text[] default '{}',
  transcription text,
  is_restricted boolean default false,
  created_at    timestamptz default now()
);

-- Many-to-many: records <-> people
create table record_person_links (
  record_id uuid not null references archive_records(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  primary key (record_id, person_id)
);

-- ============================================================
-- 5. shared_memories
-- ============================================================
create table shared_memories (
  id              uuid primary key default gen_random_uuid(),
  person_id       uuid not null references people(id) on delete cascade,
  author_user_id  uuid references profiles(id) on delete set null,
  author_name     text not null,
  author_initials text,
  text            text not null,
  created_at      timestamptz default now()
);

-- ============================================================
-- 6. tree_permissions  (sharing between users)
-- ============================================================
create table tree_permissions (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references profiles(id) on delete cascade,
  shared_with_id uuid not null references profiles(id) on delete cascade,
  permission     permission_type default 'view',
  created_at     timestamptz default now(),
  unique (owner_id, shared_with_id)
);

-- ============================================================
-- 7. person_links  (AI-matching + manual merge requests)
-- ============================================================
create table person_links (
  id               uuid primary key default gen_random_uuid(),
  person_a_id      uuid not null references people(id) on delete cascade,
  person_b_id      uuid not null references people(id) on delete cascade,
  status           request_status default 'pending',
  requested_by     uuid references profiles(id),
  is_ai_suggested  boolean default false,
  created_at       timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles          enable row level security;
alter table people            enable row level security;
alter table timeline_events   enable row level security;
alter table archive_records   enable row level security;
alter table record_person_links enable row level security;
alter table shared_memories   enable row level security;
alter table tree_permissions  enable row level security;
alter table person_links      enable row level security;

-- Helper: check admin
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Helper: check shared access
create or replace function has_tree_permission(owner uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from tree_permissions
    where owner_id = owner and shared_with_id = auth.uid()
  );
$$;

-- --- profiles ---
create policy "view own profile"   on profiles for select using (id = auth.uid() or is_admin());
create policy "update own profile" on profiles for update using (id = auth.uid());
create policy "insert own profile" on profiles for insert with check (id = auth.uid());

-- --- people ---
create policy "select people" on people for select using (
  user_id = auth.uid() or has_tree_permission(user_id) or is_admin()
);
create policy "insert people" on people for insert with check (user_id = auth.uid());
create policy "update people" on people for update using (
  user_id = auth.uid() or is_admin()
);
create policy "delete people" on people for delete using (
  user_id = auth.uid() or is_admin()
);

-- --- timeline_events ---
create policy "select timeline" on timeline_events for select using (
  exists (
    select 1 from people p where p.id = person_id
    and (p.user_id = auth.uid() or has_tree_permission(p.user_id) or is_admin())
  )
);
create policy "manage timeline" on timeline_events for all using (
  exists (
    select 1 from people p where p.id = person_id
    and (p.user_id = auth.uid() or is_admin())
  )
);

-- --- archive_records ---
create policy "select records" on archive_records for select using (user_id = auth.uid() or is_admin());
create policy "insert records" on archive_records for insert with check (user_id = auth.uid());
create policy "update records" on archive_records for update using (user_id = auth.uid() or is_admin());
create policy "delete records" on archive_records for delete using (user_id = auth.uid() or is_admin());

-- --- record_person_links ---
create policy "select record links" on record_person_links for select using (
  exists (select 1 from archive_records r where r.id = record_id and r.user_id = auth.uid())
  or is_admin()
);
create policy "manage record links" on record_person_links for all using (
  exists (select 1 from archive_records r where r.id = record_id and r.user_id = auth.uid())
  or is_admin()
);

-- --- shared_memories ---
create policy "select memories" on shared_memories for select using (
  exists (
    select 1 from people p where p.id = person_id
    and (p.user_id = auth.uid() or has_tree_permission(p.user_id) or is_admin())
  )
);
create policy "insert memories" on shared_memories for insert with check (auth.uid() is not null);
create policy "delete memories"  on shared_memories for delete using (
  author_user_id = auth.uid() or is_admin()
);

-- --- tree_permissions ---
create policy "owner manages permissions" on tree_permissions for all using (
  owner_id = auth.uid() or is_admin()
);
create policy "shared user views permissions" on tree_permissions for select using (
  shared_with_id = auth.uid()
);

-- --- person_links ---
create policy "view person links" on person_links for select using (
  exists (select 1 from people p where p.id = person_a_id and p.user_id = auth.uid())
  or exists (select 1 from people p where p.id = person_b_id and p.user_id = auth.uid())
  or is_admin()
);
create policy "create person links" on person_links for insert with check (
  exists (select 1 from people p where p.id = person_a_id and p.user_id = auth.uid())
);
create policy "update person links" on person_links for update using (
  exists (select 1 from people p where p.id = person_a_id and p.user_id = auth.uid())
  or exists (select 1 from people p where p.id = person_b_id and p.user_id = auth.uid())
  or is_admin()
);
