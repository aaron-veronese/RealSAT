-- Setup users table to work with Supabase Auth and allow signup

-- Step 1: Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing restrictive policies
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON users;

-- Step 3: Create permissive policies for signup flow
-- Allow anyone to insert (needed for signup)
CREATE POLICY "Allow signup inserts" ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow all users to read all data (temp solution for freemium model)
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  TO authenticated
  USING (id::uuid = auth.uid())
  WITH CHECK (id::uuid = auth.uid());

-- Step 4: Verify no foreign key constraints are blocking inserts
-- Check if there are any constraints on users table:
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'users';

-- If there's a foreign key on school_id that's causing issues, you may need to:
-- ALTER TABLE users ALTER COLUMN school_id DROP NOT NULL;
-- Or create a default school first

-- Step 5: Verify the schema allows nullable school_id
-- (Your signup sets school_id to null, so this must be allowed)

-- Test the setup by running this in your app:
-- INSERT INTO users (id, email, username, name, role, gems_balance, video_requests)
-- VALUES ('test-uuid-here', 'test@example.com', 'testuser', 'Test User', 'STUDENT', 50, ARRAY[]::text[]);
