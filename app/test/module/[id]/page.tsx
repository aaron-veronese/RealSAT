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
        setCalcRect((r) => {
          const newLeft = e.clientX - dragState.current.offsetX
          const newTop = e.clientY - dragState.current.offsetY
          return { ...r, left: Math.max(8, newLeft), top: Math.max(40, newTop) }
        })
      } else if (resizeState.current.resizing) {
        const dx = e.clientX - resizeState.current.startX
        const dy = e.clientY - resizeState.current.startY
        setCalcRect({
          top: Math.max(40, resizeState.current.startYRectTop),
          left: Math.max(10, resizeState.current.startXRectLeft),
          width: Math.max(320, resizeState.current.startW + dx),
          height: Math.max(200, resizeState.current.startH + dy),
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

  // Create Desmos calculator with full-featured options
  const createCalculator = () => {
    if (!calculatorContainerRef.current || !window.Desmos) return

    // destroy existing instance if present
    if (calculatorRef.current) {
      try {
        // persist state before destroy
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

    // Full-featured config — enables regressions, tables, sliders, images, text, folders, etc.
    calculatorRef.current = window.Desmos.GraphingCalculator(calculatorContainerRef.current, {
      // UI
      keypad: true,
      expressions: true,
      expressionsCollapsed: false,
      expressionsTopbar: true, // + menu
      settingsMenu: true, // gear icon
      zoomButtons: true,
      lockViewport: false,
      autosize: true,
      border: false,
      graphpaper: true,
      showGrid: true,
      showXAxis: true,
      showYAxis: true,
      showResetButtonOnGraphpaper: true,
      // Advanced features
      projectorMode: false,
      degreeMode: false,
      pasteGraphLink: true,
      showHamburger: true,
      showLogo: true,
      pointsOfInterest: true,
      trace: true,
      showUndoRedo: true,
      autosave: true,
      invertedColors: false,
      language: "en-US",
      // Unlock the features often disabled in "exam" mode:
      restrictedFunctions: false,
      enableSliders: true,
      enableTables: true,
      enableImages: true,
      enableText: true,
      enableNotes: true,
      enableFolders: true,
      enableRegression: true, // <-- enables regression tools
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
      const existingScript = document.querySelector('script[src^="https://www.desmos.com/api/v1.7/calculator.js"]') as HTMLScriptElement | null

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
          script.src = "https://www.desmos.com/api/v1.7/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"
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

  // Persist calcRect to localStorage (debounced-ish)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem("desmosRect", JSON.stringify(calcRect))
      } catch {
        /* ignore */
      }
    }, 250)
    return () => clearTimeout(id)
  }, [calcRect])

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
      setQuestions(JSON.parse(savedQuestions))
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
          console.log(`Using ${previousModuleQuestions.length} questions from module ${previousModuleId}`)
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
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              Module {moduleId}: {getModuleTitle()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className={`${timeLeft < 300 ? "text-red-500 font-medium" : ""}`}>{formatTime(timeLeft)}</span>
            </div>
            <Button
              variant={currentQuestionData.flagged ? "default" : "outline"}
              size="sm"
              onClick={toggleFlag}
              className={
                currentQuestionData.flagged ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500" : ""
              }
            >
              <Flag className="h-4 w-4 mr-2" />
              {currentQuestionData.flagged ? "Flagged" : "Flag"}
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
                <Calculator className="h-4 w-4 mr-2" />
                Calculator
              </Button>
            )}
          </div>
        </div>
        <div className="container py-2">
          <div className="flex justify-between items-center text-sm mb-1">
            <span>
              Question {currentQuestion} of {totalQuestions}
            </span>
            <span>{Math.round((currentQuestion / totalQuestions) * 100)}% complete</span>
          </div>
          <Progress value={(currentQuestion / totalQuestions) * 100} className="h-2 bg-gray-100 [&>div]:bg-blue-600" />
        </div>
      </header>

      <main className="flex-1 container py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {currentQuestionData.contentColumns && currentQuestionData.contentColumns.length > 0 ? (
                    currentQuestionData.contentColumns.map(
                      (content, index) =>
                        content && (
                          <div key={index}>
                            <RenderedContent content={String(content)} testNumber={1} />
                            {index < currentQuestionData.contentColumns.length - 1 && <hr className="my-4" />}
                          </div>
                        ),
                    )
                  ) : (
                    <p className="text-base leading-relaxed">{currentQuestionData.questionText}</p>
                  )}
                </div>

                {!isFreeResponse ? (
                  <RadioGroup
                    value={currentQuestionData.userAnswer}
                    onValueChange={updateAnswer}
                    className="space-y-4 mt-6"
                  >
                    {options.map((opt) => (
                      <div key={opt.key} className="flex items-start space-x-3 rounded-md border p-4"
                        onClick={() => updateAnswer(opt.key)}>
                        <RadioGroupItem value={opt.key} id={`option-${opt.key}`} className="mt-1" />
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
                    <p className="text-sm text-muted-foreground">
                      Enter your answer in the box. Use numbers, decimal points, fractions (with /), or negative signs
                      as needed.
                    </p>
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
                        className="text-lg font-medium text-center"
                        placeholder="Your answer"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-between items-center">
              <Button
                onClick={goToPreviousQuestion}
                disabled={currentQuestion === 1}
                variant="outline"
                className="gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <Button
                onClick={goToReview}
                variant="outline"
                className="gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <ListChecks className="h-4 w-4 mr-1" />
                Review Module
              </Button>

              {!isLastQuestion ? (
                <Button onClick={goToNextQuestion} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={goToReview} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <ListChecks className="h-4 w-4 mr-1" />
                  Review Module Summary
                </Button>
              )}
            </div>
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
                className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
                onMouseDown={(e) => {
                  resizeState.current.resizing = true
                  resizeState.current.startX = e.clientX
                  resizeState.current.startY = e.clientY
                  resizeState.current.startW = calcRect.width
                  resizeState.current.startH = calcRect.height
                  resizeState.current.startXRectLeft = calcRect.left
                  resizeState.current.startYRectTop = calcRect.top
                  e.stopPropagation()
                }}
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
      </main>
    </div>
  )
}
