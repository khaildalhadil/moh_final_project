-- =====================================================================
--  Agricultural Farm Management System — Supabase schema
--  نظام إدارة المزارع الزراعية — مخطط قاعدة البيانات
--
--  Run this whole file once in: Supabase Dashboard → SQL Editor → New query
--  It is idempotent: safe to run again after changes.
-- =====================================================================

-- gen_random_uuid() is built into PostgreSQL 13+ (Supabase runs 15+), no extension needed.

-- ---------------------------------------------------------------------
-- Helper: keep updated_at fresh
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1) Profiles (one row per auth user)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  currency    text not null default 'SAR',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Create a profile automatically when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2) Farms
-- ---------------------------------------------------------------------
create table if not exists public.farms (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 120),
  location    text,
  area        numeric(12, 2) check (area >= 0),          -- hectares
  latitude    numeric(9, 6) check (latitude between -90 and 90),
  longitude   numeric(9, 6) check (longitude between -180 and 180),
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3) Fields / plots inside a farm
-- ---------------------------------------------------------------------
create table if not exists public.fields (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  farm_id         uuid not null references public.farms (id) on delete cascade,
  name            text not null,
  area            numeric(12, 2) check (area >= 0),      -- hectares
  soil_type       text check (soil_type in ('clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky')),
  irrigation_type text check (irrigation_type in ('drip', 'sprinkler', 'flood', 'pivot', 'manual')),
  status          text not null default 'active' check (status in ('active', 'fallow', 'preparing')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4) Crops planted in a field
-- ---------------------------------------------------------------------
create table if not exists public.crops (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null default auth.uid() references auth.users (id) on delete cascade,
  field_id               uuid not null references public.fields (id) on delete cascade,
  name                   text not null,
  variety                text,
  planting_date          date,
  expected_harvest_date  date,
  actual_harvest_date    date,
  status                 text not null default 'planted'
                           check (status in ('planned', 'planted', 'growing', 'harvested', 'failed')),
  expected_yield         numeric(14, 2) check (expected_yield >= 0),
  actual_yield           numeric(14, 2) check (actual_yield >= 0),
  yield_unit             text not null default 'kg' check (yield_unit in ('kg', 'ton')),
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint crops_harvest_after_planting
    check (expected_harvest_date is null or planting_date is null or expected_harvest_date >= planting_date)
);

-- ---------------------------------------------------------------------
-- 5) Irrigation schedules
-- ---------------------------------------------------------------------
create table if not exists public.irrigation_schedules (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  field_id          uuid not null references public.fields (id) on delete cascade,
  scheduled_date    date not null,
  start_time        time,
  duration_minutes  integer check (duration_minutes >= 0),
  water_amount      numeric(12, 2) check (water_amount >= 0),   -- cubic meters (m³)
  method            text not null default 'drip'
                      check (method in ('drip', 'sprinkler', 'flood', 'pivot', 'manual')),
  status            text not null default 'scheduled'
                      check (status in ('scheduled', 'completed', 'skipped', 'cancelled')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6) Farm activities / tasks
-- ---------------------------------------------------------------------
create table if not exists public.activities (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  farm_id         uuid not null references public.farms (id) on delete cascade,
  field_id        uuid references public.fields (id) on delete set null,
  title           text not null,
  type            text not null default 'other'
                    check (type in ('planting', 'fertilizing', 'spraying', 'harvesting', 'plowing', 'weeding', 'pruning', 'maintenance', 'other')),
  scheduled_date  date not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  priority        text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  cost            numeric(14, 2) not null default 0 check (cost >= 0),
  assigned_to     text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7) Inventory (seeds, fertilizers, pesticides, fuel, equipment…)
-- ---------------------------------------------------------------------
create table if not exists public.inventory_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null,
  category      text not null default 'other'
                  check (category in ('seeds', 'fertilizer', 'pesticide', 'equipment', 'fuel', 'other')),
  quantity      numeric(14, 2) not null default 0 check (quantity >= 0),
  unit          text not null default 'unit' check (unit in ('kg', 'ton', 'liter', 'bag', 'unit')),
  min_quantity  numeric(14, 2) check (min_quantity >= 0),
  unit_cost     numeric(14, 2) check (unit_cost >= 0),
  supplier      text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index if not exists farms_user_idx            on public.farms (user_id);
create index if not exists fields_user_idx           on public.fields (user_id);
create index if not exists fields_farm_idx           on public.fields (farm_id);
create index if not exists crops_user_idx            on public.crops (user_id);
create index if not exists crops_field_idx           on public.crops (field_id);
create index if not exists irrigation_user_date_idx  on public.irrigation_schedules (user_id, scheduled_date);
create index if not exists irrigation_field_idx      on public.irrigation_schedules (field_id);
create index if not exists activities_user_date_idx  on public.activities (user_id, scheduled_date);
create index if not exists activities_farm_idx       on public.activities (farm_id);
create index if not exists activities_field_idx      on public.activities (field_id);
create index if not exists inventory_user_idx        on public.inventory_items (user_id);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['profiles', 'farms', 'fields', 'crops', 'irrigation_schedules', 'activities', 'inventory_items']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security: every user sees and edits only their own rows
-- ---------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.farms                enable row level security;
alter table public.fields               enable row level security;
alter table public.crops                enable row level security;
alter table public.irrigation_schedules enable row level security;
alter table public.activities           enable row level security;
alter table public.inventory_items      enable row level security;

drop policy if exists "Profiles: read own"   on public.profiles;
drop policy if exists "Profiles: update own" on public.profiles;
drop policy if exists "Profiles: insert own" on public.profiles;
create policy "Profiles: read own"   on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Profiles: update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Profiles: insert own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);

