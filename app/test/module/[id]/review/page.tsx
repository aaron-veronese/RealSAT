"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Flag, AlertCircle, ChevronRight } from "lucide-react"
import type { TestQuestion } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ModuleReviewPage() {
  const params = useParams()
  const router = useRouter()
  const moduleId = Number(params.id)

  const [questions, setQuestions] = useState<(TestQuestion & { flagged?: boolean })[]>([])
  const [answeredCount, setAnsweredCount] = useState(0)
  const [flaggedCount, setFlaggedCount] = useState(0)
  const totalQuestions = moduleId <= 2 ? 27 : 22
  const moduleType = moduleId <= 2 ? "reading" : "math"
  const nextModuleId = moduleId < 4 ? moduleId + 1 : null

  useEffect(() => {
    // Load questions from sessionStorage
    const savedQuestions = sessionStorage.getItem(`module-${moduleId}-questions`)

    if (savedQuestions) {
      const parsedQuestions = JSON.parse(savedQuestions)
      setQuestions(parsedQuestions)

      // Count answered and flagged questions
      const answered = parsedQuestions.filter((q: any) => q.userAnswer).length
      const flagged = parsedQuestions.filter((q: any) => q.flagged).length

      setAnsweredCount(answered)
      setFlaggedCount(flagged)
    } else {
      // If no questions found, redirect to the module page
      router.push(`/test/module/${moduleId}`)
    }
  }, [moduleId, router])

  const handleSubmit = () => {
    // Mark the module as completed in sessionStorage
    sessionStorage.setItem(`module-${moduleId}-completed`, "true")

    // Clear the timer
    sessionStorage.removeItem(`module-${moduleId}-timer-end`)

    // Navigate to the next module or results page
    if (nextModuleId) {
      router.push(`/test/module/${nextModuleId}/intro`)
    } else {
      router.push("/test/results")
    }
  }

  const handleGoToQuestion = (questionNumber: number) => {
    router.push(`/test/module/${moduleId}?question=${questionNumber}`)
  }

  const handleReturnToQuestions = () => {
    // Get the last viewed question from sessionStorage, default to 1
    const lastQuestion = sessionStorage.getItem(`module-${moduleId}-last-question`)
    const questionNumber = lastQuestion ? parseInt(lastQuestion) : 1
    router.push(`/test/module/${moduleId}?question=${questionNumber}`)
  }

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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto flex h-14 items-center justify-between">
          <h1 className="text-lg font-medium">
            Module {moduleId}: {getModuleTitle()} - Review
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="max-w-5xl mx-auto">
          <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Module Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Questions Answered</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(answeredCount / totalQuestions) * 100} className="h-2 [&>div]:bg-blue-500" />
                      <span className="text-sm font-medium">
                        {answeredCount}/{totalQuestions}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Questions Flagged</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(flaggedCount / totalQuestions) * 100} className="h-2 [&>div]:bg-yellow-500" />
                      <span className="text-sm font-medium">
                        {flaggedCount}/{totalQuestions}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Questions Unanswered</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={((totalQuestions - answeredCount) / totalQuestions) * 100}
                        className="h-2 [&>div]:bg-orange-400"
                      />
                      <span className="text-sm font-medium">
                        {totalQuestions - answeredCount}/{totalQuestions}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Question Status</h2>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                  {questions.map((question, index) => {
                    const questionNumber = index + 1
                    const isAnswered = !!question.userAnswer
                    const isFlagged = !!question.flagged

                    return (
                      <Button
                        key={question.id}
                        variant="outline"
                        size="sm"
                        className={`relative h-10 text-gray-900 ${
                          isFlagged
                            ? "border-yellow-500 bg-yellow-50"
                            : isAnswered
                              ? "border-blue-500 bg-blue-50"
                              : "border-orange-400 bg-orange-50"
                        }`}
                        onClick={() => handleGoToQuestion(questionNumber)}
                      >
                        <span>{questionNumber}</span>
                        {isFlagged && (
                          <Flag className="absolute -top-2 -right-2 h-4 w-4 text-yellow-500 bg-white rounded-full" />
                        )}
                        {isAnswered ? (
                          <CheckCircle className="absolute -bottom-2 -right-2 h-4 w-4 text-blue-500 bg-white rounded-full" />
                        ) : (
                          <AlertCircle className="absolute -bottom-2 -right-2 h-4 w-4 text-orange-400 bg-white rounded-full" />
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button variant="outline" onClick={handleReturnToQuestions}>
                  Return to Questions
                </Button>

                <Button onClick={handleSubmit} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  {nextModuleId ? "Continue to Next Module" : "Complete Test"} <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  )
}
