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
    // Compute character offsets by walking the DOM and counting text nodes and <br/>s
    // This avoids relying on the browser's range.toString() behavior which can differ
    // across implementations and can miscount newlines when there are multiple consecutive breaks.
    const computeNodeLengths = (node: Node, lengthMap: Map<Node, number>): number => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.nodeValue || '').replace(/\r\n/g, '\n')
        lengthMap.set(node, text.length)
        return text.length
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element
        if (el.tagName === 'BR') {
          lengthMap.set(node, 1)
          return 1
        }
        let total = 0
        for (let i = 0; i < node.childNodes.length; i++) {
          total += computeNodeLengths(node.childNodes[i], lengthMap)
        }
        lengthMap.set(node, total)
        return total
      }
      lengthMap.set(node, 0)
      return 0
    }

    const computeNodeStarts = (node: Node, lengthMap: Map<Node, number>, startMap: Map<Node, number>, start = 0) => {
      startMap.set(node, start)
      if (node.nodeType === Node.TEXT_NODE) {
        return
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element
        if (el.tagName === 'BR') return
        let cur = start
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i]
          computeNodeStarts(child, lengthMap, startMap, cur)
          cur += (lengthMap.get(child) || 0)
        }
      }
    }

    const lengthMap = new Map<Node, number>()
    computeNodeLengths(root, lengthMap)
    const startMap = new Map<Node, number>()
    computeNodeStarts(root, lengthMap, startMap, 0)

    const getOffsetFromContainer = (container: Node, offsetInContainer: number): number => {
      if (container.nodeType === Node.TEXT_NODE) {
        const nodeLen = lengthMap.get(container) || 0
        const off = Math.min(offsetInContainer, nodeLen)
        return (startMap.get(container) || 0) + off
      }

      // If the container is an element, the offset is the childIndex (insert before child at offset)
      const el = container as Element
      if (offsetInContainer === 0) return (startMap.get(container) || 0)
      const childIndex = offsetInContainer - 1
      const child = container.childNodes[childIndex]
      if (!child) return (startMap.get(container) || 0)
      return (startMap.get(child) || 0) + (lengthMap.get(child) || 0)
    }

    const start = getOffsetFromContainer(range.startContainer, range.startOffset)
    const end = getOffsetFromContainer(range.endContainer, range.endOffset)

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