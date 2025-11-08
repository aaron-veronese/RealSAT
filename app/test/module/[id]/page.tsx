"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calculator, ChevronLeft, ChevronRight, Clock, Flag, ListChecks } from "lucide-react"
import { generateModuleQuestions } from "@/lib/test-data"
import { useToast } from "@/components/ui/use-toast"
import type { TestQuestion } from "@/lib/types"
import { RenderedContent } from "@/components/rendered-content"
import { ThemeToggle } from "@/components/theme-toggle"

// Add a global declaration so TypeScript recognizes window.Desmos
declare global {
  interface Window {
    Desmos?: any
  }
}

export default function TestModulePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const moduleId = Number(params.id)
  const calculatorContainerRef = useRef<HTMLDivElement>(null)

  // Refs for script / instance
  const desmosScriptRef = useRef<HTMLScriptElement | null>(null)
  const calculatorRef = useRef<any>(null)

  // Get the question number from the URL query parameter
  const questionParam = searchParams.get("question")
  const initialQuestion = questionParam ? Number.parseInt(questionParam) : 1

  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion)
  const [questions, setQuestions] = useState<(TestQuestion & { flagged?: boolean })[]>([])
  const [showCalculator, setShowCalculator] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Track focus state for the fill-in input so we can hide the placeholder when the user clicks in
  const [isFillFocused, setIsFillFocused] = useState(false)

  // Ref for tracking time spent on current question
  const questionStartTimeRef = useRef<number>(Date.now())

  // Floating calculator position/size state and refs for drag/resize
  const defaultRect = { top: 120, left: 120, width: 950, height: 620 }
  const savedRectJson = typeof window !== "undefined" ? localStorage.getItem("desmosRect") : null
  const initialRect = savedRectJson ? JSON.parse(savedRectJson) : defaultRect
  const [calcRect, setCalcRect] = useState(initialRect)
  const dragState = useRef({ dragging: false, offsetX: 0, offsetY: 0 })
  // resizeState will keep a few dynamic properties — use a flexible object
  const resizeState = useRef<any>({
    resizing: false,
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
    startXRectLeft: initialRect.left,
    startYRectTop: initialRect.top,
  })

  // Helpers to notify Desmos after layout changes
  const notifyCalcLayoutChange = () => {
    // trigger a window resize event (Desmos listens for it)
    window.dispatchEvent(new Event("resize"))
    try {
      calculatorRef.current?.updateSettings?.({})
    } catch {
      /* ignore */
    }
    try {
      calculatorRef.current?.resize?.()
    } catch {
      /* ignore */
    }
  }

  // Drag & resize document-level handlers
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragState.current.dragging) {
        setCalcRect((r: { top: number; left: number; width: number; height: number }) => {
          const newLeft = e.clientX - dragState.current.offsetX
          const newTop = e.clientY - dragState.current.offsetY
          return { ...r, left: Math.max(8, newLeft), top: Math.max(40, newTop) }
        })
      } else if (resizeState.current.resizing) {
        const dx = e.clientX - resizeState.current.startX
        const dy = e.clientY - resizeState.current.startY
        const dir = resizeState.current.direction

        setCalcRect((r: { top: number; left: number; width: number; height: number }) => {
          let { top, left, width, height } = r
          switch (dir) {
            case "n":
              height = Math.max(200, resizeState.current.startH - dy)
              top = resizeState.current.startYRectTop + dy
              break
            case "s":
              height = Math.max(200, resizeState.current.startH + dy)
              break
            case "w":
              width = Math.max(320, resizeState.current.startW - dx)
              left = resizeState.current.startXRectLeft + dx
              break
            case "e":
              width = Math.max(320, resizeState.current.startW + dx)
              break
            case "nw":
              width = Math.max(320, resizeState.current.startW - dx)
              height = Math.max(200, resizeState.current.startH - dy)
              left = resizeState.current.startXRectLeft + dx
              top = resizeState.current.startYRectTop + dy
              break
            case "ne":
              width = Math.max(320, resizeState.current.startW + dx)
              height = Math.max(200, resizeState.current.startH - dy)
              top = resizeState.current.startYRectTop + dy
              break
            case "sw":
              width = Math.max(320, resizeState.current.startW - dx)
              height = Math.max(200, resizeState.current.startH + dy)
              left = resizeState.current.startXRectLeft + dx
              break
            case "se":
              width = Math.max(320, resizeState.current.startW + dx)
              height = Math.max(200, resizeState.current.startH + dy)
              break
          }
          return { top, left, width, height }
        })
      }

    }

    const onUp = () => {
      if (dragState.current.dragging) {
        dragState.current.dragging = false
        notifyCalcLayoutChange()
      }
      if (resizeState.current.resizing) {
        resizeState.current.resizing = false
        notifyCalcLayoutChange()
      }
    }

    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
    return () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
  }, [])

  const totalQuestions = moduleId <= 2 ? 27 : 22
  const isMathModule = moduleId > 2
  const isLastQuestion = currentQuestion === totalQuestions

  // Count how many questions have been answered (reads sessionStorage as a fallback
  // because the review page may update answers there)
  const [answeredCount, setAnsweredCount] = useState<number>(0)

  useEffect(() => {
    const computeAnswered = () => {
      let qs = questions
      if ((!qs || qs.length === 0) && typeof window !== "undefined") {
        const saved = sessionStorage.getItem(`module-${moduleId}-questions`)
        if (saved) {
          try {
            qs = JSON.parse(saved)
          } catch {
            qs = []
          }
        }
      }

      const count = (qs || []).filter(
        (q: any) =>
          q &&
          q.userAnswer !== undefined &&
          q.userAnswer !== null &&
          String(q.userAnswer).trim() !== ""
      ).length

      setAnsweredCount(count)
    }

    computeAnswered()

    const onStorage = (e: StorageEvent) => {
      if (e.key === `module-${moduleId}-questions`) computeAnswered()
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [questions, moduleId])

  const percentComplete = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  // Create Desmos calculator with full-featured options
  const createCalculator = () => {
    if (!calculatorContainerRef.current || !window.Desmos) return

    // Destroy existing instance if present
    if (calculatorRef.current) {
      try {
        calculatorRef.current.destroy()
      } catch {
        /* ignore */
      }
      calculatorRef.current = null
    }

    // Full-featured config — enables regressions, tables, sliders, images, text, folders, etc.
    calculatorRef.current = window.Desmos.GraphingCalculator(calculatorContainerRef.current, {
      expressions: true,      // Show expressions panel (enables tables, regressions, etc.)
      keypad: true,           // Show keypad
      settingsMenu: true,     // Show settings menu
      zoomButtons: true,      // Show zoom buttons
      lockViewport: false,    // Allow viewport changes
      border: false,          // No border
      expressionsTopbar: true, // Show top bar in expressions
      expressionsCollapsed: false, // Keep expressions panel open
      autosize: true,         // Auto-resize to container
    })


    // Restore saved state if any
    try {
      const saved = sessionStorage.getItem("desmos-state")
      if (saved) {
        const parsed = JSON.parse(saved)
        calculatorRef.current.setState(parsed)
      }
    } catch {
      /* ignore parse errors */
    }

    // Give Desmos a moment, then notify layout
    setTimeout(() => notifyCalcLayoutChange(), 200)
  }

  // Initialize Desmos script + calculator when needed
  useEffect(() => {
    if (!isMathModule) return

    let mounted = true

    // If calculator not shown, we still only want script loaded (so toggling is instant)
    const ensureScriptLoaded = () => {
      const existingScript = document.querySelector('script[src^="https://www.desmos.com/api/v1.11/calculator.js"]') as HTMLScriptElement | null

      if (window.Desmos) {
        return Promise.resolve()
      } else if (existingScript) {
        return new Promise<void>((resolve) => {
          if ((existingScript as any).complete) return resolve()
          const onLoad = () => {
            existingScript.removeEventListener("load", onLoad)
            resolve()
          }
          existingScript.addEventListener("load", onLoad)
        })
      } else {
        return new Promise<void>((resolve) => {
          const script = document.createElement("script")
          script.src = "https://www.desmos.com/api/v1.11/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"
          script.async = true
          script.onload = () => {
            resolve()
          }
          desmosScriptRef.current = script
          document.body.appendChild(script)
        })
      }
    }

    ensureScriptLoaded().then(() => {
      if (!mounted) return
      // only create calculator instance if the pane is visible
      if (showCalculator) {
        createCalculator()
      }
    })

    return () => {
      mounted = false
      // we do not forcibly remove the script if another part of the app may use it
      if (calculatorRef.current) {
        try {
          // save state
          const state = calculatorRef.current?.getState?.()
          if (state) sessionStorage.setItem("desmos-state", JSON.stringify(state))
        } catch {
          /* ignore */
        }
        try {
          calculatorRef.current.destroy()
        } catch {
          /* ignore */
        }
        calculatorRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMathModule, showCalculator])

  // Update URL when currentQuestion changes
  useEffect(() => {
    if (currentQuestion !== initialQuestion) {
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.set("question", currentQuestion.toString())
      window.history.replaceState({}, "", newUrl.toString())
    }
  }, [currentQuestion, initialQuestion])

  // Initialize questions
  useEffect(() => {
    // Check if timer end time exists
    const timerEnd = sessionStorage.getItem(`module-${moduleId}-timer-end`)

    // If no timer end time, redirect to intro page
    if (!timerEnd) {
      router.push(`/test/module/${moduleId}/intro`)
      return
    }

    // Try to load questions from sessionStorage
    const savedQuestions = sessionStorage.getItem(`module-${moduleId}-questions`)

    if (savedQuestions) {
      const parsed = JSON.parse(savedQuestions)
      // Ensure timeSpent is initialized for existing questions
      const questionsWithTimeSpent = parsed.map((q: any) => ({
        ...q,
        timeSpent: q.timeSpent || 0,
      }))
      setQuestions(questionsWithTimeSpent)
    } else {
      // Generate questions directly from our question data
      const moduleType = moduleId <= 2 ? "reading" : "math"
      const count = moduleId <= 2 ? 27 : 22

      // For adaptive modules (2 and 4), we need to check the previous module's performance
      let previousModuleQuestions: TestQuestion[] | undefined = undefined

      if (moduleId === 2 || moduleId === 4) {
        // Get the previous module's questions
        const previousModuleId = moduleId === 2 ? 1 : 3
        const previousModuleQuestionsJson = sessionStorage.getItem(`module-${previousModuleId}-questions`)

        if (previousModuleQuestionsJson) {
          previousModuleQuestions = JSON.parse(previousModuleQuestionsJson)

          // Log module generation info without revealing difficulty
          console.log(`Generating module ${moduleId} questions based on previous performance`)
          if (previousModuleQuestions) {
            console.log(`Using ${previousModuleQuestions.length} questions from module ${previousModuleId}`)
          }
        }
      }

      // Generate questions with appropriate difficulty distribution
      const generatedQuestions = generateModuleQuestions(
        moduleType,
        moduleId,
        count,
        new Set(), // Start with empty set for this module
        previousModuleQuestions, // Pass previous module questions for adaptive modules
      )

      // Add flagged property and userAnswer to each question
      const questionsWithState = generatedQuestions.map((q) => ({
        ...q,
        flagged: false,
        userAnswer: "",
        timeSpent: q.timeSpent || 0,
      }))

      setQuestions(questionsWithState)
      // Save to sessionStorage
      sessionStorage.setItem(`module-${moduleId}-questions`, JSON.stringify(questionsWithState))
    }
  }, [moduleId, router])

  // Save questions to sessionStorage whenever they change
  useEffect(() => {
    if (questions.length > 0) {
      sessionStorage.setItem(`module-${moduleId}-questions`, JSON.stringify(questions))
    }
  }, [questions, moduleId])

  // Calculate time left based on end time in session storage
  useEffect(() => {
    const calculateTimeLeft = () => {
      const timerEnd = sessionStorage.getItem(`module-${moduleId}-timer-end`)

      if (!timerEnd) return null

      const endTime = Number.parseInt(timerEnd)
      const now = Date.now()
      const diff = Math.max(0, Math.floor((endTime - now) / 1000))

      return diff
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)

      if (remaining !== null && remaining <= 0) {
        clearInterval(timer)
        handleTimeUp()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [moduleId])

  // Handle time up
  const handleTimeUp = useCallback(() => {
    toast({
      title: "Time's up!",
      description: "Your module has been automatically submitted.",
      variant: "destructive",
    })

    // Auto submit the module
    setIsSubmitting(true)

    // Clear the session storage for this module
    sessionStorage.removeItem(`module-${moduleId}-timer-end`)

    // Navigate to next module or results
    setTimeout(() => {
      if (moduleId < 4) {
        router.push(`/test/module/${moduleId + 1}/intro`)
      } else {
        router.push(`/test/results`)
      }
    }, 1500)
  }, [moduleId, router, toast])

  // Get current question
  const currentQuestionData =
    questions.length > 0
      ? questions[currentQuestion - 1]
      : {
        id: "",
        moduleId: "",
        questionNumber: 1,
        questionText: "Loading question...",
        questionType: "multiple-choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        userAnswer: "",
        flagged: false,
        difficulty: "medium",
      }

  const isFreeResponse = isMathModule && currentQuestionData.questionType === "free-response"

  // Build options array - handle both old and new data formats
  const options = currentQuestionData.options
    ? currentQuestionData.options.map((text, index) => ({
      key: String.fromCharCode(65 + index), // A, B, C, D
      text: text,
    }))
    : [
      { key: "A", text: (currentQuestionData as any).answerA },
      { key: "B", text: (currentQuestionData as any).answerB },
      { key: "C", text: (currentQuestionData as any).answerC },
      { key: "D", text: (currentQuestionData as any).answerD },
    ].filter((opt) => opt.text !== undefined && opt.text !== "")

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
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

      // Show toast
      toast({
        title: "Navigation Disabled",
        description: "Please use the test navigation buttons only. Browser navigation is disabled during the test.",
        variant: "destructive",
      })
    }

    // Block keyboard shortcuts for navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Alt+Left, Alt+Right, Backspace (when not in input)
      if (
        (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) ||
        (e.key === "Backspace" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement))
      ) {
        e.preventDefault()

        toast({
          title: "Navigation Shortcut Blocked",
          description: "Keyboard shortcuts for browser navigation are disabled during the test.",
          variant: "destructive",
        })
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

    // Store a flag in sessionStorage indicating test is in progress
    sessionStorage.setItem("test-in-progress", "true")

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [toast])

  // Update answer for current question
  const updateAnswer = (answer: string) => {
    setQuestions((prev) => prev.map((q, index) => (index === currentQuestion - 1 ? { ...q, userAnswer: answer } : q)))
  }

  // Toggle flag for current question
  const toggleFlag = () => {
    setQuestions((prev) => prev.map((q, index) => (index === currentQuestion - 1 ? { ...q, flagged: !q.flagged } : q)))
  }

  // Update time spent for a specific question
  const updateQuestionTimeSpent = (questionIndex: number, additionalTime: number) => {
    console.log(`Adding ${additionalTime} seconds to question ${questionIndex + 1}`)
    setQuestions((prev) => prev.map((q, index) => 
      index === questionIndex 
        ? { ...q, timeSpent: (q.timeSpent || 0) + additionalTime } 
        : q
    ))
  }

  // Time tracking: when question changes, add time spent to previous question
  useEffect(() => {
    const previousQuestionIndex = currentQuestion - 1
    if (questions.length > 0 && previousQuestionIndex >= 0) {
      const elapsedSeconds = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
      if (elapsedSeconds > 0) {
        updateQuestionTimeSpent(previousQuestionIndex, elapsedSeconds)
      }
    }
    // Reset start time for new question
    questionStartTimeRef.current = Date.now()
  }, [currentQuestion, questions.length])

  // Time tracking: on unmount, add time for current question
  useEffect(() => {
    return () => {
      if (questions.length > 0) {
        const elapsedSeconds = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
        if (elapsedSeconds > 0) {
          const currentIndex = currentQuestion - 1
          updateQuestionTimeSpent(currentIndex, elapsedSeconds)
        }
      }
    }
  }, [questions.length, currentQuestion])

  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const goToReview = () => {
    // Store the current question before navigating to review
    sessionStorage.setItem(`module-${moduleId}-last-question`, currentQuestion.toString())
    router.push(`/test/module/${moduleId}/review`)
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

  // If timeLeft is null, we're still loading or redirecting
  if (timeLeft === null) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 flex h-10 items-center justify-between">
          <div className="w-[calc(50%-1rem)]">
            <div className="flex justify-between items-center text-sm mb-1">
              <span>
                Question {currentQuestion} of {totalQuestions}
              </span>
              <span>{percentComplete}% complete</span>
            </div>
            <Progress value={percentComplete} className="h-2 bg-gray-100 dark:bg-gray-700 [&>div]:bg-blue-600" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className={`${timeLeft < 300 ? "text-orange-400 font-medium" : ""}`}>{formatTime(timeLeft)}</span>
            </div>
            <ThemeToggle />
            <Button
              variant={currentQuestionData.flagged ? "default" : "outline"}
              size="sm"
              onClick={toggleFlag}
              className={
                currentQuestionData.flagged ? "bg-yellow-400 hover:bg-yellow-500 text-white border-yellow-400" : ""
              }
            >
              <Flag className="h-4 w-4 min-[800px]:mr-2" />
              <span className="hidden min-[800px]:inline">
                {currentQuestionData.flagged ? "Flagged" : "Flag"}
              </span>
            </Button>
            {isMathModule && (
              <Button
                variant={showCalculator ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowCalculator((s) => {
                    const newVal = !s
                    // if opening and calculator already created, restore saved state
                    if (newVal && calculatorRef.current) {
                      try {
                        const saved = sessionStorage.getItem("desmos-state")
                        if (saved) calculatorRef.current.setState(JSON.parse(saved))
                      } catch {
                        /* ignore */
                      }
                    }
                    return newVal
                  })
                }}
              >
                <Calculator className="h-4 w-4 min-[800px]:mr-2" />
                <span className="hidden min-[800px]:inline">Calculator</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-6 pb-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div className="md:col-span-2">
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-6">
                <div className="space-y-4 mb-4">
                  {(currentQuestionData as any).contentColumns && (currentQuestionData as any).contentColumns.length > 0 ? (
                    (currentQuestionData as any).contentColumns.map(
                      (content: any, index: number) =>
                        content && (
                          <div key={index}>
                            <RenderedContent content={String(content)} testNumber={1} />
                            {index < (currentQuestionData as any).contentColumns.length - 1 && <hr className="my-4" />}
                          </div>
                        ),
                    )
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {String((currentQuestionData as any).content1 || "").replace(/<br\s*\/?>/gi, "\n")}
                    </div>
                  )}
                </div>

                {!isFreeResponse ? (
                  <RadioGroup
                      value={currentQuestionData.userAnswer}
                      onValueChange={updateAnswer}
                    >
                    {options.map((opt) => (
                      <div
                        key={opt.key}
                        className={`flex items-center space-x-2 rounded-md border p-3 ${
                          currentQuestionData.userAnswer === opt.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => updateAnswer(opt.key)}
                      >
                        <RadioGroupItem value={opt.key} id={`option-${opt.key}`} className="flex-shrink-0" />
                        <Label htmlFor={`option-${opt.key}`} className="flex-1 cursor-pointer text-base font-normal">
                          <span className="font-medium mr-2">{opt.key}.</span>
                          <span className="flex-1">
                            <RenderedContent content={String(opt.text)} testNumber={1} />
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-4 mt-6">
                    <div className="max-w-[200px]">
                      <Input
                        value={currentQuestionData.userAnswer}
                        onChange={(e) => {
                          // Only allow numbers, decimal, slash, and minus
                          const value = e.target.value.replace(/[^0-9./-]/g, "")
                          const maxLength = value.startsWith("-") ? 6 : 5
                          if (value.length <= maxLength) {
                            updateAnswer(value)
                          }
                        }}
                        onFocus={() => setIsFillFocused(true)}
                        onBlur={() => setIsFillFocused(false)}
                        className="text-lg font-medium text-center"
                        placeholder={isFillFocused || currentQuestionData.userAnswer ? "" : "Your answer"}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Floating calculator overlay */}
          {showCalculator && isMathModule && (
            <div
              className="fixed bg-white shadow-2xl border border-gray-200 rounded-lg z-50 overflow-hidden"
              style={{
                top: calcRect.top,
                left: calcRect.left,
                width: calcRect.width,
                height: calcRect.height,
              }}
            >
              {/* Drag Bar */}
              <div
                className="cursor-move bg-gray-50 border-b border-gray-200 flex justify-between items-center px-3 py-1"
                onMouseDown={(e) => {
                  dragState.current.dragging = true
                  dragState.current.offsetX = e.clientX - calcRect.left
                  dragState.current.offsetY = e.clientY - calcRect.top
                }}
              >
                <div className="flex items-center gap-3">
                  <Calculator className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Desmos Graphing Calculator</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Save state before closing
                      try {
                        const state = calculatorRef.current?.getState?.()
                        if (state) sessionStorage.setItem("desmos-state", JSON.stringify(state))
                      } catch {
                        /* ignore */
                      }
                      setShowCalculator(false)
                    }}
                    className="text-gray-500 hover:text-gray-800 transition px-2 py-1 rounded"
                    aria-label="Close calculator"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Calculator body */}
              <div
                ref={calculatorContainerRef}
                className="w-full h-full"
                style={{ height: calcRect.height - 36, width: "100%" }}
              />

              {/* Resize Handle */}
              <div
                onMouseDown={(e) => {
                  resizeState.current.resizing = true
                  resizeState.current.direction = "se" // bottom-right resize
                  resizeState.current.startX = e.clientX
                  resizeState.current.startY = e.clientY
                  resizeState.current.startW = calcRect.width
                  resizeState.current.startH = calcRect.height
                  // store top/left in state for safety (used by move handler above)
                  resizeState.current.startXRectLeft = calcRect.left
                  resizeState.current.startYRectTop = calcRect.top
                  e.preventDefault()
                }}
                className="absolute right-0 bottom-0 w-6 h-6 cursor-se-resize bg-gray-300 border border-gray-400"
                style={{ zIndex: 70 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l4 4m0 0l-4 4m4-4H8" />
                </svg>
              </div>
            </div>
          )}
        </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 flex h-12 items-center justify-between">
          <Button
            onClick={goToPreviousQuestion}
            disabled={currentQuestion === 1}
            className="gap-2 bg-orange-400 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {!isLastQuestion && (
            <Button
              onClick={goToReview}
              className="gap-2 bg-sky-500 hover:bg-sky-600 text-white"
            >
              <ListChecks className="h-4 w-4 mr-1" />
              Review Module
            </Button>
          )}

          {!isLastQuestion ? (
            <Button onClick={goToNextQuestion} className="gap-2 bg-blue-600 hover:bg-blue-700">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={goToReview} className="gap-2 bg-sky-500 hover:bg-sky-600 text-white">
              <ListChecks className="h-4 w-4 mr-1" />
              Review Module
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
