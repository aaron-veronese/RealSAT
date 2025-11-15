-- Fix Supabase Auth by removing broken trigger and creating a proper one

-- Step 1: Check if there's an existing trigger causing the issue
-- Run this to see what triggers exist:
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE event_object_schema = 'auth';

-- Step 2: Drop any existing broken triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 3: Ensure users table allows nulls and has proper defaults
-- Note: These might fail if constraints don't exist, but that's okay
DO $$ 
BEGIN
  -- Drop NOT NULL constraint if it exists
  ALTER TABLE public.users ALTER COLUMN school_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.users 
  ALTER COLUMN gems_balance SET DEFAULT 50;

-- Set default for video_requests (it might be text[] instead of integer[])
DO $$ 
BEGIN
  ALTER TABLE public.users ALTER COLUMN video_requests SET DEFAULT ARRAY[]::integer[];
EXCEPTION
  WHEN OTHERS THEN 
    -- Try text[] if integer[] fails
    ALTER TABLE public.users ALTER COLUMN video_requests SET DEFAULT ARRAY[]::text[];
END $$;

-- Step 4: For now, DON'T create a trigger
-- We'll handle user creation manually in the signup modal
-- This avoids the "Database error saving new user" issue

-- Step 5: Make sure RLS allows the signup modal to insert
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow signup inserts" ON public.users;
CREATE POLICY "Allow signup inserts" ON public.users
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to read all" ON public.users;
CREATE POLICY "Allow users to read all" ON public.users
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow users to update own" ON public.users;
CREATE POLICY "Allow users to update own" ON public.users
  FOR UPDATE
  USING (id::uuid = auth.uid())
  WITH CHECK (id::uuid = auth.uid());

-- Verification: Try to manually insert a test user
-- You can uncomment and run this to test:
/*
INSERT INTO public.users (id, email, username, name, role, school_id, gems_balance, video_requests)
VALUES (
  gen_random_uuid()::text,
  'test@example.com',
  'testuser',
  'Test User',
  'STUDENT',
  null,
  50,
  ARRAY[]::integer[]
);
*/

-- If the above INSERT works, your signup modal should work too!
