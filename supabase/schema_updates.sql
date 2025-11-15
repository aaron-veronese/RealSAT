-- Schema Updates for Role-Based Dashboard System
-- Execute these statements in order

-- 1. Update users table
ALTER TABLE users 
ADD COLUMN name TEXT,
ADD COLUMN video_requests INTEGER[] DEFAULT '{}';

-- Update role enum to include OWNER
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'OWNER';

-- 2. Update schools table - replace individual columns with branding jsonb
ALTER TABLE schools
ADD COLUMN branding JSONB DEFAULT '{}'::jsonb;

-- Migrate existing data to branding jsonb (if you have data)
-- UPDATE schools SET branding = jsonb_build_object(
--   'logo', logo,
--   'plan', plan,
--   'url', url,
--   'theme', theme
-- );

-- Drop old columns (uncomment after data migration)
-- ALTER TABLE schools DROP COLUMN logo;
-- ALTER TABLE schools DROP COLUMN plan;
-- ALTER TABLE schools DROP COLUMN url;
-- ALTER TABLE schools DROP COLUMN theme;

-- 3. Update classrooms table
ALTER TABLE classrooms
ADD COLUMN schedule JSONB,
ADD COLUMN assigned_tests INTEGER[],
ADD COLUMN section TEXT;

-- 4. Update questions table
ALTER TABLE questions
ALTER COLUMN test_id DROP NOT NULL,
ADD COLUMN custom_tags TEXT[];

-- 5. Rename test_attempts to test_results
ALTER TABLE test_attempts RENAME TO test_results;

-- 6. Add completed_at timestamp to test_results
ALTER TABLE test_results
ADD COLUMN completed_at TIMESTAMP;

-- Update completed_at for existing completed tests (use last_modified as fallback)
UPDATE test_results 
SET completed_at = last_modified 
WHERE test_status = 'COMPLETE' AND completed_at IS NULL;

-- 7. Convert all timestamp with time zone columns to timestamp (UTC)
-- Note: This preserves the time values but removes timezone info
-- PostgreSQL will interpret these as UTC

-- users table
ALTER TABLE users 
ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'UTC';

-- schools table
ALTER TABLE schools 
ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'UTC';

-- classrooms table
ALTER TABLE classrooms 
ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'UTC';

-- test_results table (formerly test_attempts)
ALTER TABLE test_results 
ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'UTC',
ALTER COLUMN last_modified TYPE TIMESTAMP USING last_modified AT TIME ZONE 'UTC';

-- 8. Update indexes if they reference the old table name
-- Drop old indexes
DROP INDEX IF EXISTS test_attempts_user_id_idx;
DROP INDEX IF EXISTS test_attempts_test_id_idx;
DROP INDEX IF EXISTS test_attempts_test_status_idx;

-- Create new indexes
CREATE INDEX IF NOT EXISTS test_results_user_id_idx ON test_results(user_id);
CREATE INDEX IF NOT EXISTS test_results_test_id_idx ON test_results(test_id);
CREATE INDEX IF NOT EXISTS test_results_test_status_idx ON test_results(test_status);
CREATE INDEX IF NOT EXISTS test_results_completed_at_idx ON test_results(completed_at);

-- 9. Update foreign key constraints if needed
-- (These should automatically update with table rename, but verify)

-- Note: Remember to update your RLS policies if you have them:
-- ALTER POLICY <old_policy_name> ON test_results RENAME TO <new_policy_name>;

-- Verification queries (run these to confirm changes):
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'schools' ORDER BY ordinal_position;
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'classrooms' ORDER BY ordinal_position;
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'questions' ORDER BY ordinal_position;
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'test_results' ORDER BY ordinal_position;
