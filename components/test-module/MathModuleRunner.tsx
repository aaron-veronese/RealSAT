"use client"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useTestModuleBase } from "./useTestModuleBase"
import type { TestQuestion } from "@/lib/types"
import { TestModuleShell } from "./TestModuleShell"
import { Calculator } from "lucide-react"

declare global {
  interface Window { Desmos?: any }
}

export function MathModuleRunner({ moduleId }: { moduleId: number }) {
  const searchParams = useSearchParams()
  const initialQuestion = searchParams.get("question") ? parseInt(searchParams.get("question")!) : 1
  const base = useTestModuleBase(moduleId, initialQuestion)

  const {
    questions,
    currentQuestion,
    totalQuestions,
    percentComplete,
    timeLeft,
    formatClock,
    isLastQuestion,
    isMathModule,
    isEnglishModule,
    updateAnswer,
    toggleFlag,
    goToNextQuestion,
    goToPreviousQuestion,
    goToReview,
    currentQuestionData,
    isFreeResponse
  } = base

  const [showCalculator, setShowCalculator] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const calcRef = useRef<any>(null)

  const [rect, setRect] = useState({ top: 120, left: 120, width: 900, height: 600 })
  const dragState = useRef({ dragging: false, offsetX: 0, offsetY: 0 })
  const resizeState = useRef({ resizing: false, startX: 0, startY: 0, startW: 0, startH: 0 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (dragState.current.dragging) {
        setRect(r => ({ ...r, left: e.clientX - dragState.current.offsetX, top: e.clientY - dragState.current.offsetY }))
      } else if (resizeState.current.resizing) {
        const dx = e.clientX - resizeState.current.startX
        const dy = e.clientY - resizeState.current.startY
        setRect(r => ({
          ...r,
          width: Math.max(320, resizeState.current.startW + dx),
          height: Math.max(200, resizeState.current.startH + dy),
        }))
        try { calcRef.current?.resize?.() } catch {}
      }
    }
    const up = () => {
      dragState.current.dragging = false
      resizeState.current.resizing = false
      try { calcRef.current?.resize?.() } catch {}
    }
    document.addEventListener("mousemove", move)
    document.addEventListener("mouseup", up)
    return () => {
      document.removeEventListener("mousemove", move)
      document.removeEventListener("mouseup", up)
    }
  }, [])

  useEffect(() => {
    if (!isMathModule) return
    const ensure = () => new Promise<void>((resolve) => {
      if (window.Desmos) return resolve()
      const existing = document.querySelector('script[src^="https://www.desmos.com/api/v1.11/calculator.js"]') as HTMLScriptElement | null
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true })
        return
      }
      const s = document.createElement("script")
      s.src = "https://www.desmos.com/api/v1.11/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"
      s.async = true
      s.onload = () => resolve()
      document.body.appendChild(s)
    })
    
    ensure().then(() => {
      if (showCalculator && containerRef.current && window.Desmos) {
        const isDark = document.documentElement.classList.contains("dark")
        calcRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
          keypad: true,
          expressions: true,
          settingsMenu: true,
          expressionsTopbar: true,
          invertedColors: isDark
        })
        try {
          const saved = sessionStorage.getItem("desmos-state")
          if (saved) calcRef.current.setState(JSON.parse(saved))
        } catch {}
        setTimeout(() => { try { calcRef.current?.resize?.() } catch {} }, 150)
      }
    })
    
    return () => {
      if (calcRef.current) {
        try {
          const state = calcRef.current.getState?.()
          if (state) sessionStorage.setItem("desmos-state", JSON.stringify(state))
        } catch {}
        try { calcRef.current.destroy() } catch {}
        calcRef.current = null
      }
    }
  }, [showCalculator, isMathModule])

  useEffect(() => {
    const obs = new MutationObserver(() => {
      if (calcRef.current) {
        try {
          const isDark = document.documentElement.classList.contains("dark")
          calcRef.current.updateSettings({ invertedColors: isDark })
        } catch {}
      }
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  const toggleCalculator = () => {
    setShowCalculator(s => {
      const next = !s
      if (!next && calcRef.current) {
        try {
          const state = calcRef.current.getState?.()
          if (state) sessionStorage.setItem("desmos-state", JSON.stringify(state))
        } catch {}
      }
      return next
    })
  }

  const calculatorOverlay = showCalculator ? (
    <div
      className="fixed bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-600 rounded-lg z-50 overflow-hidden"
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
    >
      <div
        className="cursor-move bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center px-3 py-1"
        onMouseDown={(e) => {
          dragState.current.dragging = true
          dragState.current.offsetX = e.clientX - rect.left
          dragState.current.offsetY = e.clientY - rect.top
        }}
      >
        <div className="flex items-center gap-3">
          <Calculator className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Desmos Graphing Calculator</span>
        </div>
        <div>
          <button
            onClick={toggleCalculator}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded"
            aria-label="Close calculator"
          >
            ✕
          </button>
        </div>
      </div>
      <div ref={containerRef} className="w-full h-full" style={{ height: rect.height - 32 }} />
      <div
        onMouseDown={(e) => {
          resizeState.current.resizing = true
          resizeState.current.startX = e.clientX
          resizeState.current.startY = e.clientY
          resizeState.current.startW = rect.width
          resizeState.current.startH = rect.height
          e.preventDefault()
        }}
        className="absolute right-0 bottom-0 w-6 h-6 cursor-se-resize bg-gray-300 dark:bg-gray-600 border border-gray-400 dark:border-gray-500"
      />
    </div>
  ) : null

  const options = currentQuestionData.options
    ? currentQuestionData.options.map((t: any, i: number) => ({ key: String.fromCharCode(65 + i), text: t }))
    : []

  const [isFillFocused, setIsFillFocused] = useState(false)
  if (timeLeft === null) return null

  return (
    <TestModuleShell
      currentQuestionData={currentQuestionData as TestQuestion & { flagged?: boolean }}
      options={options}
      currentQuestion={currentQuestion}
      totalQuestions={totalQuestions}
      percentComplete={percentComplete}
      timeLeft={timeLeft}
      formatClock={formatClock}
      isLastQuestion={isLastQuestion}
      isMathModule={isMathModule}
      isEnglishModule={isEnglishModule}
      updateAnswer={updateAnswer}
      toggleFlag={toggleFlag}
      goToNextQuestion={goToNextQuestion}
      goToPreviousQuestion={goToPreviousQuestion}
      goToReview={goToReview}
      isFreeResponse={isFreeResponse}
      isFillFocused={isFillFocused}
      setIsFillFocused={setIsFillFocused}
      highlights={[]}
      onClearHighlights={() => {}}
      onSelectionHighlight={() => {}}
      showCalculator={showCalculator}
      toggleCalculator={toggleCalculator}
      calculatorOverlay={calculatorOverlay}
    />
  )
}