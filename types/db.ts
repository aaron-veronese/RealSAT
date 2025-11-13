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

export type QuestionStatus = 'CORRECT' | 'INCORRECT' | 'UNANSWERED';
export type TestStatus = 'IN_PROGRESS' | 'COMPLETE';

export interface ModuleQuestion {
  question_number: number;
  user_answer: string;
  correct_answer: string;
  time_spent: number; // in seconds
  status: QuestionStatus;
}

export interface TestModule {
  module_number: number;
  questions: ModuleQuestion[];
  completed: boolean;
  total_time: number; // in seconds
}

export interface TestAttemptModules {
  [key: string]: TestModule; // e.g., "module_1", "module_2", etc.
}

export interface DBTestAttempt {
  id: string;
  test_id: number;
  user_id: string;
  modules: TestAttemptModules;
  test_status: TestStatus;
  total_time: number | null; // in seconds
  reading_score: number | null;
  math_score: number | null;
  total_score: number | null;
  created_at: string;
  last_modified: string;
}

export interface DBUser {
  id: string;
  email: string;
  username: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  school_id: string | null;
  gems_balance: number | null;
  created_at: string;
}