do $$
declare t text;
begin
  foreach t in array array['farms', 'fields', 'crops', 'irrigation_schedules', 'activities', 'inventory_items']
  loop
    execute format('drop policy if exists "Owner can select" on public.%I', t);
    execute format('drop policy if exists "Owner can insert" on public.%I', t);
    execute format('drop policy if exists "Owner can update" on public.%I', t);
    execute format('drop policy if exists "Owner can delete" on public.%I', t);

    execute format('create policy "Owner can select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Integrity: a child row may only point at a parent owned by the same user
-- (prevents linking your record to someone else's farm/field by guessing ids)
-- ---------------------------------------------------------------------
create or replace function public.assert_same_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'fields' then
    if not exists (select 1 from public.farms f where f.id = new.farm_id and f.user_id = new.user_id) then
      raise exception 'farm does not belong to user';
    end if;
  elsif tg_table_name in ('crops', 'irrigation_schedules') then
    if not exists (select 1 from public.fields f where f.id = new.field_id and f.user_id = new.user_id) then
      raise exception 'field does not belong to user';
    end if;
  elsif tg_table_name = 'activities' then
    if not exists (select 1 from public.farms f where f.id = new.farm_id and f.user_id = new.user_id) then
      raise exception 'farm does not belong to user';
    end if;
    if new.field_id is not null and not exists (
      select 1 from public.fields f where f.id = new.field_id and f.user_id = new.user_id and f.farm_id = new.farm_id
    ) then
      raise exception 'field does not belong to this farm';
    end if;
  end if;
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['fields', 'crops', 'irrigation_schedules', 'activities']
  loop
    execute format('drop trigger if exists assert_same_owner on public.%I', t);
    execute format('create trigger assert_same_owner before insert or update on public.%I for each row execute function public.assert_same_owner()', t);
  end loop;
end;
$$;

-- Backfill profiles for users that existed before this script ran
insert into public.profiles (id, full_name)
select u.id, u.raw_user_meta_data ->> 'full_name'
from auth.users u
on conflict (id) do nothing;
