"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Home } from "lucide-react"
import { calculateTestScore } from "@/lib/scoring"
import { RenderedContent } from "@/components/rendered-content"
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

  const requestVideo = () => {
    if (remainingVideos > 0) {
      setRemainingVideos(prev => prev - 1)
      alert("Video explanation requested! (This is a demo)")
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
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <span>SAT Mirror</span>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container py-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Results</h1>
            <p className="text-muted-foreground">
              Here's how you performed on your practice test!
            </p>
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

          {/* Question Review Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Question Review</h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
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
              >
                Correct
              </Button>
              <Button
                variant={selectedFilters.includes('incorrect') ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter('incorrect')}
              >
                Incorrect
              </Button>
              <Button
                variant={selectedFilters.includes('unanswered') ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter('unanswered')}
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

            {/* Questions List */}
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
                                question.isUnanswered ? 'bg-gray-100 text-gray-800' :
                                question.isCorrect ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                              }`}>
                                {question.isUnanswered ? 'Unanswered' :
                                 question.isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                              <CardTitle className="text-lg">
                                Question {question.questionNumber}
                              </CardTitle>
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
                                          isCorrectChoice ? 'border-blue-500 bg-blue-50' :
                                          isUserChoice && !isCorrectChoice ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                                        }`}
                                      >
                                        <span className="font-medium">
                                          {optionLetter}.{'  '}
                                          <span className={
                                            isCorrectChoice ? 'text-blue-700' :
                                            isUserChoice && !isCorrectChoice ? 'text-orange-700' : 'text-gray-700'
                                          }>
                                            <RenderedContent content={option} testNumber={1} />
                                          </span>
                                        </span>
                                        {isCorrectChoice && isUserChoice && <span className="ml-2 text-blue-600 text-sm">(Your Choice - Correct)</span>}
                                        {isCorrectChoice && !isUserChoice && <span className="ml-2 text-blue-600 text-sm">(Correct)</span>}
                                        {isUserChoice && !isCorrectChoice && <span className="ml-2 text-orange-600 text-sm">(Your Choice - Incorrect)</span>}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                              {/* Free Response Answer */}
                              {question.questionType === 'free-response' && (
                                <div className="space-y-2">
                                  <div className={`p-3 rounded border ${
                                    question.isCorrect ? 'border-blue-500 bg-blue-50' : 'border-orange-500 bg-orange-50'
                                  }`}>
                                    <div className="font-medium mb-2">Your Answer:</div>
                                    <div className={
                                      question.isCorrect ? 'text-blue-700' : 'text-orange-700'
                                    }>
                                      {question.userAnswer || 'No answer provided'}
                                    </div>
                                    {question.isCorrect && <span className="ml-2 text-blue-600 text-sm">(Correct)</span>}
                                  </div>
                                  <div className="p-3 rounded border border-blue-500 bg-blue-50">
                                    <div className="font-medium mb-2">Correct Answer:</div>
                                    <div className="text-blue-700">
                                      {question.correctAnswer}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={requestVideo}
                                  disabled={remainingVideos === 0}
                                >
                                  Request Video Explanation ({remainingVideos}/5 free)
                                </Button>
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
    </div>
  )
}
