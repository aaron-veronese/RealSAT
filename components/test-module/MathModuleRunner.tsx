"use client"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useTestModuleBase } from "./useTestModuleBase"
import type { TestQuestion } from "@/lib/types"
import TestModuleShell from "./TestModuleShell"
import { Calculator } from "lucide-react"

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

  const [showCalculator, setShowCalculator] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const calcRef = useRef<any>(null)
  const rectKey = `module-${moduleId}-desmos-rect`

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
      if (showCalculator && window.Desmos) {
        const mountNode = containerRef.current
        if (!mountNode) return
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

  // Initialize rect from sessionStorage or compute default to fill left half between header/footer
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = sessionStorage.getItem(rectKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        // If saved rect exists but equals the placeholder defaults, treat as not-saved
        const isPlaceholder = parsed && parsed.top === 120 && parsed.left === 120 && parsed.width === 900 && parsed.height === 600
        if (parsed && typeof parsed === 'object' && !isPlaceholder) {
          setRect(parsed)
          return
        }
      }
    } catch {}

    // compute default rect to fill left half of the viewport between header and footer
    const computeDefault = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const left = 0
      const width = Math.floor(vw / 2)
      const headerEl = document.querySelector('header.sticky') || document.querySelector('header')
      const footerEl = document.querySelector('footer.fixed') || document.querySelector('footer')
      const headerRect = headerEl ? (headerEl as HTMLElement).getBoundingClientRect() : { bottom: 0, height: 0 }
      const footerRect = footerEl ? (footerEl as HTMLElement).getBoundingClientRect() : { top: vh, height: 0 }
      const top = Math.round(headerRect.bottom)
      const footerTop = Math.round(footerRect.top)
      const height = Math.max(200, footerTop - top)
      return { top, left, width, height, headerMeasured: headerRect.height > 0, footerMeasured: footerRect.height > 0 }
    }

    const applyDefaultIfPlaceholder = () => {
      setRect(r => {
        if (r.top === 120 && r.left === 120 && r.width === 900 && r.height === 600) {
          const d: any = computeDefault()
          // if header/footer measurement missing, try again on next frame
          if (!d.headerMeasured || !d.footerMeasured) {
            requestAnimationFrame(() => {
              const d2: any = computeDefault()
              setRect({ top: d2.top, left: d2.left, width: d2.width, height: d2.height })
            })
            return r
          }
          return { top: d.top, left: d.left, width: d.width, height: d.height }
        }
        return r
      })
    }

    applyDefaultIfPlaceholder()
  // run once on mount
  }, [])

  // persist rect changes to sessionStorage so position/size survive open/close
  useEffect(() => {
    try { sessionStorage.setItem(rectKey, JSON.stringify(rect)) } catch {}
  }, [rect])

  // Helper: compute default rect on demand (used when user opens calculator)
  const computeDefaultRect = (): { top: number; left: number; width: number; height: number; headerMeasured?: boolean; footerMeasured?: boolean } => {
    if (typeof window === 'undefined') return { top: 120, left: 120, width: 900, height: 600, headerMeasured: false, footerMeasured: false }
    const vw = window.innerWidth
    const vh = window.innerHeight
    const left = 0
    const width = Math.floor(vw / 2)
    const headerEl = document.querySelector('header.sticky') || document.querySelector('header')
    const footerEl = document.querySelector('footer.fixed') || document.querySelector('footer')
    const headerRect = headerEl ? (headerEl as HTMLElement).getBoundingClientRect() : { bottom: 0, height: 0 }
    const footerRect = footerEl ? (footerEl as HTMLElement).getBoundingClientRect() : { top: vh, height: 0 }
    const top = Math.round(headerRect.bottom)
    const footerTop = Math.round(footerRect.top)
    const height = Math.max(200, footerTop - top)
    return { top, left, width, height, headerMeasured: headerRect.height > 0, footerMeasured: footerRect.height > 0 }
  }

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
    // Toggle; when opening, ensure default rect is computed/applied if no saved rect exists
    setShowCalculator(s => {
      const next = !s
      if (next) {
        // opening: if there is no saved rect and rect is still placeholder, compute and apply default
        try {
          const saved = sessionStorage.getItem(rectKey)
          let useDefault = false
          if (!saved) useDefault = true
          else {
            const parsed = JSON.parse(saved)
            const isPlaceholder = parsed && parsed.top === 120 && parsed.left === 120 && parsed.width === 900 && parsed.height === 600
            if (isPlaceholder) useDefault = true
          }
          if (useDefault && rect.top === 120 && rect.left === 120 && rect.width === 900 && rect.height === 600) {
            const d: any = computeDefaultRect()
            if (d.headerMeasured && d.footerMeasured) {
              setRect({ top: d.top, left: d.left, width: d.width, height: d.height })
            } else {
              // measurements not ready yet; apply after next frame
              requestAnimationFrame(() => {
                const d2: any = computeDefaultRect()
                setRect({ top: d2.top, left: d2.left, width: d2.width, height: d2.height })
              })
            }
          }
        } catch {}
      } else {
        // closing: persist desmos state as before
        if (calcRef.current) {
          try {
            const state = calcRef.current.getState?.()
            if (state) sessionStorage.setItem("desmos-state", JSON.stringify(state))
          } catch {}
        }
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
      calculatorOverlay={calculatorOverlay}
      
    />
  )
}