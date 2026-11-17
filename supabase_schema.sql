-- ==========================================================
-- Maharashtra Explorer - Supabase PostgreSQL Schema
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ipdddbxmvpqqhbqyedhx/sql/new
-- ==========================================================

-- 1. Create Profiles / Users Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT DEFAULT '',
  role TEXT DEFAULT 'ROLE_USER',
  tier TEXT DEFAULT 'Sahyadri Voyager',
  home_city TEXT DEFAULT 'Pune, Maharashtra',
  trusted_emergency_contact JSONB DEFAULT NULL,
  favorite_destination_ids JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Saved Trips Table
CREATE TABLE IF NOT EXISTS public.saved_trips (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  starting_location TEXT NOT NULL,
  start_date TEXT NOT NULL,
  days INT NOT NULL DEFAULT 1,
  total_group_budget NUMERIC NOT NULL DEFAULT 0,
  group_size INT NOT NULL DEFAULT 1,
  destinations JSONB DEFAULT '[]'::JSONB,
  itinerary JSONB NOT NULL DEFAULT '{}'::JSONB,
  expenses_logged JSONB DEFAULT '[]'::JSONB,
  bookings JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Travel Agent Inquiries Table
CREATE TABLE IF NOT EXISTS public.agent_inquiries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  package TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Insert Default Demo Traveler (Password: Password123)
INSERT INTO public.profiles (
  id,
  full_name,
  email,
  password_hash,
  phone,
  role,
  tier,
  home_city,
  favorite_destination_ids
) VALUES (
  '101',
  'Rahul Patil',
  'demo.traveler@example.com',
  '$2b$10$ZTCkPlpbWjrMN1q4pUazVuF6g58p1XisLeiXwscd1.kXEZ8PXP1CC',
  '+91 98220 12345',
  'ROLE_USER',
  'Sahyadri Voyager',
  'Pune, Maharashtra',
  '[1, 2, 5]'::JSONB
) ON CONFLICT (id) DO NOTHING;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_inquiries ENABLE ROW LEVEL SECURITY;

-- 6. Policies (Permissive for authenticated & API client requests)
CREATE POLICY "Public Read/Write Profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Saved Trips" ON public.saved_trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Inquiries" ON public.agent_inquiries FOR ALL USING (true) WITH CHECK (true);
