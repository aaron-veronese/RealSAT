"use client"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useTestModuleBase } from "./useTestModuleBase"
import type { TestQuestion } from "@/lib/types"
import { TestModuleShell } from "./TestModuleShell"

export function EnglishModuleRunner({ moduleId }: { moduleId: number }) {
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

  const contentRef = useRef<HTMLDivElement | null>(null)

  const [highlights, setHighlights] = useState<
    { partIndex: number; lineIndex: number; start: number; end: number; text: string }[]
  >([])
  const [isFillFocused, setIsFillFocused] = useState(false)

  // Load highlights for current question
  useEffect(() => {
    const key = `module-${moduleId}-q${currentQuestion}-highlights`
    try {
      const saved = sessionStorage.getItem(key)
      setHighlights(saved ? JSON.parse(saved) : [])
    } catch {
      setHighlights([])
    }
  }, [moduleId, currentQuestion])

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

    const container = range.startContainer
    if (container.nodeType !== Node.TEXT_NODE) return

    const lineSpan = (container as any).parentElement
    if (!lineSpan || !lineSpan.hasAttribute("data-line-index")) return

    const partSpan = lineSpan.parentElement
    if (!partSpan || !partSpan.hasAttribute("data-part-index")) return

    const contentDiv = partSpan.closest("[data-content-index]")
    if (!contentDiv) return

    const contentIndex = contentDiv.getAttribute("data-content-index")
    const localPartIndex = parseInt(partSpan.getAttribute("data-part-index")!)
    
    let globalPartIndex = localPartIndex
    if (contentIndex === "main") {
      globalPartIndex = 1000 + localPartIndex
    } else {
      globalPartIndex = parseInt(contentIndex!) * 100 + localPartIndex
    }

    const lineIndex = parseInt(lineSpan.getAttribute("data-line-index")!)

    // Get all text nodes in the line
    const textNodes: Text[] = []
    let child = lineSpan.firstChild
    while (child) {
      if (child.nodeType === Node.TEXT_NODE) {
        textNodes.push(child as Text)
      } else if (child.nodeName === 'MARK') {
        // Include text inside mark elements
        let markChild = child.firstChild
        while (markChild) {
          if (markChild.nodeType === Node.TEXT_NODE) {
            textNodes.push(markChild as Text)
          }
          markChild = markChild.nextSibling
        }
      }
      child = child.nextSibling
    }

    let start = 0
    let found = false
    for (const node of textNodes) {
      if (node === container) {
        start += range.startOffset
        found = true
        break
      } else {
        start += node.textContent!.length
      }
    }
    
    if (!found) return

    const end = start + (range.endOffset - range.startOffset)
    const text = sel.toString().trim()
    
    if (text.length < 2) return
    
    const clipped = text.length > 140 ? text.slice(0, 140) : text

    // Add to existing highlights instead of replacing
    setHighlights(prev => {
      const next = [...prev, { partIndex: globalPartIndex, lineIndex, start, end, text: clipped }]
      persistHighlights(next)
      return next
    })

    try { sel.removeAllRanges() } catch {}
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
      showCalculator={false}
      contentRef={contentRef}
    />
  )
}