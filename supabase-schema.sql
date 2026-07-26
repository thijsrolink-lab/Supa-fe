-- Voer dit één keer uit in de Supabase SQL editor (Project → SQL Editor → New query).

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  father_name text,
  mother_name text,
  created_at timestamptz default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade not null,
  name text not null,
  birth_date date,
  created_at timestamptz default now()
);

create table if not exists public.growth_entries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade not null,
  week int not null,
  weight numeric,
  length numeric,
  created_at timestamptz default now(),
  unique (child_id, week)
);

-- Broers/zussen: alleen een naam, geen eigen groeiboekje/tracker. Worden alleen
-- gebruikt om de "omgang met broer/zus"-tips te personaliseren.
create table if not exists public.siblings (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

-- Foto's: bestand staat in Storage (bucket "baby-photos"), deze tabel koppelt
-- het bestandspad aan een kind + (optioneel) een week, voor het jaarverslag.
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade not null,
  week int,
  storage_path text not null,
  caption text,
  created_at timestamptz default now()
);

-- Storage-bucket voor foto's (privé — alleen toegankelijk via signed URLs voor
-- de eigenaar, zie de policies hieronder).
insert into storage.buckets (id, name, public)
values ('baby-photos', 'baby-photos', false)
on conflict (id) do nothing;

alter table public.families enable row level security;
alter table public.children enable row level security;
alter table public.growth_entries enable row level security;
alter table public.siblings enable row level security;
alter table public.photos enable row level security;

-- Iedereen kan alleen het eigen gezin zien/bewerken.
create policy "own family" on public.families
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own children" on public.children
  for all using (family_id in (select id from public.families where user_id = auth.uid()))
  with check (family_id in (select id from public.families where user_id = auth.uid()));

create policy "own siblings" on public.siblings
  for all using (family_id in (select id from public.families where user_id = auth.uid()))
  with check (family_id in (select id from public.families where user_id = auth.uid()));

create policy "own photos" on public.photos
  for all using (
    child_id in (
      select c.id from public.children c
      join public.families f on c.family_id = f.id
      where f.user_id = auth.uid()
    )
  )
  with check (
    child_id in (
      select c.id from public.children c
      join public.families f on c.family_id = f.id
      where f.user_id = auth.uid()
    )
  );

-- Storage: elke gebruiker mag alleen bestanden lezen/uploaden/verwijderen onder
-- zijn eigen map (het pad begint met de eigen user_id, wordt in de app zo opgebouwd).
create policy "own photo files select" on storage.objects
  for select using (bucket_id = 'baby-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own photo files insert" on storage.objects
  for insert with check (bucket_id = 'baby-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own photo files delete" on storage.objects
  for delete using (bucket_id = 'baby-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own growth entries" on public.growth_entries
  for all using (
    child_id in (
      select c.id from public.children c
      join public.families f on c.family_id = f.id
      where f.user_id = auth.uid()
    )
  )
  with check (
    child_id in (
      select c.id from public.children c
      join public.families f on c.family_id = f.id
      where f.user_id = auth.uid()
    )
  );
