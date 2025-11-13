"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { generateModuleQuestions } from "@/lib/test-data"
import type { TestQuestion } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export interface UseTestModuleBase {
  moduleId: number
  questions: (TestQuestion & { flagged?: boolean })[]
  setQuestions: React.Dispatch<React.SetStateAction<(TestQuestion & { flagged?: boolean })[]>>
  currentQuestion: number
  setCurrentQuestion: React.Dispatch<React.SetStateAction<number>>
  totalQuestions: number
  isMathModule: boolean
  isEnglishModule: boolean
  isLastQuestion: boolean
  timeLeft: number | null
  answeredCount: number
  percentComplete: number
  updateAnswer: (answer: string) => void
  toggleFlag: () => void
  goToNextQuestion: () => void
  goToPreviousQuestion: () => void
  goToReview: () => void
  handleTimeUp: () => void
  formatClock: (s: number) => string
  currentQuestionData: (TestQuestion & { flagged?: boolean })
  isFreeResponse: boolean
}

export function useTestModuleBase(moduleId: number, initialQuestion: number): UseTestModuleBase {
  const router = useRouter()
  const { toast } = useToast()

  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion)
  const [questions, setQuestions] = useState<(TestQuestion & { flagged?: boolean })[]>([])
  const [answeredCount, setAnsweredCount] = useState(0)

  const totalQuestions = moduleId <= 2 ? 27 : 22
  const isMathModule = moduleId > 2
  const isEnglishModule = moduleId <= 2
  const isLastQuestion = currentQuestion === totalQuestions

  // sync current question with initial question on mount
  useEffect(() => {
    setCurrentQuestion(initialQuestion)
  }, [initialQuestion])

  // question timing
  const questionStartTimeRef = useRef<number>(Date.now())
  const addTimeSpent = (index: number, seconds: number) => {
    if (seconds <= 0) return
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, timeSpent: (q.timeSpent || 0) + seconds } : q))
  }

  // load / generate questions
  useEffect(() => {
    const timerEnd = sessionStorage.getItem(`module-${moduleId}-timer-end`)
    if (!timerEnd) {
      router.push(`/test/module/${moduleId}/intro`)
      return
    }

    const saved = sessionStorage.getItem(`module-${moduleId}-questions`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setQuestions(parsed.map((q: any) => ({ ...q, timeSpent: q.timeSpent || 0 })))
        return
      } catch {}
    }

    const moduleType = isEnglishModule ? "reading" : "math"
    let previousModuleQuestions: TestQuestion[] | undefined
    if (moduleId === 2 || moduleId === 4) {
      const prevId = moduleId === 2 ? 1 : 3
      const prevJson = sessionStorage.getItem(`module-${prevId}-questions`)
      if (prevJson) {
        try { previousModuleQuestions = JSON.parse(prevJson) } catch {}
      }
    }

    // Fetch questions from Supabase
    generateModuleQuestions(
      moduleType,
      moduleId,
      totalQuestions,
      new Set(),
      previousModuleQuestions,
    ).then((generated) => {
      const withState = generated.map(q => ({ ...q, flagged: false, userAnswer: "", timeSpent: q.timeSpent || 0 }))
      setQuestions(withState)
      sessionStorage.setItem(`module-${moduleId}-questions`, JSON.stringify(withState))
    }).catch((error) => {
      console.error("Error loading questions:", error)
      toast({
        title: "Error loading questions",
        description: "Failed to load questions from the database.",
        variant: "destructive",
      })
    })
  }, [moduleId, router, totalQuestions, isEnglishModule, toast])

  // persist changes
  useEffect(() => {
    if (questions.length > 0) {
      sessionStorage.setItem(`module-${moduleId}-questions`, JSON.stringify(questions))
    }
  }, [questions, moduleId])

  // answered count
  useEffect(() => {
    const count = questions.filter(q => q.userAnswer && String(q.userAnswer).trim() !== "").length
    setAnsweredCount(count)
  }, [questions])

  const percentComplete = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0

  // timer
  useEffect(() => {
    const calcLeft = () => {
      const raw = sessionStorage.getItem(`module-${moduleId}-timer-end`)
      if (!raw) return null
      const end = parseInt(raw)
      return Math.max(0, Math.floor((end - Date.now()) / 1000))
    }
    setTimeLeft(calcLeft())
    const interval = setInterval(() => {
      const left = calcLeft()
      setTimeLeft(left)
      if (left !== null && left <= 0) {
        clearInterval(interval)
        handleTimeUp()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [moduleId]) // eslint-disable-line

  const handleTimeUp = useCallback(() => {
    toast({
      title: "Time's up!",
      description: "Your module has been automatically submitted.",
      variant: "destructive",
    })
    sessionStorage.removeItem(`module-${moduleId}-timer-end`)
    setTimeout(() => {
      if (moduleId < 4) router.push(`/test/module/${moduleId + 1}/intro`)
      else router.push(`/test/results`)
    }, 1200)
  }, [moduleId, router, toast])

  // per-question time accumulation
  useEffect(() => {
    const prevIdx = currentQuestion - 1
    if (questions.length && prevIdx >= 0) {
      const elapsed = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
      addTimeSpent(prevIdx, elapsed)
    }
    questionStartTimeRef.current = Date.now()
  }, [currentQuestion, questions.length])

  useEffect(() => {
    return () => {
      if (!questions.length) return
      const elapsed = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
      addTimeSpent(currentQuestion - 1, elapsed)
    }
  }, [questions.length, currentQuestion])

  // update URL when question changes
  useEffect(() => {
    if (questions.length > 0) {
      router.replace(`/test/module/${moduleId}?question=${currentQuestion}`, { scroll: false })
    }
  }, [currentQuestion, moduleId, router, questions.length])

  const updateAnswer = (answer: string) => {
    setQuestions(prev => prev.map((q, i) => i === currentQuestion - 1 ? { ...q, userAnswer: answer } : q))
  }

  const toggleFlag = () => {
    setQuestions(prev => prev.map((q, i) => i === currentQuestion - 1 ? { ...q, flagged: !q.flagged } : q))
  }

  const goToNextQuestion = () => {
    if (currentQuestion < totalQuestions) setCurrentQuestion(q => q + 1)
  }
  const goToPreviousQuestion = () => {
    if (currentQuestion > 1) setCurrentQuestion(q => q - 1)
  }
  const goToReview = () => {
    sessionStorage.setItem(`module-${moduleId}-last-question`, currentQuestion.toString())
    router.push(`/test/module/${moduleId}/review`)
  }

  const formatClock = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`
  }

  const currentQuestionData =
    questions.length > 0
      ? questions[currentQuestion - 1]
      : {
          id: "",
          moduleId: "",
          questionNumber: 1,
          questionText: "",
          questionType: "multiple-choice",
          options: ["","","",""],
          correctAnswer: "",
          userAnswer: "",
          flagged: false,
          difficulty: "medium",
        }

  const isFreeResponse = isMathModule && currentQuestionData.questionType === "free-response"

  return {
    moduleId,
    questions,
    setQuestions,
    currentQuestion,
    setCurrentQuestion,
    totalQuestions,
    isMathModule,
    isEnglishModule,
    isLastQuestion,
    timeLeft,
    answeredCount,
    percentComplete,
    updateAnswer,
    toggleFlag,
    goToNextQuestion,
    goToPreviousQuestion,
    goToReview,
    handleTimeUp,
    formatClock,
    currentQuestionData,
    isFreeResponse
  }
}