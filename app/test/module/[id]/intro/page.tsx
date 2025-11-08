"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Clock, BookOpen, Calculator, Brain, ArrowRight } from "lucide-react"

export default function ModuleIntroPage() {
  const params = useParams()
  const router = useRouter()
  const moduleId = Number(params.id)
  const [isStarting, setIsStarting] = useState(false)

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

  const handleBeginModule = () => {
    setIsStarting(true)

    // Initialize the module timer in session storage
    const moduleTime = moduleId <= 2 ? 32 * 60 : 35 * 60 // Time in seconds
    const startTime = Date.now()
    const endTime = startTime + moduleTime * 1000

    // Store the end time rather than remaining seconds for more accurate timing
    sessionStorage.setItem(`module-${moduleId}-timer-end`, endTime.toString())

    // Navigate to the first question
    setTimeout(() => {
      router.push(`/test/module/${moduleId}`)
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
        <CardFooter className="flex justify-end">
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
