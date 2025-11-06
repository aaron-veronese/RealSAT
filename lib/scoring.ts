import type { TestModule, TestScore } from "./types"

export function calculateTestScore(modules: TestModule[]): TestScore {
  // Calculate raw scores for each section
  let readingWritingRaw = 0
  let mathRaw = 0

  // Count correct answers
  for (const module of modules) {
    const correctCount = module.questions.filter((q) => q.userAnswer === q.correctAnswer).length

    if (module.moduleType === "reading") {
      readingWritingRaw += correctCount
    } else {
      mathRaw += correctCount
    }
  }

  // Convert raw scores to scaled scores (200-800 for each section)
  // SAT scoring: raw score -> scaled score conversion
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

// Simple conversion from raw to scaled score
// This is a simplified approximation - real SAT uses more complex tables
function convertRawToScaledScore(rawScore: number, section: "reading" | "math"): number {
  const maxRaw = section === "reading" ? 54 : 44

  // Linear approximation: 200 + (rawScore / maxRaw) * 600
  const scaledScore = 200 + (rawScore / maxRaw) * 600
  return Math.round(scaledScore)
}

function roundToNearestTen(score: number): number {
  return Math.round(score / 10) * 10
}
