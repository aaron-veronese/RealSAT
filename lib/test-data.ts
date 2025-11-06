import type { TestModule, TestQuestion } from "./types"
import { test1Data } from "./question-data"

// Helper function to organize questions by module
function getQuestionsForModule(moduleNumber: number): any[] {
  return test1Data.filter((q) => q.module === moduleNumber)
}

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function convertToTestQuestion(csvQuestion: any, moduleId: string, questionNumber: number): TestQuestion {
  const contentColumns = [
    csvQuestion.content1,
    csvQuestion.content2,
    csvQuestion.content3,
    csvQuestion.content4,
    csvQuestion.content5,
  ].filter((content) => content && content.trim() !== "")

  return {
    id: `q-${moduleId}-${questionNumber}`,
    moduleId,
    questionNumber,
    questionText: csvQuestion.content1 || "",
    contentColumns: contentColumns.length > 0 ? contentColumns : undefined,
    questionType:
      csvQuestion.answerA || csvQuestion.answerB || csvQuestion.answerC || csvQuestion.answerD
        ? "multiple-choice"
        : "free-response",
    options:
      csvQuestion.answerA || csvQuestion.answerB || csvQuestion.answerC || csvQuestion.answerD
        ? [csvQuestion.answerA || "", csvQuestion.answerB || "", csvQuestion.answerC || "", csvQuestion.answerD || ""]
        : undefined,
    correctAnswer: String(csvQuestion.correctAnswer),
    difficulty: csvQuestion.difficulty?.toLowerCase() || "medium",
  }
}

export function generateModuleQuestions(
  moduleType: "reading" | "math",
  moduleNumber: number,
  count: number,
  usedQuestionIds: Set<string> = new Set(),
  previousModuleQuestions?: TestQuestion[],
): TestQuestion[] {
  const moduleId = `module-${moduleNumber}`

  const moduleQuestions = getQuestionsForModule(moduleNumber)

  // Convert to TestQuestion format
  return moduleQuestions.map((q, index) => convertToTestQuestion(q, moduleId, index + 1))
}

export function generateTest() {
  const now = new Date()
  const testId = `test-${Math.random().toString(36).substring(2, 9)}`

  const test = {
    id: testId,
    startedAt: now,
    modules: [],
  }

  test.modules = [
    {
      id: `module-1-${test.id}`,
      testId: test.id,
      moduleNumber: 1,
      moduleType: "reading",
      startedAt: now,
      questions: generateModuleQuestions("reading", 1, 0),
    },
    {
      id: `module-2-${test.id}`,
      testId: test.id,
      moduleNumber: 2,
      moduleType: "reading",
      startedAt: new Date(now.getTime() + 35 * 60000),
      questions: generateModuleQuestions("reading", 2, 0),
    },
    {
      id: `module-3-${test.id}`,
      testId: test.id,
      moduleNumber: 3,
      moduleType: "math",
      startedAt: new Date(now.getTime() + 70 * 60000),
      questions: generateModuleQuestions("math", 3, 0),
    },
    {
      id: `module-4-${test.id}`,
      testId: test.id,
      moduleNumber: 4,
      moduleType: "math",
      startedAt: new Date(now.getTime() + 105 * 60000),
      questions: generateModuleQuestions("math", 4, 0),
    },
  ] as TestModule[]

  return test
}
