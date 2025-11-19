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

// NOTE: We removed the legacy section-level conversion tables that mapped
// total raw scores across both modules to scaled scores. We only use
// per-module conversion arrays below to convert a module's raw score to
// a per-module scaled score. This preserves per-module scoring as requested.

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
    }
    // default to module 2 mapping if moduleNumber === 2; otherwise, default to module 1 mapping
    const idx2 = clampToRange(rawScore, readingAndWritingModule2Conversion.length - 1)
    return (moduleNumber === 2 ? readingAndWritingModule2Conversion[idx2] : readingAndWritingModule1Conversion[idx2]) ?? readingAndWritingModule1Conversion[0]
  } else if (section === 'math') {
    if (moduleNumber === 1) {
      const idx = clampToRange(rawScore, mathModule1Conversion.length - 1)
      return mathModule1Conversion[idx] ?? mathModule1Conversion[0]
    }
    const idx2 = clampToRange(rawScore, mathModule2Conversion.length - 1)
    return (moduleNumber === 2 ? mathModule2Conversion[idx2] : mathModule1Conversion[idx2]) ?? mathModule1Conversion[0]
  }

  // This should never happen; as a last resort, return 0
  return 0
}



function roundToNearestTen(score: number): number {
  return Math.round(score / 10) * 10
}
