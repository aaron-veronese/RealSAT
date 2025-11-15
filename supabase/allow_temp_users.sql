-- Allow temporary users to create test_results without being in users table
-- This supports the freemium model where users can take tests before signing up

-- Step 1: Drop foreign key constraint if it exists
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_user_id_fkey;
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_attempts_user_id_fkey;
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS fk_user_id;

-- Step 2: Enable RLS
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies and create new permissive ones
DROP POLICY IF EXISTS "Allow all operations on test_results" ON test_results;
DROP POLICY IF EXISTS "Allow all test_results operations" ON test_results;
DROP POLICY IF EXISTS "Users can insert their own test results" ON test_results;
DROP POLICY IF EXISTS "Users can read their own test results" ON test_results;
DROP POLICY IF EXISTS "Users can update their own test results" ON test_results;
DROP POLICY IF EXISTS "Users can delete their own test results" ON test_results;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON test_results;
DROP POLICY IF EXISTS "Enable read access for all users" ON test_results;

-- Create single permissive policy for all operations
-- This allows both temp users (with UUID prefix) and authenticated users
CREATE POLICY "Allow all operations on test_results" ON test_results
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Verify it worked (run this after to check):
-- SELECT * FROM pg_policies WHERE tablename = 'test_results';

