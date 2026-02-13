-- Migration 016: onboarding_submissions table
-- Stores enriched lead qualification data from the /kom-i-gang wizard

create table if not exists onboarding_submissions (
  id uuid primary key default gen_random_uuid(),
  industry text not null,
  use_case text not null,
  custom_challenge text,
  business_size text not null,
  traffic_range text not null,
  name text not null,
  email text not null,
  company text,
  website_url text,
  created_at timestamptz not null default now()
);

-- Index for admin listing (newest first)
create index onboarding_submissions_created_at_idx
  on onboarding_submissions (created_at desc);

-- RLS: no public access — admin reads via service role key only
alter table onboarding_submissions enable row level security;

-- No policies = zero public access (service role bypasses RLS)
