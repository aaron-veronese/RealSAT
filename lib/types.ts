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
  questionText: string
  questionType: "multiple-choice" | "free-response"
  options?: string[]
  correctAnswer: string
  userAnswer?: string
  flagged?: boolean
  difficulty?: "easy" | "medium" | "hard"
  contentColumns?: (string | null | undefined)[] // Add this line
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
