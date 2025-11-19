export interface DBQuestion {
  id: string;
  test_id: number | null; // Nullable for custom questions
  module_number: number;
  question_number: number;
  content: Array<{ type: string; value: string }>;
  answers: Array<{ type: string; value: string }>;
  correct_answer: string;
  section: 'MATH' | 'READING';
  tags: string[] | null;
  custom_tags?: string[] | null; // New field for custom categorization
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

export interface DBTestResult {
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
  completed_at?: string; // New field to track completion timestamp
}

// Keep legacy type alias for backwards compatibility during migration
export type DBTestAttempt = DBTestResult;

export interface DBUser {
  id: string;
  email: string;
  username: string;
  name?: string; // New field for full name
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'OWNER' | 'TUTOR';
  school_id: string | null;
  gems_balance: number | null;
  video_requests?: number[]; // New field for requested question IDs
  created_at: string;
}

export interface DBSchool {
  id: string;
  name: string;
  branding?: {
    skoonURL?: string;
    website?: string;
    hourlyRate?: number;
    bio?: string;
    specialty?: 'MATH' | 'READING' | 'ALL';
    portrait?: string;
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    tertiaryColor?: string;
    darkModeHighlight?: string;
    darkModeBackground?: string;
    darkModeText?: string;
    lightModeHighlight?: string;
    lightModeBackground?: string;
    lightModeText?: string;
    [key: string]: any;
  };
  created_at: string;
}

export interface DBClassroom {
  id: string;
  name: string;
  school_id: string;
  students: string[]; // Array of user IDs
  teachers: string[]; // Array of user IDs
  schedule?: {
    meeting_times?: string[];
    timezone?: string;
    [key: string]: any;
  };
  assigned_tests?: number[]; // Array of test IDs
  section?: string; // e.g., "Period 3", "A Block"
  created_at: string;
}
