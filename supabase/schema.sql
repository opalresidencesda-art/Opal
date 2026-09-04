-- Portal Warga OPAL: jalankan di Supabase SQL Editor sebelum seed.sql.
-- Tambahkan email pengurus pada tabel admin_users sebelum mencoba login.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create table if not exists public.fee_schedules (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 2 and 120),
  amount_rupiah integer not null check (amount_rupiah > 0 and amount_rupiah <= 10000000),
  payment_method text not null check (char_length(payment_method) between 2 and 200),
  destination text not null default '',
  description text not null default '',
  effective_from date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (label, effective_from)
);

create unique index if not exists one_active_fee_per_label on public.fee_schedules (label) where is_active;

create table if not exists public.guide_sections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null check (char_length(title) between 2 and 120),
  summary text not null check (char_length(summary) between 2 and 300),
  body_markdown text not null,
  sort_order integer not null check (sort_order > 0),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists guide_sections_sort_order_unique on public.guide_sections (sort_order);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 160),
  body text not null check (char_length(body) between 2 and 2000),
  published_at date not null default current_date,
  pinned boolean not null default false,
  published boolean not null default true,
  image_path text,
  image_alt text not null default '' check (char_length(image_alt) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill-safe additions for databases created before announcement images existed.
alter table public.announcements add column if not exists image_path text;
alter table public.announcements add column if not exists image_alt text not null default '';
alter table public.announcements drop constraint if exists announcements_image_alt_check;
alter table public.announcements add constraint announcements_image_alt_check check (char_length(image_alt) <= 200);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null unique check (char_length(title) between 2 and 160),
  description text not null check (char_length(description) between 2 and 400),
  href text not null check (href ~ '^https://'),
  category text not null check (category in ('Keuangan', 'Surat', 'Data warga', 'Fasilitas', 'Rumah')),
  requires_google_login boolean not null default false,
  sort_order integer not null check (sort_order > 0),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists resources_sort_order_unique on public.resources (sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fee_schedules_set_updated_at on public.fee_schedules;
create trigger fee_schedules_set_updated_at before update on public.fee_schedules for each row execute function public.set_updated_at();
drop trigger if exists guide_sections_set_updated_at on public.guide_sections;
create trigger guide_sections_set_updated_at before update on public.guide_sections for each row execute function public.set_updated_at();
drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at before update on public.announcements for each row execute function public.set_updated_at();
drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at before update on public.resources for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.fee_schedules enable row level security;
alter table public.guide_sections enable row level security;
alter table public.announcements enable row level security;
alter table public.resources enable row level security;

create or replace function public.is_opal_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_opal_admin() to anon, authenticated;

drop policy if exists "Admins read admin list" on public.admin_users;
create policy "Admins read admin list" on public.admin_users for select using (public.is_opal_admin());
drop policy if exists "Admins maintain admin list" on public.admin_users;
create policy "Admins maintain admin list" on public.admin_users for all using (public.is_opal_admin()) with check (public.is_opal_admin());

drop policy if exists "Public reads active fees" on public.fee_schedules;
create policy "Public reads active fees" on public.fee_schedules for select using (is_active or public.is_opal_admin());
drop policy if exists "Admins write fees" on public.fee_schedules;
create policy "Admins write fees" on public.fee_schedules for all using (public.is_opal_admin()) with check (public.is_opal_admin());

drop policy if exists "Public reads published guides" on public.guide_sections;
create policy "Public reads published guides" on public.guide_sections for select using (published or public.is_opal_admin());
drop policy if exists "Admins write guides" on public.guide_sections;
create policy "Admins write guides" on public.guide_sections for all using (public.is_opal_admin()) with check (public.is_opal_admin());

drop policy if exists "Public reads published announcements" on public.announcements;
create policy "Public reads published announcements" on public.announcements for select using (published or public.is_opal_admin());
drop policy if exists "Admins write announcements" on public.announcements;
create policy "Admins write announcements" on public.announcements for all using (public.is_opal_admin()) with check (public.is_opal_admin());

drop policy if exists "Public reads published resources" on public.resources;
create policy "Public reads published resources" on public.resources for select using (published or public.is_opal_admin());
drop policy if exists "Admins write resources" on public.resources;
create policy "Admins write resources" on public.resources for all using (public.is_opal_admin()) with check (public.is_opal_admin());

create or replace function public.activate_fee_schedule(
  p_label text,
  p_amount_rupiah integer,
  p_payment_method text,
  p_destination text,
  p_description text,
  p_effective_from date
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not public.is_opal_admin() then
    raise exception 'not authorized';
  end if;
  update public.fee_schedules set is_active = false where label = p_label and is_active;
  insert into public.fee_schedules (label, amount_rupiah, payment_method, destination, description, effective_from, is_active)
  values (p_label, p_amount_rupiah, p_payment_method, p_destination, p_description, p_effective_from, true)
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.activate_fee_schedule(text, integer, text, text, text, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Operasional warga: data sensitif tidak pernah memiliki policy baca publik.
-- Jalankan bagian ini bersama skema di atas sebelum mengaktifkan layanan native.
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.service_request_type as enum ('move', 'domicile', 'single');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.service_request_status as enum ('submitted', 'in_review', 'needs_revision', 'approved', 'rejected', 'issued');
exception when duplicate_object then null;
end $$;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  unit_code text not null unique check (unit_code ~ '^OP [1235] - [0-9]{1,3}$'),
  gang smallint not null check (gang in (1, 2, 3, 5)),
  house_number text not null check (char_length(house_number) between 1 and 8),
  occupancy_status text check (occupancy_status in ('self', 'relative', 'tenant', 'vacant_rent', 'vacant_sale')),
  image_path text,
  access_token_hash text unique,
  access_token_created_at timestamptz,
  access_token_revoked_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill-safe property image column and strict property-scoped private Storage path.
alter table public.properties add column if not exists image_path text;
alter table public.properties drop constraint if exists properties_image_path_check;
alter table public.properties add constraint properties_image_path_check check (
  image_path is null
  or image_path ~* ('^properties/' || id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$')
);

create table if not exists public.property_map_positions (
  property_id uuid primary key references public.properties(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  calibrated_by text not null,
  calibrated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resident_profiles (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references public.properties(id) on delete cascade,
  responsible_name text not null,
  responsible_address text not null,
  whatsapp text not null,
  head_of_household_name text not null,
  head_of_household_occupation text not null check (head_of_household_occupation in ('employee', 'entrepreneur', 'student')),
  occupants_count integer not null check (occupants_count between 1 and 30),
  contact_email text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.resident_submissions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  status text not null default 'uploading' check (status in ('uploading', 'submitted', 'in_review', 'needs_revision', 'approved', 'rejected')),
  payload jsonb not null default '{}'::jsonb,
  contact_email text not null,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resident_evidence (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.resident_submissions(id) on delete cascade,
  evidence_kind text not null check (evidence_kind in ('responsible_ktp', 'occupant_ktp', 'family_card')),
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null check (mime_type like 'image/%'),
  byte_size integer not null check (byte_size > 0 and byte_size <= 10485760),
  created_at timestamptz not null default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_type public.service_request_type not null,
  status public.service_request_status not null default 'submitted',
  property_id uuid references public.properties(id) on delete set null,
  contact_name text not null,
  contact_email text not null,
  contact_whatsapp text not null,
  payload jsonb not null default '{}'::jsonb,
  admin_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_settings (
  id boolean primary key default true check (id),
  signer_name text not null default '',
  signer_title text not null default 'Ketua RT',
  rt_number text not null default '',
  rw_number text not null default '',
  kelurahan text not null default 'Tambakrejo',
  kecamatan text not null default 'Waru',
  kabupaten text not null default 'Sidoarjo',
  provinsi text not null default 'Jawa Timur',
  city text not null default 'Sidoarjo',
  number_format text not null default '',
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.document_sequences (
  request_type public.service_request_type not null,
  issue_year integer not null check (issue_year between 2020 and 2100),
  last_value integer not null default 0 check (last_value >= 0),
  primary key (request_type, issue_year)
);

create table if not exists public.document_issuances (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.service_requests(id) on delete cascade,
  serial_number integer not null,
  issue_year integer not null,
  document_number text not null unique,
  storage_path text not null unique,
  snapshot jsonb not null,
  issued_by text not null,
  issued_at timestamptz not null default now()
);

create table if not exists public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null,
  category text not null,
  description text not null default '',
  direction text not null check (direction in ('income', 'expense')),
  amount_rupiah integer not null check (amount_rupiah > 0),
  is_public boolean not null default true,
  source_reference text,
  imported_from uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cash_transaction_revisions (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.cash_transactions(id) on delete cascade,
  snapshot jsonb not null,
  changed_by text not null,
  changed_at timestamptz not null default now()
);

create table if not exists public.admin_activity (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create or replace function public.update_cash_transaction_with_revision(
  p_id uuid,
  p_transaction_date date,
  p_category text,
  p_description text,
  p_direction text,
  p_amount_rupiah integer,
  p_is_public boolean
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_row public.cash_transactions%rowtype;
begin
  if not public.is_opal_admin() then raise exception 'not authorized'; end if;
  select * into current_row from public.cash_transactions where id = p_id for update;
  if not found then raise exception 'cash transaction not found'; end if;

  insert into public.cash_transaction_revisions (transaction_id, snapshot, changed_by)
  values (p_id, to_jsonb(current_row), lower(coalesce(auth.jwt() ->> 'email', 'sistem')));

  update public.cash_transactions
  set transaction_date = p_transaction_date,
      category = p_category,
      description = p_description,
      direction = p_direction,
      amount_rupiah = p_amount_rupiah,
      is_public = p_is_public
  where id = p_id;
end;
$$;

grant execute on function public.update_cash_transaction_with_revision(uuid, date, text, text, text, integer, boolean) to authenticated;

create table if not exists public.property_contributions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  category text not null,
  period date,
  amount_rupiah integer not null check (amount_rupiah > 0),
  paid_at date,
  status text not null default 'paid' check (status in ('paid', 'pending', 'waived')),
  source_reference text,
  imported_from uuid,
  created_at timestamptz not null default now(),
  unique (property_id, category, period, amount_rupiah, source_reference)
);

create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'Petugas Pos & Taman',
  whatsapp text,
  photo_path text,
  published boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_specs (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('Keramik', 'Cat', 'Kontak')),
  label text not null,
  value text not null,
  published boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.floor_plan_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  storage_path text not null,
  alt_text text not null,
  sort_order integer not null default 1,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_imports (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_sha256 text not null,
  row_count integer not null default 0,
  amount_total_rupiah bigint not null default 0,
  imported_by text not null,
  imported_at timestamptz not null default now(),
  notes text,
  unique (source_name, source_sha256)
);

create index if not exists service_requests_status_created_index on public.service_requests(status, created_at desc);
create index if not exists resident_submissions_status_created_index on public.resident_submissions(status, created_at desc);
create index if not exists property_contributions_property_period_index on public.property_contributions(property_id, period desc);
create index if not exists cash_transactions_public_date_index on public.cash_transactions(is_public, transaction_date desc);
create unique index if not exists staff_profiles_name_role_unique on public.staff_profiles(name, role);
create unique index if not exists home_specs_category_label_unique on public.home_specs(category, label);

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at before update on public.properties for each row execute function public.set_updated_at();
drop trigger if exists resident_profiles_set_updated_at on public.resident_profiles;
create trigger resident_profiles_set_updated_at before update on public.resident_profiles for each row execute function public.set_updated_at();
drop trigger if exists resident_submissions_set_updated_at on public.resident_submissions;
create trigger resident_submissions_set_updated_at before update on public.resident_submissions for each row execute function public.set_updated_at();
drop trigger if exists service_requests_set_updated_at on public.service_requests;
create trigger service_requests_set_updated_at before update on public.service_requests for each row execute function public.set_updated_at();
drop trigger if exists cash_transactions_set_updated_at on public.cash_transactions;
create trigger cash_transactions_set_updated_at before update on public.cash_transactions for each row execute function public.set_updated_at();
drop trigger if exists staff_profiles_set_updated_at on public.staff_profiles;
create trigger staff_profiles_set_updated_at before update on public.staff_profiles for each row execute function public.set_updated_at();
drop trigger if exists home_specs_set_updated_at on public.home_specs;
create trigger home_specs_set_updated_at before update on public.home_specs for each row execute function public.set_updated_at();
drop trigger if exists floor_plan_assets_set_updated_at on public.floor_plan_assets;
create trigger floor_plan_assets_set_updated_at before update on public.floor_plan_assets for each row execute function public.set_updated_at();
drop trigger if exists property_map_positions_set_updated_at on public.property_map_positions;
create trigger property_map_positions_set_updated_at before update on public.property_map_positions for each row execute function public.set_updated_at();

create or replace function public.log_opal_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor text := lower(coalesce(auth.jwt() ->> 'email', ''));
  actor_label text;
  action_label text;
  entity_label text;
  row_id uuid;
begin
  if TG_TABLE_NAME = 'resident_submissions' then
    if TG_OP = 'INSERT' and new.status <> 'submitted' then return new; end if;
    if TG_OP = 'UPDATE' then
      if old.status is not distinct from new.status then return new; end if;
    end if;
    action_label := case when new.status = 'submitted' then 'Pendataan warga dikirim' else 'Status pendataan diperbarui' end;
    entity_label := 'pendataan_warga';
    row_id := new.id;
  elsif TG_TABLE_NAME = 'service_requests' then
    if TG_OP = 'UPDATE' then
      if old.status is not distinct from new.status then return new; end if;
    end if;
    action_label := case when TG_OP = 'INSERT' then 'Permohonan surat dikirim' else 'Status permohonan surat diperbarui' end;
    entity_label := 'permohonan_surat';
    row_id := new.id;
  elsif TG_TABLE_NAME = 'document_issuances' then
    action_label := 'Surat resmi diterbitkan';
    entity_label := 'penerbitan_surat';
    row_id := new.id;
  elsif TG_TABLE_NAME = 'cash_transactions' then
    action_label := case when TG_OP = 'INSERT' then 'Transaksi Kas dicatat' else 'Transaksi Kas dikoreksi' end;
    entity_label := 'transaksi_kas';
    row_id := new.id;
  elsif TG_TABLE_NAME = 'property_contributions' then
    action_label := case when TG_OP = 'INSERT' then 'Iuran rumah dicatat' else 'Catatan iuran rumah diperbarui' end;
    entity_label := 'iuran_rumah';
    row_id := new.id;
  elsif TG_TABLE_NAME = 'fee_schedules' then
    if actor = '' then return new; end if;
    action_label := 'Jadwal iuran diaktifkan';
    entity_label := 'jadwal_iuran';
    row_id := new.id;
  elsif TG_TABLE_NAME = 'announcements' then
    if actor = '' then return new; end if;
    action_label := case when TG_OP = 'INSERT' then 'Pengumuman dibuat' else 'Pengumuman diperbarui' end;
    entity_label := 'pengumuman';
    row_id := new.id;
  elsif TG_TABLE_NAME = 'resources' then
    if actor = '' then return new; end if;
    action_label := case when TG_OP = 'INSERT' then 'Layanan ditambahkan' else 'Layanan diperbarui' end;
    entity_label := 'layanan';
    row_id := new.id;
  elsif TG_TABLE_NAME = 'guide_sections' then
    if actor = '' then return new; end if;
    action_label := 'Panduan harmonis diperbarui';
    entity_label := 'panduan';
    row_id := new.id;
  elsif TG_TABLE_NAME = 'staff_profiles' then
    if actor = '' then return new; end if;
    action_label := case when TG_OP = 'INSERT' then 'Profil petugas ditambahkan' else 'Profil petugas diperbarui' end;
    entity_label := 'petugas';
    row_id := new.id;
  elsif TG_TABLE_NAME = 'home_specs' then
    if actor = '' then return new; end if;
    action_label := case when TG_OP = 'INSERT' then 'Spesifikasi rumah ditambahkan' else 'Spesifikasi rumah diperbarui' end;
    entity_label := 'spesifikasi_rumah';
    row_id := new.id;
  elsif TG_TABLE_NAME = 'floor_plan_assets' then
    if actor = '' then return new; end if;
    action_label := case when TG_OP = 'INSERT' then 'Denah ditambahkan' else 'Denah diperbarui' end;
    entity_label := 'denah';
    row_id := new.id;
  elsif TG_TABLE_NAME = 'document_settings' then
    if actor = '' then return new; end if;
    action_label := 'Pengaturan penerbitan surat diperbarui';
    entity_label := 'pengaturan_surat';
    row_id := null;
  elsif TG_TABLE_NAME = 'properties' then
    action_label := case when TG_OP = 'INSERT' then 'Rumah baru terdaftar' else 'Tautan privat rumah diperbarui' end;
    entity_label := 'tautan_rumah';
    row_id := new.id;
  elsif TG_TABLE_NAME = 'resident_profiles' then
    if actor = '' then return new; end if;
    action_label := case when TG_OP = 'INSERT' then 'Profil rumah ditambahkan' else 'Profil rumah diperbarui' end;
    entity_label := 'profil_rumah';
    row_id := new.property_id;
  elsif TG_TABLE_NAME = 'property_map_positions' then
    if actor = '' then return new; end if;
    action_label := case when TG_OP = 'INSERT' then 'Posisi rumah pada Atlas dipasang' else 'Posisi rumah pada Atlas dikoreksi' end;
    entity_label := 'peta_rumah';
    row_id := new.property_id;
  else
    return new;
  end if;

  actor_label := coalesce(nullif(actor, ''), case when TG_OP = 'INSERT' and TG_TABLE_NAME in ('resident_submissions', 'service_requests') then 'Warga' else 'Sistem' end);

  insert into public.admin_activity (actor_email, action, entity_type, entity_id)
  values (actor_label, action_label, entity_label, row_id);
  return new;
end;
$$;

create or replace function public.log_opal_admin_access_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor text := lower(coalesce(auth.jwt() ->> 'email', ''));
  target_email text := case when TG_OP = 'DELETE' then old.email else new.email end;
begin
  insert into public.admin_activity (actor_email, action, entity_type)
  values (
    coalesce(nullif(actor, ''), 'Sistem'),
    case when TG_OP = 'DELETE' then 'Akses admin dicabut untuk ' || target_email else 'Akses admin diberikan untuk ' || target_email end,
    'akses_pengurus'
  );
  if TG_OP = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists resident_submissions_activity_log on public.resident_submissions;
create trigger resident_submissions_activity_log after insert or update on public.resident_submissions for each row execute function public.log_opal_activity();
drop trigger if exists service_requests_activity_log on public.service_requests;
create trigger service_requests_activity_log after insert or update on public.service_requests for each row execute function public.log_opal_activity();
drop trigger if exists document_issuances_activity_log on public.document_issuances;
create trigger document_issuances_activity_log after insert on public.document_issuances for each row execute function public.log_opal_activity();
drop trigger if exists cash_transactions_activity_log on public.cash_transactions;
create trigger cash_transactions_activity_log after insert or update on public.cash_transactions for each row execute function public.log_opal_activity();
drop trigger if exists property_contributions_activity_log on public.property_contributions;
create trigger property_contributions_activity_log after insert or update on public.property_contributions for each row execute function public.log_opal_activity();
drop trigger if exists document_settings_activity_log on public.document_settings;
create trigger document_settings_activity_log after insert or update on public.document_settings for each row execute function public.log_opal_activity();
drop trigger if exists properties_access_activity_log on public.properties;
create trigger properties_access_activity_log after update of access_token_hash, access_token_revoked_at on public.properties for each row execute function public.log_opal_activity();
drop trigger if exists properties_created_activity_log on public.properties;
create trigger properties_created_activity_log after insert on public.properties for each row execute function public.log_opal_activity();
drop trigger if exists resident_profiles_activity_log on public.resident_profiles;
create trigger resident_profiles_activity_log after insert or update on public.resident_profiles for each row execute function public.log_opal_activity();
drop trigger if exists property_map_positions_activity_log on public.property_map_positions;
create trigger property_map_positions_activity_log after insert or update on public.property_map_positions for each row execute function public.log_opal_activity();
drop trigger if exists fee_schedules_activity_log on public.fee_schedules;
create trigger fee_schedules_activity_log after insert on public.fee_schedules for each row execute function public.log_opal_activity();
drop trigger if exists announcements_activity_log on public.announcements;
create trigger announcements_activity_log after insert or update on public.announcements for each row execute function public.log_opal_activity();
drop trigger if exists resources_activity_log on public.resources;
create trigger resources_activity_log after insert or update on public.resources for each row execute function public.log_opal_activity();
drop trigger if exists guide_sections_activity_log on public.guide_sections;
create trigger guide_sections_activity_log after update on public.guide_sections for each row execute function public.log_opal_activity();
drop trigger if exists staff_profiles_activity_log on public.staff_profiles;
create trigger staff_profiles_activity_log after insert or update on public.staff_profiles for each row execute function public.log_opal_activity();
drop trigger if exists home_specs_activity_log on public.home_specs;
create trigger home_specs_activity_log after insert or update on public.home_specs for each row execute function public.log_opal_activity();
drop trigger if exists floor_plan_assets_activity_log on public.floor_plan_assets;
create trigger floor_plan_assets_activity_log after insert or update on public.floor_plan_assets for each row execute function public.log_opal_activity();
drop trigger if exists admin_users_activity_log on public.admin_users;
create trigger admin_users_activity_log after insert or delete on public.admin_users for each row execute function public.log_opal_admin_access_activity();

alter table public.properties enable row level security;
alter table public.property_map_positions enable row level security;
alter table public.resident_profiles enable row level security;
alter table public.resident_submissions enable row level security;
alter table public.resident_evidence enable row level security;
alter table public.service_requests enable row level security;
alter table public.document_settings enable row level security;
alter table public.document_sequences enable row level security;
alter table public.document_issuances enable row level security;
alter table public.cash_transactions enable row level security;
alter table public.cash_transaction_revisions enable row level security;
alter table public.admin_activity enable row level security;
alter table public.property_contributions enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.home_specs enable row level security;
alter table public.floor_plan_assets enable row level security;
alter table public.source_imports enable row level security;

drop policy if exists "Admins manage properties" on public.properties;
create policy "Admins manage properties" on public.properties for all using (public.is_opal_admin()) with check (public.is_opal_admin());
drop policy if exists "Admins manage property map positions" on public.property_map_positions;
create policy "Admins manage property map positions" on public.property_map_positions for all using (public.is_opal_admin()) with check (public.is_opal_admin());
drop policy if exists "Admins manage resident profiles" on public.resident_profiles;
create policy "Admins manage resident profiles" on public.resident_profiles for all using (public.is_opal_admin()) with check (public.is_opal_admin());
drop policy if exists "Admins manage resident submissions" on public.resident_submissions;
create policy "Admins manage resident submissions" on public.resident_submissions for all using (public.is_opal_admin()) with check (public.is_opal_admin());
drop policy if exists "Admins manage resident evidence" on public.resident_evidence;
create policy "Admins manage resident evidence" on public.resident_evidence for all using (public.is_opal_admin()) with check (public.is_opal_admin());
drop policy if exists "Admins manage service requests" on public.service_requests;
drop policy if exists "Admins manage service_requests" on public.service_requests;
create policy "Admins manage service requests" on public.service_requests for all using (public.is_opal_admin()) with check (public.is_opal_admin());
drop policy if exists "Admins manage document settings" on public.document_settings;
create policy "Admins manage document settings" on public.document_settings for all using (public.is_opal_admin()) with check (public.is_opal_admin());
drop policy if exists "Admins manage document sequences" on public.document_sequences;
create policy "Admins manage document sequences" on public.document_sequences for all using (public.is_opal_admin()) with check (public.is_opal_admin());
drop policy if exists "Admins manage document issuances" on public.document_issuances;
create policy "Admins manage document issuances" on public.document_issuances for all using (public.is_opal_admin()) with check (public.is_opal_admin());
drop policy if exists "Public reads published cash transactions" on public.cash_transactions;
create policy "Public reads published cash transactions" on public.cash_transactions for select using (is_public or public.is_opal_admin());
drop policy if exists "Admins manage cash transactions" on public.cash_transactions;
create policy "Admins manage cash transactions" on public.cash_transactions for all using (public.is_opal_admin()) with check (public.is_opal_admin());
drop policy if exists "Admins read cash transaction revisions" on public.cash_transaction_revisions;
create policy "Admins read cash transaction revisions" on public.cash_transaction_revisions for select using (public.is_opal_admin());
drop policy if exists "Admins create cash transaction revisions" on public.cash_transaction_revisions;
create policy "Admins create cash transaction revisions" on public.cash_transaction_revisions for insert with check (public.is_opal_admin());
drop policy if exists "Admins read activity" on public.admin_activity;
create policy "Admins read activity" on public.admin_activity for select using (public.is_opal_admin());
drop policy if exists "Admins manage property contributions" on public.property_contributions;
create policy "Admins manage property contributions" on public.property_contributions for all using (public.is_opal_admin()) with check (public.is_opal_admin());
drop policy if exists "Public reads published staff" on public.staff_profiles;
create policy "Public reads published staff" on public.staff_profiles for select using (published or public.is_opal_admin());
drop policy if exists "Admins manage staff" on public.staff_profiles;
create policy "Admins manage staff" on public.staff_profiles for all using (public.is_opal_admin()) with check (public.is_opal_admin());
drop policy if exists "Public reads published home specs" on public.home_specs;
create policy "Public reads published home specs" on public.home_specs for select using (published or public.is_opal_admin());
drop policy if exists "Admins manage home specs" on public.home_specs;
create policy "Admins manage home specs" on public.home_specs for all using (public.is_opal_admin()) with check (public.is_opal_admin());
drop policy if exists "Public reads published floor plans" on public.floor_plan_assets;
create policy "Public reads published floor plans" on public.floor_plan_assets for select using (published or public.is_opal_admin());
drop policy if exists "Admins manage floor plans" on public.floor_plan_assets;
create policy "Admins manage floor plans" on public.floor_plan_assets for all using (public.is_opal_admin()) with check (public.is_opal_admin());
drop policy if exists "Admins manage source imports" on public.source_imports;
create policy "Admins manage source imports" on public.source_imports for all using (public.is_opal_admin()) with check (public.is_opal_admin());

create or replace function public.review_resident_submission(
  p_id uuid,
  p_status text,
  p_admin_note text,
  p_reviewed_by text,
  p_reviewed_at timestamptz,
  p_responsible_name text default null,
  p_responsible_address text default null,
  p_whatsapp text default null,
  p_head_of_household_name text default null,
  p_head_of_household_occupation text default null,
  p_occupants_count integer default null,
  p_contact_email text default null,
  p_occupancy_status text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_submission public.resident_submissions%rowtype;
begin
  if not public.is_opal_admin() then raise exception 'not authorized'; end if;
  if p_status not in ('in_review', 'needs_revision', 'approved', 'rejected') then raise exception 'invalid resident submission status'; end if;

  select * into current_submission from public.resident_submissions where id = p_id for update;
  if not found then raise exception 'resident submission not found'; end if;

  if p_status = 'approved' then
    if p_responsible_name is null
      or p_responsible_address is null
      or p_whatsapp is null
      or p_head_of_household_name is null
      or p_head_of_household_occupation is null
      or p_occupants_count is null
      or p_contact_email is null
      or p_occupancy_status is null
    then
      raise exception 'resident profile payload missing';
    end if;

    insert into public.resident_profiles (
      property_id,
      responsible_name,
      responsible_address,
      whatsapp,
      head_of_household_name,
      head_of_household_occupation,
      occupants_count,
      contact_email
    )
    values (
      current_submission.property_id,
      p_responsible_name,
      p_responsible_address,
      p_whatsapp,
      p_head_of_household_name,
      p_head_of_household_occupation,
      p_occupants_count,
      p_contact_email
    )
    on conflict (property_id)
    do update set
      responsible_name = excluded.responsible_name,
      responsible_address = excluded.responsible_address,
      whatsapp = excluded.whatsapp,
      head_of_household_name = excluded.head_of_household_name,
      head_of_household_occupation = excluded.head_of_household_occupation,
      occupants_count = excluded.occupants_count,
      contact_email = excluded.contact_email;

    update public.properties
    set occupancy_status = p_occupancy_status
    where id = current_submission.property_id;
  end if;

  update public.resident_submissions
  set
    status = p_status,
    admin_note = nullif(btrim(coalesce(p_admin_note, '')), ''),
    reviewed_by = p_reviewed_by,
    reviewed_at = p_reviewed_at
  where id = p_id;
end;
$$;

grant execute on function public.review_resident_submission(uuid, text, text, text, timestamptz, text, text, text, text, text, integer, text, text) to authenticated;

create or replace function public.review_service_request_status(
  p_id uuid,
  p_status public.service_request_status,
  p_admin_note text,
  p_reviewed_by text,
  p_reviewed_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_request public.service_requests%rowtype;
begin
  if not public.is_opal_admin() then raise exception 'not authorized'; end if;
  if p_status not in ('in_review', 'needs_revision', 'approved', 'rejected') then raise exception 'invalid service request status'; end if;

  select * into current_request from public.service_requests where id = p_id for update;
  if not found then raise exception 'service request not found'; end if;
  if current_request.status = 'issued' then raise exception 'service request already issued'; end if;

  update public.service_requests
  set
    status = p_status,
    admin_note = nullif(btrim(coalesce(p_admin_note, '')), ''),
    reviewed_by = p_reviewed_by,
    reviewed_at = p_reviewed_at
  where id = p_id;
end;
$$;

grant execute on function public.review_service_request_status(uuid, public.service_request_status, text, text, timestamptz) to authenticated;

create or replace function public.next_document_serial(p_type public.service_request_type, p_year integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare next_value integer;
begin
  if not public.is_opal_admin() then raise exception 'not authorized'; end if;
  insert into public.document_sequences(request_type, issue_year, last_value)
  values (p_type, p_year, 1)
  on conflict (request_type, issue_year)
  do update set last_value = public.document_sequences.last_value + 1
  returning last_value into next_value;
  return next_value;
end;
$$;

grant execute on function public.next_document_serial(public.service_request_type, integer) to authenticated;

create or replace function public.finalize_document_issuance(
  p_request_id uuid,
  p_serial integer,
  p_year integer,
  p_document_number text,
  p_storage_path text,
  p_snapshot jsonb,
  p_issued_by text,
  p_issued_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_request public.service_requests%rowtype;
  new_issuance_id uuid;
begin
  if not public.is_opal_admin() then raise exception 'not authorized'; end if;
  if p_serial < 1 or p_year < 2000 or nullif(btrim(coalesce(p_document_number, '')), '') is null or nullif(btrim(coalesce(p_storage_path, '')), '') is null then
    raise exception 'invalid issuance payload';
  end if;

  select * into current_request from public.service_requests where id = p_request_id for update;
  if not found then raise exception 'service request not found'; end if;
  if current_request.status <> 'approved' then raise exception 'service request not approved'; end if;
  if exists (select 1 from public.document_issuances where request_id = p_request_id) then raise exception 'service request already issued'; end if;

  insert into public.document_issuances (
    request_id,
    serial_number,
    issue_year,
    document_number,
    storage_path,
    snapshot,
    issued_by,
    issued_at
  )
  values (
    p_request_id,
    p_serial,
    p_year,
    p_document_number,
    p_storage_path,
    p_snapshot,
    p_issued_by,
    p_issued_at
  )
  returning id into new_issuance_id;

  update public.service_requests
  set
    status = 'issued',
    reviewed_by = p_issued_by,
    reviewed_at = p_issued_at
  where id = p_request_id;

  return new_issuance_id;
end;
$$;

grant execute on function public.finalize_document_issuance(uuid, integer, integer, text, text, jsonb, text, timestamptz) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('resident-evidence', 'resident-evidence', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
  ('document-exports', 'document-exports', false, 5242880, array['application/pdf']),
  ('opal-assets', 'opal-assets', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins manage private resident evidence" on storage.objects;
create policy "Admins manage private resident evidence" on storage.objects for all
using (bucket_id = 'resident-evidence' and public.is_opal_admin())
with check (bucket_id = 'resident-evidence' and public.is_opal_admin());
drop policy if exists "Admins manage private document exports" on storage.objects;
create policy "Admins manage private document exports" on storage.objects for all
using (bucket_id = 'document-exports' and public.is_opal_admin())
with check (bucket_id = 'document-exports' and public.is_opal_admin());
drop policy if exists "Public reads OPAL assets" on storage.objects;
drop policy if exists "Admins manage OPAL assets" on storage.objects;
create policy "Admins manage OPAL assets" on storage.objects for all
using (bucket_id = 'opal-assets' and public.is_opal_admin())
with check (bucket_id = 'opal-assets' and public.is_opal_admin());
