import type { TestQuestion } from "./types"
import type { DBQuestion } from "@/types/db"
import { getQuestionsByModule } from "./supabase/questions"

export async function generateModuleQuestions(
  moduleType: "reading" | "math",
  moduleNumber: number,
  count: number,
  usedQuestionIds: Set<string>,
  previousModuleQuestions?: TestQuestion[],
): Promise<TestQuestion[]> {
  // Fetch questions from Supabase for the given module
  const { data: dbQuestions, error } = await getQuestionsByModule(89, moduleNumber)
  
  if (error || !dbQuestions) {
    console.error("Error fetching questions:", error)
    return []
  }

  // Transform DBQuestion to TestQuestion format
  const availableQuestions = dbQuestions.map((q: DBQuestion) => {
    // Combine all content blocks into contentColumns array
    const contentColumns = q.content.map(block => block.value)

    // Determine question type based on whether it has answer options
    const isFreeResponse = q.answers.length === 0
      
    const result: TestQuestion = {
      id: q.id,
      moduleId: String(q.module_number),
      questionNumber: q.question_number,
      questionText: q.content[0]?.value || "",
      contentColumns,
      questionType: isFreeResponse ? "free-response" : "multiple-choice",
      options: isFreeResponse ? [] : q.answers.map(a => a.value),
      correctAnswer: q.correct_answer,
      userAnswer: "",
      difficulty: q.difficulty ? (q.difficulty === 1 ? "easy" : q.difficulty === 2 ? "medium" : "hard") : "medium",
      tags: q.tags || [],
      timeSpent: 0,
    }

    return result
  })

  return availableQuestions.slice(0, count)
}
