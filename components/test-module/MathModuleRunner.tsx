"use client"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useTestModuleBase } from "./useTestModuleBase"
import type { TestQuestion } from "@/lib/types"
import TestModuleShell from "./TestModuleShell"
// Calculator icon is provided in TestModuleShell; overlay UI removed from runner
import React from "react"

declare global {
  interface Window { Desmos?: any }
}

export function MathModuleRunner({ moduleId, testId }: { moduleId: number; testId: number }) {
  const searchParams = useSearchParams()
  const initialQuestion = searchParams.get("question") ? parseInt(searchParams.get("question")!) : 1
  const base = useTestModuleBase(moduleId, testId, initialQuestion)

  const {
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

  // Calculator should be off by default; user can toggle it on.
  const [showCalculator, setShowCalculator] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const calcRef = useRef<any>(null)

  // When orientation changes (portrait <-> landscape), hide the calculator to avoid
  // layout/duplication issues — the TestModuleShell controls layout and we'll
  // reset the calculator visibility here so switching orientation always hides it.
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const m = window.matchMedia('(orientation: portrait)')
    const onChange = () => setShowCalculator(false)
    try { m.addEventListener('change', onChange) } catch { m.addListener(onChange) }
    return () => { try { m.removeEventListener('change', onChange) } catch { m.removeListener(onChange) } }
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
      if (showCalculator && window.Desmos) {
        const mountNode = containerRef.current
        if (!mountNode) return
        // Ensure the mount node occupies full pane space so Desmos calculates correct size
        try {
          mountNode.style.width = '100%'
          mountNode.style.height = '100%'
          mountNode.style.minHeight = '0'
          mountNode.style.display = 'block'
        } catch {}
        // Prevent creating multiple calculator instances in the same mount node.
        if (calcRef.current) {
          try { calcRef.current.destroy() } catch {}
          calcRef.current = null
        }
        // Clean any leftover DOM inside the mount node before creating a new instance
        try { while (mountNode.firstChild) mountNode.removeChild(mountNode.firstChild) } catch {}
        const isDark = document.documentElement.classList.contains("dark")
        calcRef.current = window.Desmos.GraphingCalculator(mountNode, {
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

  // If Desmos is rendered inside the left pane (renderDesmosInLeft), watch for size changes
  // so we can call the calculator's resize method during splitter drags.
  React.useEffect(() => {
    if (!containerRef.current) return
    let obs: ResizeObserver | null = null
    try {
      obs = new ResizeObserver(() => {
        try { calcRef.current?.resize?.() } catch {}
      })
      obs.observe(containerRef.current)
    } catch {}
    return () => { try { obs && obs.disconnect() } catch {} }
  }, [containerRef.current, showCalculator])

  // Removed overlay rect/drag/resize logic — Desmos mounts into the left pane managed by TestModuleShell

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
    // simple toggle for mounting/unmounting Desmos in the left pane
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

  // No overlay UI; Desmos mounts into left pane when `renderDesmosInLeft` is true

  const options = currentQuestionData.options
    ? currentQuestionData.options.map((t: any, i: number) => ({ key: String.fromCharCode(65 + i), text: t }))
    : []

  const [isFillFocused, setIsFillFocused] = useState(false)
  const [crossouts, setCrossouts] = useState<string[]>([])

  // Load crossouts for current question
  useEffect(() => {
    const key = `module-${moduleId}-q${currentQuestion}-crossouts`
    try {
      const saved = sessionStorage.getItem(key)
      setCrossouts(saved ? JSON.parse(saved) : [])
    } catch {
      setCrossouts([])
    }
  }, [moduleId, currentQuestion])
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
      crossouts={crossouts}
      toggleCrossout={(k) => {
        setCrossouts(prev => {
          const next = prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]
          try { const key = `module-${moduleId}-q${currentQuestion}-crossouts`; sessionStorage.setItem(key, JSON.stringify(next)) } catch {}
          return next
        })
      }}
      showCalculator={showCalculator}
      toggleCalculator={toggleCalculator}
      calculatorOverlay={isMathModule ? null : null}
      renderDesmosInLeft={isMathModule}
      desmosContainerRef={containerRef}
      
    />
  )
}