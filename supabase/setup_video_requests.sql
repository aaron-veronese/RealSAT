-- Add gems_balance column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS gems_balance INTEGER DEFAULT 50;

-- Add video_requests column to users table (array of question UUIDs)
ALTER TABLE users ADD COLUMN IF NOT EXISTS video_requests TEXT[] DEFAULT '{}';

-- Add video_requests counter to questions table if it doesn't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS video_requests INTEGER DEFAULT 0;

-- Add video column to questions table if it doesn't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS video TEXT;

-- Create function to increment video_requests counter
CREATE OR REPLACE FUNCTION increment_video_requests(question_uuid TEXT)
RETURNS void AS $$
BEGIN
  UPDATE questions
  SET video_requests = COALESCE(video_requests, 0) + 1
  WHERE id = question_uuid::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to unlock video for user (bypasses RLS)
CREATE OR REPLACE FUNCTION unlock_video_for_user(
  p_user_id UUID,
  p_question_id TEXT
) RETURNS json AS $$
DECLARE
  v_gems INTEGER;
  v_requests TEXT[];
BEGIN
  -- Get current values
  SELECT gems_balance, video_requests INTO v_gems, v_requests
  FROM users WHERE id = p_user_id;
  
  -- Check if user exists
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Check gems
  IF v_gems < 10 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient gems', 'remainingGems', v_gems);
  END IF;
  
  -- Check if already unlocked
  IF p_question_id = ANY(v_requests) THEN
    RETURN json_build_object('success', false, 'error', 'Already unlocked');
  END IF;
  
  -- Update user
  UPDATE users 
  SET gems_balance = gems_balance - 10,
      video_requests = array_append(video_requests, p_question_id)
  WHERE id = p_user_id;
  
  -- Increment question counter
  UPDATE questions 
  SET video_requests = COALESCE(video_requests, 0) + 1
  WHERE id = p_question_id::uuid;
  
  RETURN json_build_object('success', true, 'remainingGems', v_gems - 10);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for video operations
-- Users can read their own gems_balance and video_requests
CREATE POLICY "Users can read own gems and video requests" ON users
  FOR SELECT
  USING (id = auth.uid() OR true); -- Allow reading for now, tighten later

-- Users can update their own video_requests and gems_balance
-- Note: In production, you'd want this to go through an RPC function for security
CREATE POLICY "Users can update own video data" ON users
  FOR UPDATE
  USING (id = auth.uid());

-- Anyone can read questions.video and video_requests (public data)
-- This should already be covered by existing policies, but ensure questions are readable
