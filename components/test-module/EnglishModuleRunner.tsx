"use client"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useTestModuleBase } from "./useTestModuleBase"
import type { TestQuestion } from "@/lib/types"
import TestModuleShell from "./TestModuleShell"

export function EnglishModuleRunner({ moduleId, testId }: { moduleId: number; testId: number }) {
  const searchParams = useSearchParams()
  const initialQuestion = searchParams.get("question") ? parseInt(searchParams.get("question")!) : 1
  const base = useTestModuleBase(moduleId, testId, initialQuestion)

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

  const contentRef = useRef<HTMLDivElement | null>(null)

  const [highlights, setHighlights] = useState<
    { start: number; end: number; text: string }[]
  >([])
  const [isFillFocused, setIsFillFocused] = useState(false)
  const [crossouts, setCrossouts] = useState<string[]>([])

  // Load highlights for current question
  useEffect(() => {
    const key = `module-${moduleId}-q${currentQuestion}-highlights`
    try {
      const saved = sessionStorage.getItem(key)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Support legacy shape by ignoring unknown entries
          const normalized = Array.isArray(parsed)
            ? parsed.filter((h: any) => typeof h.start === 'number' && typeof h.end === 'number')
            : []
          setHighlights(normalized)
        } catch {
          setHighlights([])
        }
      } else {
        setHighlights([])
      }
    } catch {
      setHighlights([])
    }
  }, [moduleId, currentQuestion])

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

  const persistCrossouts = (next: string[]) => {
    const key = `module-${moduleId}-q${currentQuestion}-crossouts`
    sessionStorage.setItem(key, JSON.stringify(next))
  }

  const toggleCrossout = (k: string) => {
    setCrossouts(prev => {
      const next = prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]
      persistCrossouts(next)
      return next
    })
  }

  const persistHighlights = (h: typeof highlights) => {
    const key = `module-${moduleId}-q${currentQuestion}-highlights`
    sessionStorage.setItem(key, JSON.stringify(h))
  }

  const handleSelectionHighlight = () => {
    const root = contentRef.current
    if (!root) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return
    
    const range = sel.getRangeAt(0)
    if (!root.contains(range.commonAncestorContainer)) return

    // Find first text node in the whole root to compute global offsets
    function findFirstTextNode(el: Node): Text | null {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
      return walker.nextNode() as Text | null
    }

    const firstText = findFirstTextNode(root)
    if (!firstText) return

    // Create ranges from start of root to selection boundaries to compute global character offsets
    const preRange = document.createRange()
    preRange.setStart(firstText, 0)
    preRange.setEnd(range.startContainer, range.startOffset)
    // Normalize CRLF returned by range.toString() to LF so it matches our renderer normalization
    const preStartText = preRange.toString().replace(/\r\n/g, "\n")
    const start = preStartText.length

    const preRangeEnd = document.createRange()
    preRangeEnd.setStart(firstText, 0)
    preRangeEnd.setEnd(range.endContainer, range.endOffset)
    const preEndText = preRangeEnd.toString().replace(/\r\n/g, "\n")
    const end = preEndText.length

    const text = sel.toString().trim()
    if (text.length < 2) return
    const clipped = text.length > 140 ? text.slice(0, 140) : text

    // Prevent duplicate highlights (same exact global range) and avoid nested/overlapping duplicates
    setHighlights(prev => {
      // If exact match exists, noop
      if (prev.some(h => h.start === start && h.end === end)) {
        try { sel.removeAllRanges() } catch {}
        return prev
      }

      // If this selection is already fully contained within an existing highlight, noop
      if (prev.some(h => h.start <= start && h.end >= end)) {
        try { sel.removeAllRanges() } catch {}
        return prev
      }

      // Append and then merge overlapping highlights into disjoint intervals
      const combined = [...prev, { start, end, text: clipped }]
      const merged = mergeHighlights(combined)
      persistHighlights(merged)
      try { sel.removeAllRanges() } catch {}
      return merged
    })
  }

  // Merge overlapping or adjacent highlight intervals. Keeps the text from the earliest interval in a merged group.
  function mergeHighlights(hls: { start: number; end: number; text: string }[]) {
    if (!Array.isArray(hls) || hls.length === 0) return []
    const arr = [...hls].sort((a, b) => a.start - b.start)
    const out: { start: number; end: number; text: string }[] = []
    let cur = { ...arr[0] }
    for (let i = 1; i < arr.length; i++) {
      const it = arr[i]
      if (it.start <= cur.end) {
        // overlapping or contiguous -> extend
        cur.end = Math.max(cur.end, it.end)
        // keep the text from the earliest interval (cur.text)
      } else {
        out.push(cur)
        cur = { ...it }
      }
    }
    out.push(cur)
    return out
  }

  const clearHighlights = () => {
    setHighlights([])
    sessionStorage.removeItem(`module-${moduleId}-q${currentQuestion}-highlights`)
  }

  const options = currentQuestionData.options
    ? currentQuestionData.options.map((t: any, i: number) => ({ key: String.fromCharCode(65 + i), text: t }))
    : []

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
      highlights={highlights}
      onClearHighlights={clearHighlights}
      onSelectionHighlight={handleSelectionHighlight}
      crossouts={crossouts}
      toggleCrossout={toggleCrossout}
      showCalculator={false}
      contentRef={contentRef}
    />
  )
}