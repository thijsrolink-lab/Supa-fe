-- Voer dit één keer uit in de Supabase SQL editor (Project → SQL Editor → New query).
-- Dit is een volledige herziening t.o.v. eerdere versies: een gezin kan nu door
-- meerdere accounts gedeeld worden (bijv. beide ouders), via family_members +
-- een uitnodigingscode. Als je de tabellen al eerder had aangemaakt, kun je dit
-- script gewoon opnieuw draaien — de "create table if not exists" en
-- "drop policy if exists" zorgen dat het veilig herhaalbaar is.

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  father_name text,
  mother_name text,
  created_at timestamptz default now()
);

-- Koppeltabel: welke accounts horen bij welk gezin.
create table if not exists public.family_members (
  family_id uuid references public.families(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'member',
  parent_role text,
  created_at timestamptz default now(),
  primary key (family_id, user_id)
);

-- Weekbeoordeling: elke ouder beoordeelt onafhankelijk hoe de week ging.
create table if not exists public.week_ratings (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  week int not null,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (child_id, user_id, week)
);

-- Uitnodigingscodes: de ene ouder genereert een code, de andere voert 'm in om
-- lid te worden van hetzelfde gezin.
create table if not exists public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade not null,
  code text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade not null,
  name text not null,
  birth_date date,
  gender text,
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

create table if not exists public.siblings (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade not null,
  name text not null,
  birth_date date,
  gender text,
  created_at timestamptz default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade not null,
  week int,
  storage_path text not null,
  caption text,
  created_at timestamptz default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade not null,
  week int not null,
  text text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (child_id, week)
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade not null,
  milestone_key text not null,
  achieved_date date not null default current_date,
  created_at timestamptz default now(),
  unique (child_id, milestone_key)
);

insert into storage.buckets (id, name, public)
values ('baby-photos', 'baby-photos', false)
on conflict (id) do nothing;

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_invites enable row level security;
alter table public.children enable row level security;
alter table public.growth_entries enable row level security;
alter table public.siblings enable row level security;
alter table public.photos enable row level security;
alter table public.journal_entries enable row level security;
alter table public.milestones enable row level security;
alter table public.week_ratings enable row level security;

-- ---------- families: lezen/wijzigen mag elk lid van het gezin; aanmaken mag iedereen ----------
drop policy if exists own_family on public.families;
drop policy if exists members_view_family on public.families;
drop policy if exists members_update_family on public.families;
drop policy if exists authenticated_create_family on public.families;

create policy authenticated_create_family on public.families
  for insert with check (auth.uid() = user_id);

create policy members_view_family on public.families
  for select using (id in (select family_id from public.family_members where user_id = auth.uid()));

create policy members_update_family on public.families
  for update using (id in (select family_id from public.family_members where user_id = auth.uid()));

-- ---------- family_members: je ziet de leden van je eigen gezin(nen) ----------
drop policy if exists view_own_memberships on public.family_members;
drop policy if exists insert_own_membership on public.family_members;

create policy view_own_memberships on public.family_members
  for select using (
    user_id = auth.uid()
    or family_id in (select family_id from public.family_members where user_id = auth.uid())
  );

create policy insert_own_membership on public.family_members
  for insert with check (user_id = auth.uid());

-- ---------- family_invites: elke ingelogde gebruiker mag een code opzoeken/aanmaken ----------
-- (een code zelf is niet gevoelig — het is puur een sleuteltje om lid te worden)
drop policy if exists authenticated_read_invites on public.family_invites;
drop policy if exists members_create_invites on public.family_invites;

create policy authenticated_read_invites on public.family_invites
  for select using (auth.role() = 'authenticated');

create policy members_create_invites on public.family_invites
  for insert with check (family_id in (select family_id from public.family_members where user_id = auth.uid()));

-- ---------- children / siblings / growth / photos / journal / milestones: alle gezinsleden ----------
drop policy if exists own_children on public.children;
create policy family_members_children on public.children
  for all using (family_id in (select family_id from public.family_members where user_id = auth.uid()))
  with check (family_id in (select family_id from public.family_members where user_id = auth.uid()));

drop policy if exists own_siblings on public.siblings;
create policy family_members_siblings on public.siblings
  for all using (family_id in (select family_id from public.family_members where user_id = auth.uid()))
  with check (family_id in (select family_id from public.family_members where user_id = auth.uid()));

drop policy if exists own_growth_entries on public.growth_entries;
create policy family_members_growth_entries on public.growth_entries
  for all using (
    child_id in (
      select c.id from public.children c
      where c.family_id in (select family_id from public.family_members where user_id = auth.uid())
    )
  )
  with check (
    child_id in (
      select c.id from public.children c
      where c.family_id in (select family_id from public.family_members where user_id = auth.uid())
    )
  );

drop policy if exists own_photos on public.photos;
create policy family_members_photos on public.photos
  for all using (
    child_id in (
      select c.id from public.children c
      where c.family_id in (select family_id from public.family_members where user_id = auth.uid())
    )
  )
  with check (
    child_id in (
      select c.id from public.children c
      where c.family_id in (select family_id from public.family_members where user_id = auth.uid())
    )
  );

drop policy if exists own_journal_entries on public.journal_entries;
create policy family_members_journal_entries on public.journal_entries
  for all using (
    child_id in (
      select c.id from public.children c
      where c.family_id in (select family_id from public.family_members where user_id = auth.uid())
    )
  )
  with check (
    child_id in (
      select c.id from public.children c
      where c.family_id in (select family_id from public.family_members where user_id = auth.uid())
    )
  );

drop policy if exists own_milestones on public.milestones;
create policy family_members_milestones on public.milestones
  for all using (
    child_id in (
      select c.id from public.children c
      where c.family_id in (select family_id from public.family_members where user_id = auth.uid())
    )
  )
  with check (
    child_id in (
      select c.id from public.children c
      where c.family_id in (select family_id from public.family_members where user_id = auth.uid())
    )
  );

-- Iedereen in het gezin ziet elkaars weekbeoordelingen, maar mag alleen de eigen rij wijzigen.
drop policy if exists family_members_week_ratings on public.week_ratings;
create policy family_members_week_ratings on public.week_ratings
  for select using (
    child_id in (
      select c.id from public.children c
      where c.family_id in (select family_id from public.family_members where user_id = auth.uid())
    )
  );

drop policy if exists own_week_rating_write on public.week_ratings;
create policy own_week_rating_write on public.week_ratings
  for insert with check (user_id = auth.uid());

drop policy if exists own_week_rating_update on public.week_ratings;
create policy own_week_rating_update on public.week_ratings
  for update using (user_id = auth.uid());

drop policy if exists own_week_rating_delete on public.week_ratings;
create policy own_week_rating_delete on public.week_ratings
  for delete using (user_id = auth.uid());

-- Elk gezinslid mag de eigen rol (vader/moeder) in family_members bijwerken.
drop policy if exists update_own_parent_role on public.family_members;
create policy update_own_parent_role on public.family_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Storage: pad is nu {family_id}/{child_id}/bestand, toegankelijk voor alle gezinsleden ----------
drop policy if exists own_photo_files_select on storage.objects;
drop policy if exists own_photo_files_insert on storage.objects;
drop policy if exists own_photo_files_delete on storage.objects;

create policy family_photo_files_select on storage.objects
  for select using (
    bucket_id = 'baby-photos'
    and (storage.foldername(name))[1] in (
      select family_id::text from public.family_members where user_id = auth.uid()
    )
  );

create policy family_photo_files_insert on storage.objects
  for insert with check (
    bucket_id = 'baby-photos'
    and (storage.foldername(name))[1] in (
      select family_id::text from public.family_members where user_id = auth.uid()
    )
  );

create policy family_photo_files_delete on storage.objects
  for delete using (
    bucket_id = 'baby-photos'
    and (storage.foldername(name))[1] in (
      select family_id::text from public.family_members where user_id = auth.uid()
    )
  );
