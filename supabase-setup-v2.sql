-- Run this script in your Supabase SQL Editor

-- 1. Create the allowed_users table to manage access
CREATE TABLE IF NOT EXISTS public.allowed_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('transporter', 'shopkeeper')),
    shop_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id)
);

-- 2. Enable Row Level Security (RLS) on allowed_users
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for allowed_users
-- Owners can read, insert, update, delete allowed_users
CREATE POLICY "Owners can manage allowed_users"
ON public.allowed_users FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
);

-- Any authenticated user can read allowed_users (needed during login/signup check)
CREATE POLICY "Anyone can read allowed_users"
ON public.allowed_users FOR SELECT
USING (true);

-- 4. Add the 'pending' role to existing check constraint on profiles table if it exists
-- First, drop the existing constraint (assuming it was named 'profiles_role_check')
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Then add the new constraint
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('owner', 'transporter', 'shopkeeper', 'pending'));

-- Note: In Supabase, often roles are just TEXT columns. If you used an ENUM or strict CHECK constraint in v1, you will need to update it to allow 'pending'.

-- 5. IMPORTANT: Fix Row Level Security (RLS) for new users signing in via Google
-- By default, Supabase RLS prevents authenticated users from inserting rows if a policy isn't explicitly defined.
-- We must allow users who have just signed in via Google (and thus have an auth.uid())
-- to insert their *own* record into the `profiles` table.

-- Drop the policy if it already exists to prevent errors
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create policy to allow authenticated users to insert a row where the id matches their auth.uid()
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Ensure users can update their own profile (for FCM tokens, etc)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Ensure users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- We also need to ensure owners can read all profiles to manage them
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;
CREATE POLICY "Owners can view all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'owner'
  )
);
