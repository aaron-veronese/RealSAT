import type { CSVQuestion } from "./types"

// This function parses the raw CSV text into an array of CSVQuestion objects
export function parseCSV(csvText: string): CSVQuestion[] {
  // Split CSV into lines
  const lines = csvText.split("\n").filter((line) => line.trim() !== "")

  // Assume first line is header
  const header = lines[0].split(",")
  const questions: CSVQuestion[] = []

  // Process each line (skipping header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // Handle quoted fields with commas inside them
    const values = parseCSVLine(line)

    if (values.length >= 3) {
      // At minimum, we need question, correct answer, and difficulty
      const isMultipleChoice = values.length >= 6 // Question, 4 answers, correct answer, difficulty

      const question: CSVQuestion = {
        question: values[0].trim(),
        correctAnswer: values[isMultipleChoice ? 5 : 1].trim(),
        difficulty: values[isMultipleChoice ? 6 : 2].trim() as "easy" | "medium" | "hard",
      }

      // Add options for multiple choice questions
      if (isMultipleChoice) {
        question.answerA = values[1].trim()
        question.answerB = values[2].trim()
        question.answerC = values[3].trim()
        question.answerD = values[4].trim()
      }

      questions.push(question)
    }
  }

  return questions
}

// Helper function to properly parse CSV lines that might contain quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }

  // Add the last field
  result.push(current)

  return result
}

// Function to load questions from CSV files
export async function loadCSVQuestions(
  readingWritingCSVUrl: string,
  mathMultipleChoiceCSVUrl: string,
  mathFreeResponseCSVUrl: string,
) {
  try {
    // Fetch the CSV files
    const [readingWritingResponse, mathMultipleChoiceResponse, mathFreeResponseResponse] = await Promise.all([
      fetch(readingWritingCSVUrl),
      fetch(mathMultipleChoiceCSVUrl),
      fetch(mathFreeResponseCSVUrl),
    ])

    // Parse the CSV text
    const [readingWritingText, mathMultipleChoiceText, mathFreeResponseText] = await Promise.all([
      readingWritingResponse.text(),
      mathMultipleChoiceResponse.text(),
      mathFreeResponseResponse.text(),
    ])

    // Parse the CSVs into question objects
    return {
      readingWritingQuestions: parseCSV(readingWritingText),
      mathMultipleChoiceQuestions: parseCSV(mathMultipleChoiceText),
      mathFreeResponseQuestions: parseCSV(mathFreeResponseText),
    }
  } catch (error) {
    console.error("Error loading CSV questions:", error)
    // Return empty arrays as fallback
    return {
      readingWritingQuestions: [],
      mathMultipleChoiceQuestions: [],
      mathFreeResponseQuestions: [],
    }
  }
}
