export interface DBQuestion {
  id: string;
  test_id: number;
  module_number: number;
  question_number: number;
  content: Array<{ type: string; value: string }>;
  answers: Array<{ type: string; value: string }>;
  correct_answer: string;
  section: 'MATH' | 'READING';
  tags: string[] | null;
  attempted: number | null;
  correct: number | null;
  difficulty: number | null;
  video_requests: number | null;
  video: string | null;
  created_at: string;
}
