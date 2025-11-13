// Test types
export interface Test {
  id: string
  startedAt: Date
  completedAt?: Date
  totalScore?: number
  readingScore?: number
  mathScore?: number
  modules: TestModule[]
}

export interface TestModule {
  id: string
  testId: string
  moduleNumber: number
  moduleType: "reading" | "math"
  isAdaptive: boolean
  startedAt: Date
  completedAt?: Date
  score?: number
  questions: TestQuestion[]
}

export interface TestQuestion {
  id: string
  moduleId: string
  questionNumber: number
  questionText: string // Deprecated - use content array instead
  questionType: "multiple-choice" | "free-response"
  options?: string[]
  correctAnswer: string
  userAnswer?: string
  flagged?: boolean
  difficulty?: "easy" | "medium" | "hard"
  contentColumns?: string[] // Deprecated - use content array instead
  tags?: string[] // Array of tags
  timeSpent?: number // Time spent on this question in seconds
  content?: Array<{ type: string; value: string }> // New structure
  answers?: Array<{ type: string; value: string }> // New structure
  section?: 'MATH' | 'READING'
}

// Scoring types
export interface SectionScore {
  rawScore: number
  scaledScore: number
}

export interface TestScore {
  readingWriting: SectionScore
  math: SectionScore
  total: number
}
