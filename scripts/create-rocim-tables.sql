-- Enable required extensions
create extension if not exists pgcrypto;

-- Create ROCIM registrations table
CREATE TABLE IF NOT EXISTS rocim_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  occupation TEXT,
  county TEXT NOT NULL,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  emergency_contact_relationship TEXT NOT NULL,
  rocim_unit TEXT NOT NULL,
  ministry TEXT NOT NULL,
  role TEXT NOT NULL,
  testimony TEXT,
  profile_image TEXT,
  password_hash TEXT,
  payment_verified BOOLEAN DEFAULT FALSE,
  mpesa_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mission registrations table
CREATE TABLE IF NOT EXISTS mission_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rocim_registration_id UUID REFERENCES rocim_registrations(id) ON DELETE CASCADE,
  -- Human-readable ID used across all tables (e.g., ROCIM/CAM/2025/001)
  registration_id TEXT,
  official_name TEXT NOT NULL,
  email TEXT NOT NULL,
  area_of_residence TEXT NOT NULL,
  whatsapp_contact TEXT NOT NULL,
  call_contact TEXT NOT NULL,
  ministry_served TEXT NOT NULL,
  health_history TEXT NOT NULL,
  arrival_date_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rocim_registrations_email ON rocim_registrations(email);
CREATE INDEX IF NOT EXISTS idx_rocim_registrations_registration_id ON rocim_registrations(registration_id);
CREATE INDEX IF NOT EXISTS idx_mission_registrations_rocim_id ON mission_registrations(rocim_registration_id);
CREATE INDEX IF NOT EXISTS idx_mission_registrations_registration_id ON mission_registrations(registration_id);

-- Optional: ensure one mission registration per user (comment out to allow multiple)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_mission_by_registration_id'
  ) THEN
    CREATE UNIQUE INDEX uniq_mission_by_registration_id ON mission_registrations (registration_id);
  END IF;
END $$;

-- Backfill registration_id on mission_registrations from rocim_registrations
UPDATE mission_registrations m
SET registration_id = r.registration_id
FROM rocim_registrations r
WHERE m.rocim_registration_id = r.id AND (m.registration_id IS NULL OR m.registration_id = '');

-- Enable RLS and permissive policies (adjust as needed)
alter table rocim_registrations enable row level security;
alter table mission_registrations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'rocim_registrations' and policyname = 'allow_all_rocim_registrations'
  ) then
    create policy allow_all_rocim_registrations on rocim_registrations for all using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mission_registrations' and policyname = 'allow_all_mission_registrations'
  ) then
    create policy allow_all_mission_registrations on mission_registrations for all using (true) with check (true);
  end if;
end $$;
