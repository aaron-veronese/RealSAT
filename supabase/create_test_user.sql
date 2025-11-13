-- Create a test user for development
-- Run this in your Supabase SQL editor

INSERT INTO users (id, email, username, role, gems_balance)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'testuser@example.com',
  'Test User',
  'STUDENT',
  100
)
ON CONFLICT (id) DO NOTHING;

-- Verify the user was created
SELECT * FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
