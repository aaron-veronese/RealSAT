-- SQL to populate test_attempts table with sample leaderboard data for test_id = 89
-- This creates realistic test data with varying scores
-- 
-- NOTE: This SQL is MUCH simpler than a real test attempt!
-- In reality, you need to query the questions table first to get the actual correct_answer for each question
-- For this demo, we're just using placeholder answers
--
-- To use this file:
-- 1. Connect to your Supabase database
-- 2. Run: psql -h <your-db-host> -U postgres -d postgres -f populate_leaderboard.sql
-- Or copy/paste into Supabase SQL Editor

-- Clear existing test attempts for test 89 (optional, for testing)
-- DELETE FROM test_attempts WHERE test_id = 89;

-- Helper function to generate realistic question data with varied correctness
-- This is a simplified version - in production, query the questions table for correct answers

-- User 1: SATMaster2024 (1580 total, 790 R&W, 790 Math = 26/27, 25/27, 21/22, 20/22)
-- Generate UUIDs for each user to avoid conflicts
DO $$
DECLARE
  user1_id UUID := gen_random_uuid();
  user2_id UUID := gen_random_uuid();
  user3_id UUID := gen_random_uuid();
BEGIN
  -- First, create users in the users table (required due to foreign key constraint)
  INSERT INTO users (id, email, username, role, created_at)
  VALUES 
    (user1_id, 'user1@example.com', 'SATMaster2024', 'STUDENT', NOW() - INTERVAL '30 days'),
    (user2_id, 'user2@example.com', 'ReadingPro', 'STUDENT', NOW() - INTERVAL '25 days'),
    (user3_id, 'user3@example.com', 'MathWhiz', 'STUDENT', NOW() - INTERVAL '20 days');

  -- User 1: High scorer
  INSERT INTO test_attempts (user_id, test_id, modules, created_at, last_modified)
  VALUES (
    user1_id,
    89,
    jsonb_build_object(
      'module_1', jsonb_build_object(
        'module_number', 1,
        'questions', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'question_number', q,
              'user_answer', CASE WHEN q <= 26 THEN 'A' ELSE 'B' END,
              'correct_answer', 'A',
              'time_spent', 45 + (q % 10),
              'status', 'answered',
              'options', ARRAY['A', 'B', 'C', 'D']
            )
          )
          FROM generate_series(1, 27) AS q
        )
      ),
      'module_2', jsonb_build_object(
        'module_number', 2,
        'questions', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'question_number', q,
              'user_answer', CASE WHEN q <= 25 THEN 'A' ELSE 'B' END,
              'correct_answer', 'A',
              'time_spent', 55 + (q % 10),
              'status', 'answered',
              'options', ARRAY['A', 'B', 'C', 'D']
            )
          )
          FROM generate_series(1, 27) AS q
        )
      ),
      'module_3', jsonb_build_object(
        'module_number', 3,
        'questions', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'question_number', q,
              'user_answer', CASE WHEN q <= 21 THEN 'A' ELSE 'B' END,
              'correct_answer', 'A',
              'time_spent', 65 + (q % 10),
              'status', 'answered',
              'options', ARRAY['A', 'B', 'C', 'D']
            )
          )
          FROM generate_series(1, 22) AS q
        )
      ),
      'module_4', jsonb_build_object(
        'module_number', 4,
        'questions', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'question_number', q,
              'user_answer', CASE WHEN q <= 20 THEN 'A' ELSE 'B' END,
              'correct_answer', 'A',
              'time_spent', 75 + (q % 10),
              'status', 'answered',
              'options', ARRAY['A', 'B', 'C', 'D']
            )
          )
          FROM generate_series(1, 22) AS q
        )
      )
    ),
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  );

  -- User 2: Mid-high scorer (Reading: 26/27, 23/27, Math: 19/22, 18/22)
  INSERT INTO test_attempts (user_id, test_id, modules, created_at, last_modified)
  VALUES (
    user2_id,
    89,
    jsonb_build_object(
      'module_1', jsonb_build_object(
        'module_number', 1,
        'questions', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'question_number', q,
              'user_answer', CASE WHEN q <= 26 THEN 'A' ELSE 'B' END,
              'correct_answer', 'A',
              'time_spent', 40 + (q % 12),
              'status', 'answered',
              'options', ARRAY['A', 'B', 'C', 'D']
            )
          )
          FROM generate_series(1, 27) AS q
        )
      ),
      'module_2', jsonb_build_object(
        'module_number', 2,
        'questions', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'question_number', q,
              'user_answer', CASE WHEN q <= 23 THEN 'A' ELSE 'B' END,
              'correct_answer', 'A',
              'time_spent', 50 + (q % 12),
              'status', 'answered',
              'options', ARRAY['A', 'B', 'C', 'D']
            )
          )
          FROM generate_series(1, 27) AS q
        )
      ),
      'module_3', jsonb_build_object(
        'module_number', 3,
        'questions', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'question_number', q,
              'user_answer', CASE WHEN q <= 19 THEN 'A' ELSE 'B' END,
              'correct_answer', 'A',
              'time_spent', 60 + (q % 12),
              'status', 'answered',
              'options', ARRAY['A', 'B', 'C', 'D']
            )
          )
          FROM generate_series(1, 22) AS q
        )
      ),
      'module_4', jsonb_build_object(
        'module_number', 4,
        'questions', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'question_number', q,
              'user_answer', CASE WHEN q <= 18 THEN 'A' ELSE 'B' END,
              'correct_answer', 'A',
              'time_spent', 70 + (q % 12),
              'status', 'answered',
              'options', ARRAY['A', 'B', 'C', 'D']
            )
          )
          FROM generate_series(1, 22) AS q
        )
      )
    ),
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  );

  -- User 3: Mid scorer (Reading: 25/27, 24/27, Math: 20/22, 19/22)
  INSERT INTO test_attempts (user_id, test_id, modules, created_at, last_modified)
  VALUES (
    user3_id,
    89,
    jsonb_build_object(
      'module_1', jsonb_build_object(
        'module_number', 1,
        'questions', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'question_number', q,
              'user_answer', CASE WHEN q <= 25 THEN 'A' ELSE 'B' END,
              'correct_answer', 'A',
              'time_spent', 48 + (q % 8),
              'status', 'answered',
              'options', ARRAY['A', 'B', 'C', 'D']
            )
          )
          FROM generate_series(1, 27) AS q
        )
      ),
      'module_2', jsonb_build_object(
        'module_number', 2,
        'questions', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'question_number', q,
              'user_answer', CASE WHEN q <= 24 THEN 'A' ELSE 'B' END,
              'correct_answer', 'A',
              'time_spent', 58 + (q % 8),
              'status', 'answered',
              'options', ARRAY['A', 'B', 'C', 'D']
            )
          )
          FROM generate_series(1, 27) AS q
        )
      ),
      'module_3', jsonb_build_object(
        'module_number', 3,
        'questions', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'question_number', q,
              'user_answer', CASE WHEN q <= 20 THEN 'A' ELSE 'B' END,
              'correct_answer', 'A',
              'time_spent', 68 + (q % 8),
              'status', 'answered',
              'options', ARRAY['A', 'B', 'C', 'D']
            )
          )
          FROM generate_series(1, 22) AS q
        )
      ),
      'module_4', jsonb_build_object(
        'module_number', 4,
        'questions', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'question_number', q,
              'user_answer', CASE WHEN q <= 19 THEN 'A' ELSE 'B' END,
              'correct_answer', 'A',
              'time_spent', 78 + (q % 8),
              'status', 'answered',
              'options', ARRAY['A', 'B', 'C', 'D']
            )
          )
          FROM generate_series(1, 22) AS q
        )
      )
    ),
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours'
  );

  RAISE NOTICE 'Created 3 test attempts with user IDs: %, %, %', user1_id, user2_id, user3_id;
END $$;

-- Verify the data was inserted
SELECT 
  user_id,
  test_id,
  created_at,
  (modules->'module_1'->'questions') as module1_count,
  (modules->'module_2'->'questions') as module2_count
FROM test_attempts 
WHERE test_id = 89
ORDER BY created_at DESC;

-- To add more users, copy the INSERT pattern above and adjust the correct answer counts
-- Remember: The scoring algorithm will calculate the scaled scores (400-800) based on raw counts
