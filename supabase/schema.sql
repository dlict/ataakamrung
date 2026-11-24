-- Supabase PostgreSQL Schema for สพป.แม่ฮ่องสอน เขต 1 Staffing Dashboard
-- Run this SQL once in your Supabase Project -> SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.report_periods (
  id uuid primary key default gen_random_uuid(),
  buddhist_year integer not null check (buddhist_year >= 2500 and buddhist_year <= 2700),
  month_number integer not null check (month_number >= 1 and month_number <= 12),
  month_label text not null,
  period_note text not null default '',
  source_filename text not null,
  total_schools integer not null default 0,
  total_students integer not null default 0,
  total_classrooms integer not null default 0,
  total_actual_staff integer not null default 0,
  total_j18_calc integer not null default 0,
  total_criteria integer not null default 0,
  net_diff integer not null default 0,
  net_diff_pct numeric(7,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_report_periods_year_month unique (buddhist_year, month_number)
);

create table if not exists public.school_staffing_records (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.report_periods(id) on delete cascade,
  seq_no integer not null,
  is_flagged boolean not null default false,
  school_code text not null,
  school_name text not null,
  location_raw text not null default '',
  subdistrict text not null default '',
  district text not null default '',
  province text not null default '',
  school_size text not null default '',
  school_type text not null default '',
  project_name text not null default '',
  special_feature text not null default '',

  students_count integer not null default 0,
  classrooms_count integer not null default 0,

  actual_director integer not null default 0,
  actual_deputy integer not null default 0,
  actual_teacher integer not null default 0,
  actual_total integer not null default 0,

  j18_paid_director integer not null default 0,
  j18_paid_deputy integer not null default 0,
  j18_paid_teacher integer not null default 0,
  j18_paid_total integer not null default 0,

  j18_calc_director integer not null default 0,
  j18_calc_deputy integer not null default 0,
  j18_calc_teacher integer not null default 0,
  j18_calc_total integer not null default 0,

  criteria_director integer not null default 0,
  criteria_deputy integer not null default 0,
  criteria_teacher integer not null default 0,
  criteria_total integer not null default 0,

  diff_director integer not null default 0,
  diff_deputy integer not null default 0,
  diff_teacher integer not null default 0,
  diff_total integer not null default 0,
  diff_teacher_pct numeric(7,2) not null default 0,

  retire_director integer not null default 0,
  retire_deputy integer not null default 0,
  retire_teacher integer not null default 0,
  retire_total integer not null default 0,

  post_retire_director integer not null default 0,
  post_retire_deputy integer not null default 0,
  post_retire_teacher integer not null default 0,
  post_retire_total integer not null default 0,
  post_retire_pct numeric(7,2) not null default 0,

  secondment_out integer not null default 0,
  secondment_in integer not null default 0,
  royal_decree_teacher integer not null default 0,
  contract_teacher integer not null default 0,

  created_at timestamptz not null default now(),
  constraint uq_period_school_code unique (period_id, school_code)
);

create index if not exists idx_school_records_period_id on public.school_staffing_records(period_id);
create index if not exists idx_school_records_district on public.school_staffing_records(district);
create index if not exists idx_school_records_school_code on public.school_staffing_records(school_code);
create index if not exists idx_report_periods_sort on public.report_periods(buddhist_year desc, month_number desc);

alter table public.report_periods enable row level security;
alter table public.school_staffing_records enable row level security;

-- Note: Server routes using SUPABASE_SERVICE_ROLE_KEY bypass RLS automatically.
-- If connecting with SUPABASE_ANON_KEY in trusted internal setups, allow read/write via policies below:
drop policy if exists "Allow read report_periods" on public.report_periods;
create policy "Allow read report_periods"
  on public.report_periods for select
  using (true);

drop policy if exists "Allow read school_staffing_records" on public.school_staffing_records;
create policy "Allow read school_staffing_records"
  on public.school_staffing_records for select
  using (true);
