"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Clock, BookOpen, Calculator, Brain, ArrowRight, Home } from "lucide-react"
import { getCurrentUserId } from "@/lib/auth"
import { getQuestionsByModule } from "@/lib/supabase/questions"
import { getTestAttempt, createTestAttempt } from "@/lib/supabase/test-attempts"
import type { ModuleQuestion } from "@/types/db"

export default function ModuleIntroPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const moduleId = Number(params.id)
  const testId = parseInt(searchParams.get('testId') || '1', 10)
  const userId = getCurrentUserId()
  const [isStarting, setIsStarting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRWResults, setShowRWResults] = useState(false)

  const getModuleTitle = () => {
    switch (moduleId) {
      case 1:
        return "Reading & Writing"
      case 2:
        return "Reading & Writing"
      case 3:
        return "Mathematics"
      case 4:
        return "Mathematics"
      default:
        return "Test Module"
    }
  }

  const getModuleIcon = () => {
    switch (moduleId) {
      case 1:
      case 2:
        return <BookOpen className="h-6 w-6 text-primary" />
      case 3:
      case 4:
        return <Calculator className="h-6 w-6 text-primary" />
      default:
        return <BookOpen className="h-6 w-6 text-primary" />
    }
  }

  const getModuleTime = () => {
    return moduleId <= 2 ? "32 minutes" : "35 minutes"
  }

  const getQuestionCount = () => {
    return moduleId <= 2 ? 27 : 22
  }

  const getQuestionFormat = () => {
    if (moduleId <= 2) {
      return "Multiple Choice"
    } else {
      return "Multiple Choice & Fill-In"
    }
  }

  const getModuleDescription = () => {
    if (moduleId === 1) {
      return "This module tests your reading comprehension and writing skills. You'll answer questions about passages and evaluate writing choices."
    } else if (moduleId === 2) {
      return "This module continues to test your reading and writing skills with a variety of passages and questions."
    } else if (moduleId === 3) {
      return "This module tests your mathematical reasoning. You'll solve problems involving algebra, problem-solving, and data analysis."
    } else {
      return "This module continues to test your mathematical skills with a variety of problems."
    }
  }

  // Load questions and initialize module data
  useEffect(() => {
    loadModuleData()
  }, [moduleId, testId])

  const loadModuleData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // For module 3, check if modules 1 and 2 are completed
      if (moduleId === 3) {
        const { data: attempt } = await getTestAttempt(userId, testId)
        if (attempt && attempt.modules) {
          const hasModule1 = attempt.modules.module_1?.completed
          const hasModule2 = attempt.modules.module_2?.completed
          setShowRWResults(hasModule1 && hasModule2)
        }
      }

      // Get questions for this module
      const { data: questions, error: questionsError } = await getQuestionsByModule(testId, moduleId)
      
      if (questionsError) {
        setError("Failed to load questions")
        console.error("Error loading questions:", questionsError)
        return
      }

      if (!questions || questions.length === 0) {
        setError("No questions found for this module")
        return
      }

      // Initialize localStorage for this module with question data
      // Note: We don't create a test_attempt here - that only happens on first module submission
      const moduleKey = `test-${testId}-module-${moduleId}`
      const moduleData = {
        module_number: moduleId,
        questions: questions.map((q: any) => ({
          id: q.id,
          question_number: q.question_number,
          content: q.content, // Array of {type, value}
          answers: q.answers, // Array of {type, value}
          correct_answer: q.correct_answer,
          section: q.section,
          user_answer: null,
          time_spent: 0,
          status: 'UNANSWERED' as const,
          flagged: false
        })),
        completed: false,
        total_time: 0
      }

      localStorage.setItem(moduleKey, JSON.stringify(moduleData))

      setIsLoading(false)
    } catch (err) {
      console.error("Error in loadModuleData:", err)
      setError("An unexpected error occurred")
      setIsLoading(false)
    }
  }

  const handleBeginModule = () => {
    setIsStarting(true)

    // Initialize the module timer end time
    const moduleTime = moduleId <= 2 ? 32 * 60 : 35 * 60 // Time in seconds
    const startTime = Date.now()
    const endTime = startTime + moduleTime * 1000

    // Store the end time and start time
    const timerKey = `test-${testId}-module-${moduleId}-timer`
    localStorage.setItem(timerKey, JSON.stringify({ endTime, startTime }))

    // Navigate to the first question
    setTimeout(() => {
      router.push(`/test/module/${moduleId}?testId=${testId}&question=1`)
    }, 1000)
  }

  // Prevent browser navigation - enhanced version
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
      return ""
    }

    const handlePopState = (e: PopStateEvent) => {
      // Prevent navigation
      window.history.pushState(null, "", window.location.href)

      // Show toast - to show this we'd need to add useToast, which would require more changes
      // For simplicity, we'll just prevent the navigation without a toast
    }

    // Block keyboard shortcuts for navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Alt+Left, Alt+Right, Backspace (when not in input)
      if (
        (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) ||
        (e.key === "Backspace" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement))
      ) {
        e.preventDefault()
      }
    }

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)
    document.addEventListener("keydown", handleKeyDown)

    // Push current state to history stack several times to make it harder to go back
    for (let i = 0; i < 5; i++) {
      window.history.pushState(null, "", window.location.href)
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-8">
            <div className="text-2xl font-bold mb-2">Loading Module...</div>
            <p className="text-muted-foreground">Please wait while we prepare your test</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center border-destructive">
          <CardContent className="py-8">
            <div className="text-2xl font-bold mb-2 text-destructive">Error</div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push(`/test/new?testId=${testId}`)}>
              Return to Test Start
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-5xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {getModuleIcon()}
          </div>
          <CardTitle className="text-2xl">
            Module {moduleId}: {getModuleTitle()}
          </CardTitle>
          <CardDescription className="text-lg">Get ready for the next part of your SAT practice test</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 text-lg font-medium">Module Information</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col items-center rounded-lg border bg-background p-4 text-center">
                <Clock className="mb-2 h-6 w-6 text-primary" />
                <div className="text-sm font-medium">Time Allowed</div>
                <div className="text-lg font-bold">{getModuleTime()}</div>
              </div>
              <div className="flex flex-col items-center rounded-lg border bg-background p-4 text-center">
                <BookOpen className="mb-2 h-6 w-6 text-primary" />
                <div className="text-sm font-medium">Questions</div>
                <div className="text-lg font-bold">{getQuestionCount()}</div>
              </div>
              <div className="flex flex-col items-center rounded-lg border bg-background p-4 text-center">
                <Brain className="mb-2 h-6 w-6 text-primary" />
                <div className="text-sm font-medium">Question Format</div>
                <div className="text-lg font-bold">{getQuestionFormat()}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-2 text-lg font-medium">Module Description</h3>
            <p className="text-muted-foreground">{getModuleDescription()}</p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-2 text-lg font-medium">Instructions</h3>
            <ul className="ml-6 list-disc text-muted-foreground space-y-2">
              <li>
                You will have {getModuleTime()} to complete {getQuestionCount()} questions.
              </li>
              <li>The timer will start as soon as you click "Begin Module".</li>
              <li>You can flag questions to review later.</li>
              <li>You can navigate between questions using the Previous and Next buttons.</li>
              <li>You can review all questions before submitting the module.</li>
              {moduleId > 2 && <li>A calculator is available for this module.</li>}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            size="lg"
            onClick={() => router.push('/')}
            variant="outline"
            className="gap-2 bg-orange-400 hover:bg-orange-500 text-white border-orange-400 hover:border-orange-500"
          >
            <Home className="h-4 w-4" />
            Return to Dashboard
          </Button>
          
          {/* Module 3: Show R&W Results button if modules 1 and 2 are complete */}
          {moduleId === 3 && showRWResults && (
            <Button
              size="lg"
              onClick={() => router.push(`/test/results?testId=${testId}&section=rw`)}
              variant="outline"
              className="gap-2 bg-sky-500 hover:bg-sky-600 text-white border-sky-500 hover:border-sky-600"
            >
              Reading & Writing Results
            </Button>
          )}
          
          <Button
            size="lg"
            onClick={handleBeginModule}
            disabled={isStarting}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isStarting ? "Starting..." : "Begin Module"}
            {!isStarting && <ArrowRight className="h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
