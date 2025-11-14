-- Populate tests 1-88 by copying test 89 questions
INSERT INTO questions (test_id, module_number, question_number, content, answers, correct_answer, section, tags, attempted, correct, difficulty, video_requests, video, created_at)
SELECT 
  generate_series AS test_id,
  module_number,
  question_number,
  content,
  answers,
  correct_answer,
  section,
  tags,
  attempted,
  correct,
  difficulty,
  video_requests,
  video,
  created_at
FROM 
  generate_series(1, 88),
  questions
WHERE 
  test_id = 89;
