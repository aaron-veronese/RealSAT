import { test1Data } from "./question-data/test1"
import type { TestQuestion } from "./types"

export function generateModuleQuestions(
  moduleType: "reading" | "math",
  moduleNumber: number,
  count: number,
  usedQuestionIds: Set<string>,
  previousModuleQuestions?: TestQuestion[],
): TestQuestion[] {
  // Filter questions by module number from test1Data
  const availableQuestions = test1Data
    .filter((q) => q.module === moduleNumber)
    .map((q) => {
      // DEBUG: Log raw data for question 6
      if (test1Data.indexOf(q) + 1 === 6) {
        console.log("RAW Q6 content1:", q.content1)
        console.log("RAW Q6 answerC:", q.answerC)
      }

      // Combine all content fields into contentColumns array
      const contentColumns = [
        q.content1,
        q.content2,
        q.content3,
        q.content4,
        q.content5,
      ].filter((content) => content && String(content).trim() !== "")

      // Determine question type based on whether it has answer options
      const isFreeResponse = !q.answerA && !q.answerB && !q.answerC && !q.answerD
      
      const result = {
        id: `test1-m${q.module}-q${test1Data.indexOf(q) + 1}`,
        moduleId: String(q.module),
        questionNumber: test1Data.indexOf(q) + 1,
        questionText: q.content1 || "",
        contentColumns,
        questionType: isFreeResponse ? "free-response" : "multiple-choice",
        options: isFreeResponse
          ? []
          : [q.answerA, q.answerB, q.answerC, q.answerD]
              .filter((a) => a !== undefined && a !== null && String(a).trim() !== "")
              .map((a) => String(a)),
        correctAnswer: String(q.correctAnswer),
        userAnswer: "",
        difficulty: "medium",
        tags: [q.tag1, q.tag2, q.tag3, q.tag4].filter((t) => t && String(t).trim() !== ""),
      } as TestQuestion

      // DEBUG: Log transformed data
      if (result.questionNumber === 6) {
        console.log("TRANSFORMED Q6:", result)
      }

      return result
    })

  return availableQuestions.slice(0, count)
}
