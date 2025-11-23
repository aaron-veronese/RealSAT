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
  const desmosContainerRef = useRef<HTMLDivElement>(null)
  const calcRef = useRef<any>(null)



  useEffect(() => {
    if (!isMathModule) return;
    const ensure = () => new Promise<void>((resolve) => {
      if (window.Desmos) return resolve();
      const existing = document.querySelector('script[src^="https://www.desmos.com/api/v1.11/calculator.js"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        return;
      }
      const s = document.createElement("script");
      s.src = "https://www.desmos.com/api/v1.11/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
      s.async = true;
      s.onload = () => resolve();
      document.body.appendChild(s);
    });

    ensure().then(() => {
      if (showCalculator && window.Desmos && desmosContainerRef.current) {
        const mountNode = desmosContainerRef.current;
        // Clean up any previous children
        while (mountNode.firstChild) mountNode.removeChild(mountNode.firstChild);
        const isDark = document.documentElement.classList.contains("dark");
        calcRef.current = window.Desmos.GraphingCalculator(mountNode, {
          keypad: true,
          expressions: true,
          settingsMenu: true,
          expressionsTopbar: true,
          invertedColors: isDark
        });
        try {
          const saved = sessionStorage.getItem("desmos-state");
          if (saved) calcRef.current.setState(JSON.parse(saved));
        } catch {}
        setTimeout(() => { try { calcRef.current?.resize?.() } catch {} }, 150);
      }
    });

    return () => {
      if (calcRef.current) {
        try {
          const state = calcRef.current.getState?.();
          if (state) sessionStorage.setItem("desmos-state", JSON.stringify(state));
        } catch {}
        try { calcRef.current.destroy() } catch {}
        calcRef.current = null;
      }
    };
  }, [showCalculator, isMathModule]);


  useEffect(() => {
    const obs = new MutationObserver(() => {
      if (calcRef.current) {
        try {
          const isDark = document.documentElement.classList.contains("dark");
          calcRef.current.updateSettings({ invertedColors: isDark });
        } catch {}
      }
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);


  const toggleCalculator = () => {
    setShowCalculator(s => !s);
  };

  // No overlay window: Desmos is now always rendered in the split pane

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
      desmosContainerRef={desmosContainerRef}
      renderDesmosInLeft={true}
    />
  )
}