import type { TestModule, TestScore } from "./types"

// Safe math expression evaluator for free response answers
function evaluateMathExpression(expression: string): number | null {
  try {
    // Remove whitespace
    const expr = expression.replace(/\s+/g, '')

    // Handle fractions like "30/20"
    if (expr.includes('/')) {
      const parts = expr.split('/')
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0])
        const denominator = parseFloat(parts[1])
        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          return numerator / denominator
        }
      }
      return null
    }

    // Handle basic decimal numbers
    const num = parseFloat(expr)
    return isNaN(num) ? null : num

  } catch {
    return null
  }
}

// Compare answers, handling mathematical evaluation for free response
function answersMatch(userAnswer: string, correctAnswer: string, isFreeResponse: boolean): boolean {
  if (!isFreeResponse) {
    // For multiple choice, exact string match
    return userAnswer === correctAnswer
  }

  // For free response, try mathematical evaluation
  const userValue = evaluateMathExpression(userAnswer)
  const correctValue = evaluateMathExpression(correctAnswer)

  if (userValue === null || correctValue === null) {
    // If evaluation fails, fall back to string comparison
    return userAnswer === correctAnswer
  }

  // Compare with small tolerance for floating point precision
  const tolerance = 0.0001
  return Math.abs(userValue - correctValue) < tolerance
}

export function calculateTestScore(modules: TestModule[]): TestScore {
  // Calculate raw scores for each section by summing correct answers from respective modules
  let readingWritingRaw = 0
  let mathRaw = 0

  for (const module of modules) {
    const correctCount = module.questions.filter((q) => {
      const isFreeResponse = !q.options || q.options.length === 0
      return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse)
    }).length

    if (module.moduleType === "reading") {
      readingWritingRaw += correctCount
    } else {
      mathRaw += correctCount
    }
  }

  // Convert raw scores to scaled scores using official Digital SAT conversion tables
  const readingWritingScaled = convertRawToScaledScore(readingWritingRaw, "reading")
  const mathScaled = convertRawToScaledScore(mathRaw, "math")

  const totalScore = roundToNearestTen(readingWritingScaled + mathScaled)

  return {
    total: totalScore,
    readingWriting: {
      rawScore: readingWritingRaw,
      scaledScore: readingWritingScaled,
    },
    math: {
      rawScore: mathRaw,
      scaledScore: mathScaled,
    },
  }
}

// Digital SAT Raw to Scaled Score Conversion Tables
// Based on College Board Digital SAT scoring charts

// Reading & Writing: 54 questions total (27 per module)
const readingWritingConversionTable: Record<number, number> = {
  54: 800, 53: 790, 52: 780, 51: 770, 50: 760, 49: 750, 48: 740, 47: 730, 46: 720, 45: 710,
  44: 700, 43: 690, 42: 680, 41: 670, 40: 660, 39: 650, 38: 640, 37: 630, 36: 620, 35: 610,
  34: 600, 33: 590, 32: 580, 31: 570, 30: 560, 29: 550, 28: 540, 27: 530, 26: 520, 25: 510,
  24: 500, 23: 490, 22: 480, 21: 470, 20: 460, 19: 450, 18: 440, 17: 430, 16: 420, 15: 410,
  14: 400, 13: 390, 12: 380, 11: 370, 10: 360, 9: 350, 8: 340, 7: 330, 6: 320, 5: 310,
  4: 300, 3: 290, 2: 280, 1: 270, 0: 200
}

// Math: 44 questions total (22 per module)
const mathConversionTable: Record<number, number> = {
  44: 800, 43: 790, 42: 780, 41: 770, 40: 760, 39: 750, 38: 740, 37: 730, 36: 720, 35: 710,
  34: 700, 33: 690, 32: 680, 31: 670, 30: 660, 29: 650, 28: 640, 27: 630, 26: 620, 25: 610,
  24: 600, 23: 590, 22: 580, 21: 570, 20: 560, 19: 550, 18: 540, 17: 530, 16: 520, 15: 510,
  14: 500, 13: 490, 12: 480, 11: 470, 10: 460, 9: 450, 8: 440, 7: 430, 6: 420, 5: 410,
  4: 400, 3: 390, 2: 380, 1: 370, 0: 200
}

function convertRawToScaledScore(rawScore: number, section: "reading" | "math"): number {
  if (section === "reading") {
    return readingWritingConversionTable[rawScore] || 200
  } else {
    return mathConversionTable[rawScore] || 200
  }
}

function roundToNearestTen(score: number): number {
  return Math.round(score / 10) * 10
}
