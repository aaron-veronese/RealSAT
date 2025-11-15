"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Flag, AlertCircle, ChevronRight, Clock } from "lucide-react"
import type { TestQuestion } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/components/ui/use-toast"
import { getCurrentUserId, isCurrentUserTemp } from "@/lib/auth"
import { updateModuleData, completeTest, getTestAttempt, validateAndUpdateModule, createTestAttempt } from "@/lib/supabase/test-results"
import { SignupModal } from "@/components/signup-modal"
import { shouldPromptSignup } from "@/lib/temp-user"
import type { ModuleQuestion } from "@/types/db"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ModuleReviewPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const moduleId = Number(params.id)
  const testId = parseInt(searchParams.get('testId') || '1', 10)
  const userId = getCurrentUserId()
  const { toast } = useToast()

  const [questions, setQuestions] = useState<(TestQuestion & { flagged?: boolean })[]>([])
  const [answeredCount, setAnsweredCount] = useState(0)
  const [flaggedCount, setFlaggedCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const totalQuestions = moduleId <= 2 ? 27 : 22
  const moduleType = moduleId <= 2 ? "reading" : "math"
  const nextModuleId = moduleId < 4 ? moduleId + 1 : null

  useEffect(() => {
    loadModuleData()
  }, [moduleId, testId])

  const loadModuleData = async () => {
    // Load module data from localStorage
    const moduleKey = `test-${testId}-module-${moduleId}`
    const moduleData = localStorage.getItem(moduleKey)

    if (!moduleData) {
      router.push(`/test/module/${moduleId}/intro?testId=${testId}`)
      return
    }

    try {
      const parsed = JSON.parse(moduleData)

      // Convert localStorage data to TestQuestion format
      const questionsWithState = parsed.questions.map((q: any) => {
        // Determine question type from answers array
        // If answers exist and any have a value, it's multiple choice (unless section is MATH and only 1 answer)
        const hasAnswers = q.answers && q.answers.length > 0
        const isFreeResponseMath = q.section === 'MATH' && hasAnswers && q.answers.length === 1
        const questionType = hasAnswers && !isFreeResponseMath
          ? "multiple-choice" as const
          : "free-response" as const

        // Extract options for multiple choice questions
        const options = questionType === "multiple-choice" 
          ? q.answers.map((a: any) => a.value) 
          : undefined

        return {
          id: q.id,
          moduleId: moduleId.toString(),
          questionNumber: q.question_number,
          questionText: "", // Not used
          questionType,
          options,
          correctAnswer: q.correct_answer,
          userAnswer: q.user_answer || "",
          flagged: q.flagged || false,
          difficulty: "medium" as const,
          timeSpent: q.time_spent || 0,
          content: q.content, // Array of {type, value}
          answers: q.answers, // Array of {type, value}
          section: q.section
        }
      })

      setQuestions(questionsWithState)

      // Count answered and flagged
      const answered = questionsWithState.filter((q: any) => q.userAnswer && q.userAnswer.trim() !== "").length
      const flagged = questionsWithState.filter((q: any) => q.flagged).length

      setAnsweredCount(answered)
      setFlaggedCount(flagged)
    } catch (err) {
      console.error("Error loading module data:", err)
      router.push(`/test/module/${moduleId}/intro?testId=${testId}`)
    }
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleTimeUp = useCallback(async () => {
    toast({
      title: "Time's up!",
      description: "Your module is being automatically submitted.",
      variant: "destructive",
    })

    // Auto-submit the module
    await submitModule()
  }, [moduleId, testId, userId])

  // Calculate time left based on end time in localStorage and auto-submit on expiry
  useEffect(() => {
    const calculateTimeLeft = () => {
      const timerKey = `test-${testId}-module-${moduleId}-timer`
      const timerData = localStorage.getItem(timerKey)
      if (!timerData) return null
      
      try {
        const { endTime } = JSON.parse(timerData)
        const now = Date.now()
        const diff = Math.max(0, Math.floor((endTime - now) / 1000))
        return diff
      } catch {
        return null
      }
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
      if (remaining !== null && remaining <= 0) {
        clearInterval(timer)
        handleTimeUp()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [moduleId, testId, handleTimeUp])

  const submitModule = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      // Get localStorage data for time calculation
      const moduleKey = `test-${testId}-module-${moduleId}`
      const timerKey = `test-${testId}-module-${moduleId}-timer`
      
      const moduleData = localStorage.getItem(moduleKey)
      const timerData = localStorage.getItem(timerKey)

      if (!moduleData || !timerData) {
        throw new Error("Module data not found")
      }

      const parsed = JSON.parse(moduleData)
      const { startTime, endTime } = JSON.parse(timerData)
      
      // Calculate total time spent
      const totalTime = Math.floor((Date.now() - startTime) / 1000)

      // Prepare questions for submission (NO validation here - that happens server-side)
      const submittedQuestions: ModuleQuestion[] = parsed.questions.map((q: any) => {
        const userAnswer = q.user_answer || null
        
        return {
          question_number: q.question_number,
          user_answer: userAnswer,
          correct_answer: q.correct_answer, // This is just passed through, not used for validation yet
          time_spent: q.time_spent || 0,
          status: 'UNANSWERED' as const // Will be validated server-side after submission
        }
      })

      // Get the test attempt, create if it doesn't exist
      let existingAttempt = (await getTestAttempt(userId, testId)).data
      
      if (!existingAttempt) {
        // Create test attempt on first submission
        const { data: newAttempt, error: createError } = await createTestAttempt(userId, testId)
        if (createError || !newAttempt) {
          throw new Error("Failed to create test attempt")
        }
        existingAttempt = newAttempt
      }

      const moduleKey2 = `module_${moduleId}` as const
      const updatedModules = {
        ...existingAttempt.modules,
        [moduleKey2]: {
          module_number: moduleId,
          questions: submittedQuestions,
          completed: true,
          total_time: totalTime
        }
      }

      // Check which modules are now complete
      const mod1Complete = updatedModules.module_1?.completed || false
      const mod2Complete = updatedModules.module_2?.completed || false
      const mod3Complete = updatedModules.module_3?.completed || false
      const mod4Complete = updatedModules.module_4?.completed || false

      // Determine if we need to complete the test (all 4 modules)
      if (mod1Complete && mod2Complete && mod3Complete && mod4Complete) {
        // First validate the current module
        const { data: validatedAttempt, error: validateError } = await validateAndUpdateModule(
          existingAttempt.id, 
          testId, 
          moduleId, 
          updatedModules
        )

        if (validateError || !validatedAttempt) {
          throw new Error("Failed to validate module")
        }

        // Now calculate scores using the validated data
        const { calculateTestScore } = await import('@/lib/scoring')
        
        // Get the validated modules from the database response
        const validatedModules = validatedAttempt.modules
        
        // Convert modules to scoring format
        const modulesForScoring: any[] = [
          { moduleType: 'reading', questions: validatedModules.module_1.questions },
          { moduleType: 'reading', questions: validatedModules.module_2.questions },
          { moduleType: 'math', questions: validatedModules.module_3.questions },
          { moduleType: 'math', questions: validatedModules.module_4.questions },
        ]

        const scores = calculateTestScore(modulesForScoring)
        const totalTestTime = (validatedModules.module_1?.total_time || 0) + 
                             (validatedModules.module_2?.total_time || 0) +
                             (validatedModules.module_3?.total_time || 0) +
                             (validatedModules.module_4?.total_time || 0)

        const { error } = await completeTest(
          existingAttempt.id,
          totalTestTime,
          scores.readingWriting.scaledScore,
          scores.math.scaledScore,
          scores.total,
          validatedModules
        )
        
        if (error) {
          throw new Error("Failed to complete test")
        }

        toast({
          title: "Test completed!",
          description: `Your total score: ${scores.total}/1600`,
        })

        // Clear localStorage
        localStorage.removeItem(moduleKey)
        localStorage.removeItem(timerKey)

        setTimeout(() => {
          router.push(`/test/results?testId=${testId}`)
        }, 1500)

      } else {
        // Regular module submission - validate answers server-side
        const { error } = await validateAndUpdateModule(existingAttempt.id, testId, moduleId, updatedModules)
        
        if (error) {
          throw new Error("Failed to save module")
        }

        toast({
          title: "Module submitted!",
          description: "Your answers have been saved.",
        })

        // Clear localStorage
        localStorage.removeItem(moduleKey)
        localStorage.removeItem(timerKey)

        // Navigation logic: go to next incomplete module intro, or results page
        setTimeout(() => {
          // After Module 1: Always go to Module 2 intro (Module 2 will never be complete before Module 1)
          if (moduleId === 1) {
            router.push(`/test/module/2/intro?testId=${testId}`)
          }
          // After Module 2: Go to Module 3 intro if not completed, else Module 4, else Full Results
          else if (moduleId === 2) {
            if (!updatedModules.module_3?.completed) {
              router.push(`/test/module/3/intro?testId=${testId}`)
            } else if (!updatedModules.module_4?.completed) {
              router.push(`/test/module/4/intro?testId=${testId}`)
            } else {
              // Both math modules complete -> Full results
              router.push(`/test/results?testId=${testId}`)
            }
          }
          // After Module 3: Always go to Module 4 intro (Module 4 will never be complete before Module 3)
          else if (moduleId === 3) {
            router.push(`/test/module/4/intro?testId=${testId}`)
          }
          // After Module 4: Full Results (if modules 1 and 2 complete) → Math Results (if module 1 or 2 incomplete)
          else if (moduleId === 4) {
            const hasReadingModules = updatedModules.module_1?.completed && updatedModules.module_2?.completed
            if (hasReadingModules) {
              router.push(`/test/results?testId=${testId}`) // Full results
            } else {
              router.push(`/test/results?testId=${testId}&section=math`) // Math only results
            }
          }
        }, 1000)
      }

    } catch (error) {
      console.error("Error submitting module:", error)
      toast({
        title: "Submission failed",
        description: "There was an error submitting your module. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false)
    await submitModule()
  }

  const handleGoToQuestion = (questionNumber: number) => {
    router.push(`/test/module/${moduleId}?testId=${testId}&question=${questionNumber}`)
  }

  const handleReturnToQuestions = () => {
    // Get the last viewed question from localStorage, default to 1
    const lastQuestion = localStorage.getItem(`test-${testId}-module-${moduleId}-last-question`)
    const questionNumber = lastQuestion ? parseInt(lastQuestion) : 1
    router.push(`/test/module/${moduleId}?testId=${testId}&question=${questionNumber}`)
  }

  const handleNavigateHome = async () => {
    // Check if user is temp and has progress
    if (isCurrentUserTemp()) {
      const hasProgress = await shouldPromptSignup(userId)
      if (hasProgress) {
        setPendingNavigation('/')
        setShowSignupModal(true)
        return
      }
    }
    router.push('/')
  }

  const handleSignupSuccess = () => {
    setShowSignupModal(false)
    // Continue with pending navigation after signup
    if (pendingNavigation) {
      router.push(pendingNavigation)
    }
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
        <div className="max-w-5xl mx-auto flex h-10 items-center relative px-4">
          <h1 className="text-lg font-medium">
            Module {moduleId}: {getModuleTitle()} - Review
          </h1>
          {timeLeft !== null && (
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className={`${timeLeft < 300 ? "text-orange-400 font-medium" : ""}`}>{formatTime(timeLeft)}</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
          </div>
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
                        {isFlagged ? (
                          <Flag className="absolute -bottom-2 -right-2 h-4 w-4 text-yellow-500 bg-background rounded-full" />
                        ) : isAnswered ? (
                          <CheckCircle className="absolute -bottom-2 -right-2 h-4 w-4 text-blue-500 bg-background rounded-full" />
                        ) : (
                          <AlertCircle className="absolute -bottom-2 -right-2 h-4 w-4 text-orange-400 bg-background rounded-full" />
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button variant="outline" onClick={handleReturnToQuestions} disabled={isSubmitting}>
                  Return to Questions
                </Button>

                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? "Submitting..." : "Submit Module"} 
                  {!isSubmitting && <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Module {moduleId}?</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount < totalQuestions ? (
                <>
                  You have <strong>{totalQuestions - answeredCount} unanswered question{totalQuestions - answeredCount !== 1 ? 's' : ''}</strong>. 
                  Once you submit, you cannot return to this module.
                </>
              ) : (
                <>
                  You have answered all questions. Once you submit, you cannot return to this module.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSubmit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Submit Module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Signup Modal for Temp Users */}
      <SignupModal
        open={showSignupModal}
        onOpenChange={setShowSignupModal}
        tempUserId={userId}
        onSuccess={handleSignupSuccess}
        title="Sign up to save your progress"
        description="You're doing great! Create an account to save your test progress and continue later."
      />
    </div>
  )
}
