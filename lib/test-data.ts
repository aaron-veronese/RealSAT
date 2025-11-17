import type { TestQuestion, QuestionContentBlock } from "./types"
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
    // Build contentColumns as a list of block values for legacy rendering
    const contentColumns = (q.content || []).map(block => block.value)

    // Map DB content to strongly-typed QuestionContentBlock unions
    const contentBlocks: QuestionContentBlock[] = (q.content || []).map((block) => {
      try {
        // Normalize known block types
        if (block.type === "text") {
          return { type: "text", value: String(block.value) }
        }

        if (block.type === "diagram") {
          // Diagram value may be a JSON string or an object
          const parsed = typeof block.value === "string" ? JSON.parse(block.value) : block.value
          // Ensure diagramType exists (fallback to image)
          const diagramType = parsed.diagramType || parsed.chartType || "image"
          return { type: "diagram", diagramType, ...(parsed as any) } as QuestionContentBlock
        }

        if (block.type === "table") {
          // Try to parse a JSON-based table format or fallback to pipe-delimited
          const parsed = typeof block.value === "string" ? JSON.parse(block.value) : block.value
          if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
            return { type: "table", columns: parsed.columns, rows: parsed.rows } as QuestionContentBlock
          }
          // fallback: parse pipe-delimited table rows (|| for rows, | for cols)
          const rows = String(block.value).split("||").map(r => r.split("|").map(c => c.trim()))
          const columns = rows.length > 0 ? rows[0] : []
          return { type: "table", columns, rows } as QuestionContentBlock
        }
      } catch (err) {
        // Parsing error -> fallback to a simple text snippet
        return { type: "text", value: String(block.value) }
      }

      // Unknown/legacy types fallback to text
      return { type: "text", value: String(block.value) }
    })

    // Determine question type based on whether it has answer options
    const isFreeResponse = q.answers.length === 0
      
    const result: TestQuestion = {
      id: q.id,
      moduleId: String(q.module_number),
      questionNumber: q.question_number,
      questionText: q.content[0]?.value || "",
      contentColumns,
      content: contentBlocks,
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
