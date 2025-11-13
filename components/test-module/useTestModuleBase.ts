"use client"
import { useState, useEffect, useCallback, useRef } from "react"
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

export function useTestModuleBase(moduleId: number, testId: number, initialQuestion: number): UseTestModuleBase {
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
    const timerKey = `test-${testId}-module-${moduleId}-timer`
    const timerData = localStorage.getItem(timerKey)
    if (!timerData) {
      router.push(`/test/module/${moduleId}/intro?testId=${testId}`)
      return
    }

    // Load module data from localStorage (initialized by intro page)
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
          questionText: "", // Not used - we use content array instead
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
    } catch (err) {
      console.error("Error parsing module data:", err)
      router.push(`/test/module/${moduleId}/intro?testId=${testId}`)
    }
  }, [moduleId, testId, router, toast])

  // persist changes to localStorage in real-time
  useEffect(() => {
    if (questions.length > 0) {
      const moduleKey = `test-${testId}-module-${moduleId}`
      const moduleData = localStorage.getItem(moduleKey)
      
      if (moduleData) {
        try {
          const parsed = JSON.parse(moduleData)
          // Update questions with current state, preserving all original fields
          parsed.questions = questions.map((q) => {
            // Find the matching question in parsed data by question_number
            const originalQ = parsed.questions.find((pq: any) => pq.question_number === q.questionNumber)
            
            if (!originalQ) {
              console.error(`No original question found for question ${q.questionNumber}`)
              return null
            }
            
            return {
              ...originalQ, // Start with all original data
              user_answer: q.userAnswer || null,
              time_spent: q.timeSpent || 0,
              status: q.userAnswer ? 'ANSWERED' : 'UNANSWERED',
              flagged: q.flagged || false
            }
          }).filter(Boolean)
          localStorage.setItem(moduleKey, JSON.stringify(parsed))
        } catch (err) {
          console.error("Error updating localStorage:", err)
        }
      }
    }
  }, [questions, moduleId, testId])

  // answered count
  useEffect(() => {
    const count = questions.filter(q => q.userAnswer && String(q.userAnswer).trim() !== "").length
    setAnsweredCount(count)
  }, [questions])

  const percentComplete = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0

  // timer
  useEffect(() => {
    const calcLeft = () => {
      const timerKey = `test-${testId}-module-${moduleId}-timer`
      const raw = localStorage.getItem(timerKey)
      if (!raw) return null
      try {
        const { endTime } = JSON.parse(raw)
        return Math.max(0, Math.floor((endTime - Date.now()) / 1000))
      } catch {
        return null
      }
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
  }, [moduleId, testId]) // eslint-disable-line

  const handleTimeUp = useCallback(() => {
    toast({
      title: "Time's up!",
      description: "Your module has been automatically submitted.",
      variant: "destructive",
    })
    localStorage.removeItem(`test-${testId}-module-${moduleId}-timer`)
    setTimeout(() => {
      if (moduleId < 4) router.push(`/test/module/${moduleId + 1}/intro?testId=${testId}`)
      else router.push(`/test/results?testId=${testId}`)
    }, 1200)
  }, [moduleId, testId, router, toast])

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
      router.replace(`/test/module/${moduleId}?testId=${testId}&question=${currentQuestion}`, { scroll: false })
    }
  }, [currentQuestion, moduleId, testId, router, questions.length])

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
    localStorage.setItem(`test-${testId}-module-${moduleId}-last-question`, currentQuestion.toString())
    router.push(`/test/module/${moduleId}/review?testId=${testId}`)
  }

  const formatClock = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`
  }

  const currentQuestionData =
    questions.length > 0
      ? questions[currentQuestion - 1]
      : ({
          id: "",
          moduleId: "",
          questionNumber: 1,
          questionText: "",
          questionType: "multiple-choice" as "multiple-choice" | "free-response",
          options: ["","","",""],
          correctAnswer: "",
          userAnswer: "",
          flagged: false,
          difficulty: "medium",
        } as TestQuestion & { flagged?: boolean })

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