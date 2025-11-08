"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowRight, Home, Gem } from "lucide-react"
import { calculateTestScore } from "@/lib/scoring"
import { RenderedContent } from "@/components/rendered-content"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Test, TestModule, TestScore } from "@/lib/types"

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

// Format time in seconds to MM:SS format
function formatTimeSpent(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function TestResultsPage() {
  const [testScore, setTestScore] = useState<TestScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [modules, setModules] = useState<TestModule[]>([])

  // Animation states
  const [animatedTotal, setAnimatedTotal] = useState(0)
  const [animatedReading, setAnimatedReading] = useState(0)
  const [animatedMath, setAnimatedMath] = useState(0)
  const [animatedModuleScores, setAnimatedModuleScores] = useState([0, 0, 0, 0])
  const [animatedProgressBars, setAnimatedProgressBars] = useState([0, 0, 0, 0])
  const [animatedReadingDash, setAnimatedReadingDash] = useState(0)
  const [animatedMathDash, setAnimatedMathDash] = useState(0)

  const [remainingVideos, setRemainingVideos] = useState(5)
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['all'])
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [requestedVideos, setRequestedVideos] = useState<Map<string, 'pending' | 'available'>>(new Map())
  const [timeSortOrder, setTimeSortOrder] = useState<'desc' | 'asc' | 'none'>('none')
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboardSort, setLeaderboardSort] = useState<{column: string, direction: 'asc' | 'desc'}>({column: 'totalScore', direction: 'desc'})
  const [scoreSubmitted, setScoreSubmitted] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  // Mock leaderboard data for this test
  const mockLeaderboardData = [
    {
      id: "user-1",
      name: "SATMaster2024",
      score: 1580,
      readingScore: 790,
      mathScore: 790,
      timeSpent: 3420, // seconds
      module1: 26,
      module2: 25,
      module3: 21,
      module4: 20,
      isCurrentUser: false,
    },
    {
      id: "user-2",
      name: "MathWhiz",
      score: 1520,
      readingScore: 760,
      mathScore: 760,
      timeSpent: 3150,
      module1: 25,
      module2: 24,
      module3: 20,
      module4: 19,
      isCurrentUser: false,
    },
    {
      id: "user-3",
      name: "ReadingPro",
      score: 1490,
      readingScore: 780,
      mathScore: 710,
      timeSpent: 2980,
      module1: 26,
      module2: 23,
      module3: 19,
      module4: 18,
      isCurrentUser: false,
    },
    {
      id: "user-4",
      name: "TestTaker",
      score: 1450,
      readingScore: 720,
      mathScore: 730,
      timeSpent: 3240,
      module1: 24,
      module2: 22,
      module3: 20,
      module4: 19,
      isCurrentUser: false,
    },
    {
      id: "user-5",
      name: "StudyHard",
      score: 1420,
      readingScore: 710,
      mathScore: 710,
      timeSpent: 3120,
      module1: 23,
      module2: 21,
      module3: 19,
      module4: 18,
      isCurrentUser: false,
    },
    {
      id: "user-6",
      name: "Brainiac",
      score: 1400,
      readingScore: 700,
      mathScore: 700,
      timeSpent: 3300,
      module1: 22,
      module2: 20,
      module3: 18,
      module4: 17,
      isCurrentUser: false,
    },
    {
      id: "user-7",
      name: "Scholar",
      score: 1380,
      readingScore: 690,
      mathScore: 690,
      timeSpent: 3180,
      module1: 21,
      module2: 19,
      module3: 17,
      module4: 16,
      isCurrentUser: false,
    },
    {
      id: "user-8",
      name: "AceStudent",
      score: 1360,
      readingScore: 680,
      mathScore: 680,
      timeSpent: 3360,
      module1: 20,
      module2: 18,
      module3: 16,
      module4: 15,
      isCurrentUser: false,
    },
    {
      id: "user-9",
      name: "TopScorer",
      score: 1340,
      readingScore: 670,
      mathScore: 670,
      timeSpent: 3240,
      module1: 19,
      module2: 17,
      module3: 15,
      module4: 14,
      isCurrentUser: false,
    },
    {
      id: "user-10",
      name: "ElitePrep",
      score: 1320,
      readingScore: 660,
      mathScore: 660,
      timeSpent: 3420,
      module1: 18,
      module2: 16,
      module3: 14,
      module4: 13,
      isCurrentUser: false,
    },
    {
      id: "user-11",
      name: "PrepMaster",
      score: 1300,
      readingScore: 650,
      mathScore: 650,
      timeSpent: 3300,
      module1: 17,
      module2: 15,
      module3: 13,
      module4: 12,
      isCurrentUser: false,
    },
    {
      id: "user-12",
      name: "SATWizard",
      score: 1280,
      readingScore: 640,
      mathScore: 640,
      timeSpent: 3180,
      module1: 16,
      module2: 14,
      module3: 12,
      module4: 11,
      isCurrentUser: false,
    },
    {
      id: "user-13",
      name: "ScoreBooster",
      score: 1260,
      readingScore: 630,
      mathScore: 630,
      timeSpent: 3360,
      module1: 15,
      module2: 13,
      module3: 11,
      module4: 10,
      isCurrentUser: false,
    },
    {
      id: "user-14",
      name: "TestAce",
      score: 1240,
      readingScore: 620,
      mathScore: 620,
      timeSpent: 3240,
      module1: 14,
      module2: 12,
      module3: 10,
      module4: 9,
      isCurrentUser: false,
    },
    {
      id: "user-15",
      name: "BrainPower",
      score: 1220,
      readingScore: 610,
      mathScore: 610,
      timeSpent: 3420,
      module1: 13,
      module2: 11,
      module3: 9,
      module4: 8,
      isCurrentUser: false,
    },
    {
      id: "user-16",
      name: "StudyChamp",
      score: 1200,
      readingScore: 600,
      mathScore: 600,
      timeSpent: 3300,
      module1: 12,
      module2: 10,
      module3: 8,
      module4: 7,
      isCurrentUser: false,
    },
    {
      id: "user-17",
      name: "PrepPro",
      score: 1180,
      readingScore: 590,
      mathScore: 590,
      timeSpent: 3180,
      module1: 11,
      module2: 9,
      module3: 7,
      module4: 6,
      isCurrentUser: false,
    },
    {
      id: "user-18",
      name: "SATKing",
      score: 1160,
      readingScore: 580,
      mathScore: 580,
      timeSpent: 3360,
      module1: 10,
      module2: 8,
      module3: 6,
      module4: 5,
      isCurrentUser: false,
    },
    {
      id: "user-19",
      name: "TestHero",
      score: 1140,
      readingScore: 570,
      mathScore: 570,
      timeSpent: 3240,
      module1: 9,
      module2: 7,
      module3: 5,
      module4: 4,
      isCurrentUser: false,
    },
    {
      id: "user-20",
      name: "ScoreMaster",
      score: 1120,
      readingScore: 560,
      mathScore: 560,
      timeSpent: 3420,
      module1: 8,
      module2: 6,
      module3: 4,
      module4: 3,
      isCurrentUser: false,
    },
  ]

  // Current user's data (would come from actual test results)
  const currentUserData = testScore ? {
    id: "current-user",
    name: "You",
    score: testScore.total,
    readingScore: testScore.readingWriting.scaledScore,
    mathScore: testScore.math.scaledScore,
    timeSpent: modules.reduce((total, module) => 
      total + module.questions.reduce((moduleTotal, q) => moduleTotal + (q.timeSpent || 0), 0), 0
    ),
    module1: modules.find(m => m.moduleNumber === 1)?.questions.filter(q => {
      const isFreeResponse = !q.options || q.options.length === 0
      return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse)
    }).length || 0,
    module2: modules.find(m => m.moduleNumber === 2)?.questions.filter(q => {
      const isFreeResponse = !q.options || q.options.length === 0
      return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse)
    }).length || 0,
    module3: modules.find(m => m.moduleNumber === 3)?.questions.filter(q => {
      const isFreeResponse = !q.options || q.options.length === 0
      return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse)
    }).length || 0,
    module4: modules.find(m => m.moduleNumber === 4)?.questions.filter(q => {
      const isFreeResponse = !q.options || q.options.length === 0
      return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse)
    }).length || 0,
    isCurrentUser: true,
  } : null

  // Calculate ranks based on current sort column and direction
  const sortedForRanking = currentUserData ?
    [...mockLeaderboardData, currentUserData].sort((a, b) => {
      const aVal = a[leaderboardSort.column as keyof typeof a] as number
      const bVal = b[leaderboardSort.column as keyof typeof b] as number
      return leaderboardSort.direction === 'desc' ? bVal - aVal : aVal - bVal
    }) : mockLeaderboardData.sort((a, b) => {
      const aVal = a[leaderboardSort.column as keyof typeof a] as number
      const bVal = b[leaderboardSort.column as keyof typeof b] as number
      return leaderboardSort.direction === 'desc' ? bVal - aVal : aVal - bVal
    })

  const rankMap = new Map(sortedForRanking.map((entry, index) => {
    // For ascending sort, reverse the rank order so lowest values get highest rank numbers
    const rank = leaderboardSort.direction === 'asc' ? sortedForRanking.length - index : index + 1
    return [entry.id, rank]
  }))

  // Prepare leaderboard display data
  const top7Entries = sortedForRanking.slice(0, 7)
  const currentUserEntry = currentUserData ? sortedForRanking.find(entry => entry.id === 'current-user') : null
  const currentUserRank = currentUserEntry ? rankMap.get('current-user') || 0 : 0
  const isCurrentUserInTop7 = currentUserRank <= 7

  // If current user is in top 7 or not showing preview, just show top 7
  // If current user is below top 7 and showing preview, show top 7 + current user at bottom
  const leaderboardData = (!currentUserEntry || isCurrentUserInTop7 || !scoreSubmitted) ?
    top7Entries.map(entry => ({
      ...entry,
      rank: rankMap.get(entry.id) || (rankMap.size + 1),
      isPreview: !scoreSubmitted && entry.id === 'current-user'
    })) :
    top7Entries.map(entry => ({
      ...entry,
      rank: rankMap.get(entry.id) || (rankMap.size + 1),
      isPreview: false
    }))
  const handleLeaderboardSort = (column: string) => {
    setLeaderboardSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const handleSubmitScore = () => {
    setScoreSubmitted(true)
    setShowSubmitDialog(false)
    // In a real app, this would send the score to a backend
  }

  const handleShowSubmitDialog = () => {
    setShowSubmitDialog(true)
  }

  useEffect(() => {
    // Clear the test-in-progress flag when viewing results
    sessionStorage.removeItem("test-in-progress")

    // Calculate the test score based on the completed modules
    const calculateScore = () => {
      // In a real app, we would load the test data from a database
      // For this demo, we'll create a mock test with the modules from session storage
      const mockTest: Test = {
        id: "test-1",
        startedAt: new Date(),
        modules: [],
      }

      // Try to reconstruct the modules from session storage
      const modules: TestModule[] = []

      for (let i = 1; i <= 4; i++) {
        const moduleQuestions = sessionStorage.getItem(`module-${i}-questions`)
        if (moduleQuestions) {
          const questions = JSON.parse(moduleQuestions)
          modules.push({
            id: `module-${i}`,
            testId: mockTest.id,
            moduleNumber: i,
            moduleType: i <= 2 ? "reading" : "math",
            isAdaptive: i === 2 || i === 4,
            startedAt: new Date(),
            completedAt: new Date(),
            questions,
          })
        }
      }

      // If we have modules, calculate the score
      if (modules.length > 0) {
        mockTest.modules = modules
        const score = calculateTestScore(modules)
        setTestScore(score)
        setModules(modules) // Set modules to state

        // Log time spent per question
        modules.forEach(module => {
          console.log(`Module ${module.moduleNumber} questions time spent:`)
          module.questions.forEach(q => {
            console.log(`Question ${q.questionNumber}: ${q.timeSpent || 0} seconds`)
          })
        })

        // Calculate individual module raw scores
        const moduleRawScores = [
          modules.find(m => m.moduleNumber === 1)?.questions.filter(q => {
            const isFreeResponse = !q.options || q.options.length === 0
            return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse)
          }).length || 0,
          modules.find(m => m.moduleNumber === 2)?.questions.filter(q => {
            const isFreeResponse = !q.options || q.options.length === 0
            return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse)
          }).length || 0,
          modules.find(m => m.moduleNumber === 3)?.questions.filter(q => {
            const isFreeResponse = !q.options || q.options.length === 0
            return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse)
          }).length || 0,
          modules.find(m => m.moduleNumber === 4)?.questions.filter(q => {
            const isFreeResponse = !q.options || q.options.length === 0
            return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse)
          }).length || 0
        ]

        // Start animations
        animateScores(score, moduleRawScores)
      }

      setIsLoading(false)

      // Clean up any other test-related session storage items
      for (let i = 1; i <= 4; i++) {
        sessionStorage.removeItem(`module-${i}-timer-end`)
        // Don't remove the questions as we need them for the results page
        // sessionStorage.removeItem(`module-${i}-questions`)
      }
    }

    calculateScore()
  }, [])

  // Animation function
  const animateScores = (score: TestScore, rawScores: number[]) => {
    const duration = 1500 // 1 second
    const steps = 200
    const incrementTotal = score.total / steps
    const incrementReading = score.readingWriting.scaledScore / steps
    const incrementMath = score.math.scaledScore / steps
    const incrementModules = rawScores.map(s => s / steps)
    const incrementProgressBars = rawScores.map(s => s / steps) // Same as modules for now
    const incrementReadingDash = ((score.readingWriting.scaledScore / 1600) * 251.2) / steps
    const incrementMathDash = ((score.math.scaledScore / 1600) * 251.2) / steps

    let current = 0
    const timer = setInterval(() => {
      current++
      setAnimatedTotal(Math.floor(current * incrementTotal))
      setAnimatedReading(Math.floor(current * incrementReading))
      setAnimatedMath(Math.floor(current * incrementMath))
      setAnimatedModuleScores(incrementModules.map((inc, i) => current * inc))
      setAnimatedProgressBars(incrementProgressBars.map((inc, i) => current * inc))
      setAnimatedReadingDash(current * incrementReadingDash)
      setAnimatedMathDash(current * incrementMathDash)

      if (current >= steps) {
        setAnimatedTotal(score.total)
        setAnimatedReading(score.readingWriting.scaledScore)
        setAnimatedMath(score.math.scaledScore)
        setAnimatedModuleScores(rawScores)
        setAnimatedProgressBars(rawScores)
        setAnimatedReadingDash((score.readingWriting.scaledScore / 1600) * 251.2)
        setAnimatedMathDash((score.math.scaledScore / 1600) * 251.2)
        clearInterval(timer)
      }
    }, duration / steps)
  }

  // Get all questions with their module info
  const allQuestions = modules.flatMap(module =>
    module.questions.map((q, qIndex) => {
      const isFreeResponse = !q.options || q.options.length === 0
      return {
        ...q,
        moduleNumber: module.moduleNumber,
        moduleType: module.moduleType,
        isCorrect: answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse),
        isUnanswered: !q.userAnswer || q.userAnswer.trim() === '',
        questionNumber: qIndex + 1,
      }
    })
  )

  // Filter questions
  const filteredQuestions = allQuestions.filter(question => {
    if (selectedFilters.includes('all')) return true

    return selectedFilters.every(filter => {
      switch (filter) {
        case 'correct':
          return question.isCorrect
        case 'incorrect':
          return !question.isCorrect && !question.isUnanswered
        case 'unanswered':
          return question.isUnanswered
        case 'reading':
          return question.moduleType === 'reading'
        case 'math':
          return question.moduleType === 'math'
        default:
          return false
      }
    })
  }).sort((a, b) => {
    if (timeSortOrder === 'none') return 0
    const aTime = a.timeSpent || 0
    const bTime = b.timeSpent || 0
    if (timeSortOrder === 'desc') {
      return bTime - aTime
    } else {
      return aTime - bTime
    }
  })

  const toggleFilter = (filter: string) => {
    if (filter === 'all') {
      setSelectedFilters(['all'])
    } else {
      setSelectedFilters(prev => {
        let newFilters = [...prev.filter(f => f !== 'all')]
        if (newFilters.includes(filter)) {
          newFilters = newFilters.filter(f => f !== filter)
        } else {
          // Remove conflicting filters
          const conflicts: Record<string, string[]> = {
            correct: ['incorrect', 'unanswered'],
            incorrect: ['correct', 'unanswered'],
            unanswered: ['correct', 'incorrect'],
            reading: ['math'],
            math: ['reading'],
          }
          newFilters = newFilters.filter(f => !conflicts[filter].includes(f))
          newFilters.push(filter)
        }
        return newFilters.length === 0 ? ['all'] : newFilters
      })
    }
  }

  const toggleTimeSort = () => {
    setTimeSortOrder(prev => {
      if (prev === 'none') return 'desc'
      if (prev === 'desc') return 'asc'
      return 'none'
    })
  }

  // Group questions by module
  const groupedQuestions = filteredQuestions.reduce((groups, question) => {
    const key = `${question.moduleType}-${question.moduleNumber}`
    if (!groups[key]) {
      groups[key] = {
        moduleType: question.moduleType,
        moduleNumber: question.moduleNumber,
        questions: []
      }
    }
    groups[key].questions.push(question)
    return groups
  }, {} as Record<string, { moduleType: string, moduleNumber: number, questions: typeof filteredQuestions }>)

  const sortedGroups = Object.values(groupedQuestions).sort((a, b) => {
    if (a.moduleType !== b.moduleType) {
      return a.moduleType === 'reading' ? -1 : 1
    }
    return a.moduleNumber - b.moduleNumber
  })

  const toggleExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
  }

  const requestVideo = (questionId: string) => {
    if (requestedVideos.has(questionId)) return

    if (remainingVideos > 0) {
      setRemainingVideos(prev => prev - 1)
      setRequestedVideos(prev => new Map(prev).set(questionId, 'pending'))

      // Simulate video becoming available after 2 seconds
      setTimeout(() => {
        setRequestedVideos(prev => new Map(prev).set(questionId, 'available'))
      }, 2000)
    } else {
      alert("No free videos remaining.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Calculating your score...</h1>
          <p className="text-muted-foreground">Please wait while we process your test results.</p>
        </div>
      </div>
    )
  }

  if (!testScore) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No test data found</h1>
          <p className="text-muted-foreground mb-4">We couldn't find any completed test data.</p>
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <span>SAT Mirror</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Results</h1>
              <p className="text-muted-foreground">
                Here's how you performed on your practice test!
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="gap-2"
            >
              {showLeaderboard ? 'Hide Leaderboard' : 'View Leaderboard'}
            </Button>
          </div>

          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Grey background for incorrect */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  {/* Reading slice */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    strokeDasharray={`${animatedReadingDash} 251.2`}
                    strokeDashoffset="0"
                  />
                  {/* Math slice */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="8"
                    strokeDasharray={`${animatedMathDash} 251.2`}
                    strokeDashoffset={`${-animatedReadingDash}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold">{animatedTotal}</div>
                    <div className="text-sm text-muted-foreground">Total Score</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Reading & Writing Section */}
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {animatedReading}
                      <span className="text-lg text-muted-foreground">/800</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Reading & Writing</p>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Module 1</span>
                        <span className="font-bold">{Math.round(animatedModuleScores[0])}/27</span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500" style={{ width: `${(animatedProgressBars[0] / 27) * 100}%` }}></div>
                        <div className="bg-gray-200 flex-1"></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Module 2</span>
                        <span className="font-bold">{Math.round(animatedModuleScores[1])}/27</span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500" style={{ width: `${(animatedProgressBars[1] / 27) * 100}%` }}></div>
                        <div className="bg-gray-200 flex-1"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Math Section */}
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {animatedMath}
                      <span className="text-lg text-muted-foreground">/800</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Mathematics</p>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Module 3</span>
                        <span className="font-bold">{Math.round(animatedModuleScores[2])}/22</span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden">
                        <div className="bg-orange-400" style={{ width: `${(animatedProgressBars[2] / 22) * 100}%` }}></div>
                        <div className="bg-gray-200 flex-1"></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Module 4</span>
                        <span className="font-bold">{Math.round(animatedModuleScores[3])}/22</span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden">
                        <div className="bg-orange-400" style={{ width: `${(animatedProgressBars[3] / 22) * 100}%` }}></div>
                        <div className="bg-gray-200 flex-1"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {showLeaderboard && (
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Leaderboard</CardTitle>
                  {!scoreSubmitted && currentUserData && (
                    <Button
                      onClick={handleShowSubmitDialog}
                      size="sm"
                    >
                      Submit Score
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          Rank
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleLeaderboardSort('score')}
                        >
                          Total Score {leaderboardSort.column === 'score' && (leaderboardSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleLeaderboardSort('readingScore')}
                        >
                          Reading {leaderboardSort.column === 'readingScore' && (leaderboardSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleLeaderboardSort('mathScore')}
                        >
                          Math {leaderboardSort.column === 'mathScore' && (leaderboardSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleLeaderboardSort('module1')}
                        >
                          1 {leaderboardSort.column === 'module1' && (leaderboardSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleLeaderboardSort('module2')}
                        >
                          2 {leaderboardSort.column === 'module2' && (leaderboardSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleLeaderboardSort('module3')}
                        >
                          3 {leaderboardSort.column === 'module3' && (leaderboardSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleLeaderboardSort('module4')}
                        >
                          4 {leaderboardSort.column === 'module4' && (leaderboardSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleLeaderboardSort('timeSpent')}
                        >
                          Time {leaderboardSort.column === 'timeSpent' && (leaderboardSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboardData.map((entry, index) => (
                        <TableRow
                          key={entry.id}
                          className={entry.isCurrentUser ? 'bg-primary/5 border-primary/20' : entry.isPreview ? 'bg-muted/30 border-dashed border-muted-foreground/30' : ''}
                        >
                          <TableCell className="font-medium">{entry.rank}</TableCell>
                          <TableCell className="font-medium">
                            {entry.name}
                            {entry.isCurrentUser && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                You
                              </Badge>
                            )}
                            {entry.isPreview && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Preview
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{entry.score}</TableCell>
                          <TableCell className="text-right">{entry.readingScore}</TableCell>
                          <TableCell className="text-right">{entry.mathScore}</TableCell>
                          <TableCell className="text-right">{entry.module1}/27</TableCell>
                          <TableCell className="text-right">{entry.module2}/27</TableCell>
                          <TableCell className="text-right">{entry.module3}/22</TableCell>
                          <TableCell className="text-right">{entry.module4}/22</TableCell>
                          <TableCell className="text-right">{formatTimeSpent(entry.timeSpent)}</TableCell>
                        </TableRow>
                      ))}
                      {/* Show separator and current user entry when they're below top 7 */}
                      {!isCurrentUserInTop7 && currentUserEntry && scoreSubmitted && (
                        <>
                          <TableRow>
                            <TableCell colSpan={10} className="text-center py-2">
                              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                                <div className="flex-1 h-px bg-border"></div>
                                <span>Your Rank</span>
                                <div className="flex-1 h-px bg-border"></div>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow className="bg-primary/5 border-primary/20">
                            <TableCell className="font-medium">{currentUserRank}</TableCell>
                            <TableCell className="font-medium">
                              {currentUserEntry.name}
                              <Badge variant="secondary" className="ml-2 text-xs">
                                You
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{currentUserEntry.score}</TableCell>
                            <TableCell className="text-right">{currentUserEntry.readingScore}</TableCell>
                            <TableCell className="text-right">{currentUserEntry.mathScore}</TableCell>
                            <TableCell className="text-right">{currentUserEntry.module1}/27</TableCell>
                            <TableCell className="text-right">{currentUserEntry.module2}/27</TableCell>
                            <TableCell className="text-right">{currentUserEntry.module3}/22</TableCell>
                            <TableCell className="text-right">{currentUserEntry.module4}/22</TableCell>
                            <TableCell className="text-right">{formatTimeSpent(currentUserEntry.timeSpent)}</TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Review Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Question Review</h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedFilters.includes('all') ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedFilters.includes('correct') ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('correct')}
                  className={selectedFilters.includes('correct') ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : ""}
                >
                  Correct
                </Button>
                <Button
                  variant={selectedFilters.includes('incorrect') ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('incorrect')}
                  className={selectedFilters.includes('incorrect') ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" : ""}
                >
                  Incorrect
                </Button>
                <Button
                  variant={selectedFilters.includes('unanswered') ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('unanswered')}
                  className={selectedFilters.includes('unanswered') ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" : ""}
                >
                  Unanswered
                </Button>
                <Button
                  variant={selectedFilters.includes('reading') ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('reading')}
                >
                  Reading & Writing
                </Button>
                <Button
                  variant={selectedFilters.includes('math') ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('math')}
                >
                  Math
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTimeSort}
                className="gap-1"
              >
                Time Spent
                {timeSortOrder === 'desc' && <span className="text-xs">▼</span>}
                {timeSortOrder === 'asc' && <span className="text-xs">▲</span>}
              </Button>
            </div>            {/* Questions List */}
            <div className="space-y-8">
              {sortedGroups.map(group => (
                <div key={`${group.moduleType}-${group.moduleNumber}`}>
                  <h3 className="text-xl font-semibold mb-4">
                    {group.moduleType === 'reading' ? 'Reading & Writing' : 'Mathematics'} - Module {group.moduleNumber}
                  </h3>
                  <div className="space-y-4">
                    {group.questions.map((question, index) => (
                      <Card key={question.id || index} className="overflow-hidden">
                        <CardHeader 
                          className="pb-3 cursor-pointer" 
                          onClick={() => toggleExpanded(question.id || index.toString())}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                question.isUnanswered ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                                question.isCorrect ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              }`}>
                                {question.isUnanswered ? 'Unanswered' :
                                 question.isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                              <CardTitle className="text-lg">
                                Question {question.questionNumber}
                              </CardTitle>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTimeSpent(question.timeSpent || 0)}
                            </div>
                          </div>
                        </CardHeader>
                        {expandedQuestions.has(question.id || index.toString()) && (
                          <CardContent>
                            <div className="space-y-4">
                              <div className="text-base mb-4">
                                {question.contentColumns?.map((content, idx) => 
                                  content ? (
                                    <div key={idx} className={idx > 0 ? "mt-4" : ""}>
                                      <RenderedContent content={content} testNumber={1} />
                                    </div>
                                  ) : null
                                )}
                              </div>
                              {/* Question Options */}
                              {question.questionType === 'multiple-choice' && question.options && question.options.length > 0 && (
                                <div className="space-y-2">
                                  {question.options.map((option, optIndex) => {
                                    const optionLetter = String.fromCharCode(65 + optIndex)
                                    const isUserChoice = question.userAnswer === optionLetter
                                    const correctAnswerIndex = question.correctAnswer.charCodeAt(0) - 65 // Convert A=0, B=1, etc.
                                    const isCorrectChoice = optIndex === correctAnswerIndex
                                    return (
                                      <div
                                        key={optIndex}
                                        className={`p-3 rounded border ${
                                          isCorrectChoice ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950' :
                                          isUserChoice && !isCorrectChoice ? 'border-orange-500 bg-orange-50 dark:border-orange-400 dark:bg-orange-950' : 'border-gray-200 dark:border-gray-600'
                                        }`}
                                      >
                                        <span className="font-medium">
                                          {optionLetter}.{'  '}
                                          <span className={
                                            isCorrectChoice ? 'text-blue-700 dark:text-blue-300' :
                                            isUserChoice && !isCorrectChoice ? 'text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-300'
                                          }>
                                            <RenderedContent content={option} testNumber={1} />
                                          </span>
                                        </span>
                                        {isCorrectChoice && isUserChoice && <span className="ml-2 text-blue-600 dark:text-blue-400 text-sm">(Your Choice - Correct)</span>}
                                        {isCorrectChoice && !isUserChoice && <span className="ml-2 text-blue-600 dark:text-blue-400 text-sm">(Correct)</span>}
                                        {isUserChoice && !isCorrectChoice && <span className="ml-2 text-orange-600 dark:text-orange-400 text-sm">(Your Choice - Incorrect)</span>}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                              {/* Free Response Answer */}
                              {question.questionType === 'free-response' && (
                                <div className="space-y-2">
                                  <div className={`p-3 rounded border ${
                                    question.isCorrect ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950' : 'border-orange-500 bg-orange-50 dark:border-orange-400 dark:bg-orange-950'
                                  }`}>
                                    <div className="font-medium mb-2">Your Answer:</div>
                                    <div className={
                                      question.isCorrect ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'
                                    }>
                                      {question.userAnswer || 'No answer provided'}
                                    </div>
                                    {question.isCorrect && <span className="ml-2 text-blue-600 dark:text-blue-400 text-sm">(Correct)</span>}
                                  </div>
                                  <div className="p-3 rounded border border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950">
                                    <div className="font-medium mb-2">Correct Answer:</div>
                                    <div className="text-blue-700 dark:text-blue-300">
                                      {question.correctAnswer}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="flex justify-end">
                                {(() => {
                                  const videoStatus = requestedVideos.get(question.id || index.toString())
                                  if (videoStatus === 'available') {
                                    return (
                                      <div className="w-full">
                                        <div className="bg-gray-100 p-4 rounded border">
                                          <p className="text-sm font-medium mb-2">Video Explanation</p>
                                          <div className="aspect-video bg-gray-200 rounded flex items-center justify-center">
                                            <p className="text-gray-500">Video player would appear here</p>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  } else if (videoStatus === 'pending') {
                                    return (
                                      <Button variant="outline" size="sm" disabled>
                                        Video explanation pending
                                      </Button>
                                    )
                                  } else {
                                    return (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => requestVideo(question.id || index.toString())}
                                        disabled={remainingVideos === 0}
                                      >
                                        {remainingVideos === 0 ? (
                                          <>
                                            Request Video Explanation ( 20<Gem className="h-4 w-4 text-orange-500"/>)
                                          </>
                                        ) : (
                                          `Request Video Explanation (${remainingVideos} Remaining)`
                                        )}
                                      </Button>
                                    )
                                  }
                                })()}
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Score Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your score to the public leaderboard? 
              Once submitted, your performance will be visible to other users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitScore}>
              Submit Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
