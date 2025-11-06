"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Test, TestQuestion } from "./types"

interface TestContextType {
  test: Test | null
  currentModule: number
  setCurrentModule: (moduleId: number) => void
  getModuleQuestions: (moduleId: number) => TestQuestion[]
  updateQuestion: (moduleId: number, questionId: string, updates: Partial<TestQuestion>) => void
  saveTestData: () => void
  loadTestData: () => void
  clearTestData: () => void
  isTestInProgress: boolean
}

const TestContext = createContext<TestContextType | undefined>(undefined)

export function TestProvider({ children }: { children: React.ReactNode }) {
  const [test, setTest] = useState<Test | null>(null)
  const [currentModule, setCurrentModule] = useState<number>(1)
  const [isTestInProgress, setIsTestInProgress] = useState<boolean>(false)

  // Initialize test data from session storage on mount
  useEffect(() => {
    loadTestData()
    const testInProgress = sessionStorage.getItem("test-in-progress") === "true"
    setIsTestInProgress(testInProgress)
  }, [])

  const getModuleQuestions = (moduleId: number): TestQuestion[] => {
    if (!test) return []
    const module = test.modules.find((m) => m.moduleNumber === moduleId)
    return module ? module.questions : []
  }

  const updateQuestion = (moduleId: number, questionId: string, updates: Partial<TestQuestion>) => {
    if (!test) return

    setTest((prevTest) => {
      if (!prevTest) return null

      const updatedModules = prevTest.modules.map((module) => {
        if (module.moduleNumber !== moduleId) return module

        const updatedQuestions = module.questions.map((question) => {
          if (question.id !== questionId) return question
          return { ...question, ...updates }
        })

        return { ...module, questions: updatedQuestions }
      })

      return { ...prevTest, modules: updatedModules }
    })
  }

  const saveTestData = () => {
    if (test) {
      sessionStorage.setItem("test-data", JSON.stringify(test))
    }
  }

  const loadTestData = () => {
    const savedTest = sessionStorage.getItem("test-data")
    if (savedTest) {
      try {
        const parsedTest = JSON.parse(savedTest)
        setTest(parsedTest)
      } catch (error) {
        console.error("Failed to parse test data:", error)
      }
    }
  }

  const clearTestData = () => {
    sessionStorage.removeItem("test-data")
    sessionStorage.removeItem("test-in-progress")
    for (let i = 1; i <= 4; i++) {
      sessionStorage.removeItem(`module-${i}-questions`)
      sessionStorage.removeItem(`module-${i}-timer-end`)
    }
    setTest(null)
    setIsTestInProgress(false)
  }

  // Save test data to session storage whenever it changes
  useEffect(() => {
    if (test) {
      saveTestData()
    }
  }, [test])

  return (
    <TestContext.Provider
      value={{
        test,
        currentModule,
        setCurrentModule,
        getModuleQuestions,
        updateQuestion,
        saveTestData,
        loadTestData,
        clearTestData,
        isTestInProgress,
      }}
    >
      {children}
    </TestContext.Provider>
  )
}

export function useTest() {
  const context = useContext(TestContext)
  if (context === undefined) {
    throw new Error("useTest must be used within a TestProvider")
  }
  return context
}
