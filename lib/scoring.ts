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
  // Calculate per-module raw scores and per-module scaled scores
  // We'll use the provided module-level conversion tables for each module
  let readingWritingRaw = 0
  let mathRaw = 0
  let readingWritingScaled = 0
  let mathScaled = 0

  for (const module of modules) {
    const correctCount = module.questions.filter((q) => {
      const isFreeResponse = !q.options || q.options.length === 0
      return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse)
    }).length

    if (module.moduleType === "reading") {
      readingWritingRaw += correctCount
      // Convert this module's raw to scaled using the per-module table
      readingWritingScaled += getModuleScaledScore(module.moduleNumber, correctCount, 'reading')
    } else {
      mathRaw += correctCount
      mathScaled += getModuleScaledScore(module.moduleNumber, correctCount, 'math')
    }
  }

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

// Module-level conversion tables (per-user-provided arrays):
const readingAndWritingModule1Conversion: number[] = [
  100,100,120,140,160,170,180,190,200,200,210,210,220,230,240,260,270,290,310,320,340,360,370,390,410,430,440,460
]

const readingAndWritingModule2Conversion: number[] = [
  100,100,100,110,110,110,120,120,120,130,130,140,150,170,190,190,200,210,230,240,250,260,280,290,300,310,330,340
]

const mathModule1Conversion: number[] = [
  100,100,120,140,160,160,180,180,200,200,210,240,260,280,300,320,340,360,390,410,430,450,470
]

const mathModule2Conversion: number[] = [
  100,100,100,120,120,130,150,170,170,170,190,190,200,200,210,230,240,260,270,290,300,320,330
]

function clampToRange(raw: number, maxIndex: number): number {
  if (typeof raw !== 'number' || isNaN(raw) || raw <= 0) return 0
  const idx = Math.floor(raw)
  if (idx < 0) return 0
  if (idx > maxIndex) return maxIndex
  return idx
}

function getModuleScaledScore(moduleNumber: number, rawScore: number, section: 'reading' | 'math'): number {
  if (section === 'reading') {
    if (moduleNumber === 1) {
      const idx = clampToRange(rawScore, readingAndWritingModule1Conversion.length - 1)
      return readingAndWritingModule1Conversion[idx] ?? readingAndWritingModule1Conversion[0]
    } else if (moduleNumber === 2) {
      const idx = clampToRange(rawScore, readingAndWritingModule2Conversion.length - 1)
      return readingAndWritingModule2Conversion[idx] ?? readingAndWritingModule2Conversion[0]
    }
  } else if (section === 'math') {
    if (moduleNumber === 1) {
      const idx = clampToRange(rawScore, mathModule1Conversion.length - 1)
      return mathModule1Conversion[idx] ?? mathModule1Conversion[0]
    } else if (moduleNumber === 2) {
      const idx = clampToRange(rawScore, mathModule2Conversion.length - 1)
      return mathModule2Conversion[idx] ?? mathModule2Conversion[0]
    }
  }

  // Fallback: if we don't know the module, try to map section-level raw.
  return convertRawToScaledScore(rawScore, section)
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
