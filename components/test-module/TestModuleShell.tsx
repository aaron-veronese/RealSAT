"use client"
import React from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calculator, ChevronLeft, ChevronRight, Clock, Flag, ListChecks, X as XIcon } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { RenderedContent } from "@/components/rendered-content"
import QuestionContentRenderer from "@/components/questions/QuestionContentRenderer"
import type { TestQuestion } from "@/lib/types"

interface Props {
  currentQuestionData: (TestQuestion & { flagged?: boolean })
  options: { key: string; text: any }[]
  currentQuestion: number
  totalQuestions: number
  percentComplete: number
  timeLeft: number
  formatClock: (n: number) => string
  isLastQuestion: boolean
  isMathModule: boolean
  isEnglishModule: boolean
  updateAnswer: (a: string) => void
  toggleFlag: () => void
  goToNextQuestion: () => void
  goToPreviousQuestion: () => void
  goToReview: () => void
  isFreeResponse: boolean
  isFillFocused: boolean
  setIsFillFocused: (v: boolean) => void
  highlights: any[]
  onClearHighlights?: () => void
  onSelectionHighlight?: (e?: any) => void
  crossouts?: string[]
  toggleCrossout?: (key: string) => void
  showCalculator: boolean
  toggleCalculator?: () => void
  calculatorOverlay?: React.ReactNode
  contentRef?: React.RefObject<HTMLDivElement>
}

export default function TestModuleShell(p: Props) {
  const content: any[] = (p.currentQuestionData as any).content || []
  const leftContent = content.length > 1 ? content.slice(0, -1) : content
  const rightContent = content.length > 0 ? [content[content.length - 1]] : []

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[1280px] mx-auto px-4 flex h-10 items-center relative">
          <div className="flex-1 mr-4" style={{ maxWidth: 'calc(50% - 4.5rem)' }}>
            <div className="flex justify-between items-center text-sm mb-1">
              <span>Question {p.currentQuestion} of {p.totalQuestions}</span>
              <span>{p.percentComplete}% complete</span>
            </div>
            <Progress value={p.percentComplete} className="h-2 bg-gray-100 dark:bg-gray-700 [&>div]:bg-blue-600" />
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className={`${p.timeLeft < 300 ? "text-orange-400 font-medium" : ""}`}>{p.formatClock(p.timeLeft)}</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {p.isEnglishModule && p.highlights.length > 0 && (
              <Button variant="outline" size="sm" onClick={p.onClearHighlights}>Clear</Button>
            )}
            {p.isMathModule && p.toggleCalculator && (
              <Button variant={p.showCalculator ? "default" : "outline"} size="sm" onClick={p.toggleCalculator}>
                <Calculator className="h-4 w-4 min-[800px]:mr-2" />
                <span className="hidden min-[800px]:inline">Calculator</span>
              </Button>
            )}

            <Button variant={p.currentQuestionData.flagged ? "default" : "outline"} size="sm" onClick={p.toggleFlag} className={p.currentQuestionData.flagged ? "bg-yellow-400 hover:bg-yellow-500 text-white border-yellow-400" : ""}>
              <Flag className="h-4 w-4 min-[800px]:mr-2" />
              <span className="hidden min-[800px]:inline">{p.currentQuestionData.flagged ? "Flagged" : "Flag"}</span>
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 pt-6 pb-12">
        <div className="w-full h-full flex justify-center">
          <div className="w-full max-w-[1280px] px-4">
            <div className="w-full h-[calc(100vh-96px)] flex flex-col">
              <div className="flex-1 h-full overflow-hidden rounded">
                <div className="h-full w-full flex flex-col md:flex-row gap-6">
                  <div className="flex-1 overflow-auto p-6" ref={p.contentRef} onMouseUp={p.onSelectionHighlight}>
                    {leftContent.length > 0 ? (
                      <QuestionContentRenderer
                        content={leftContent}
                        testNumber={1}
                        highlights={p.isEnglishModule ? p.highlights : []}
                        basePartIndex={0}
                        enableFormatting={p.isEnglishModule}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap text-muted-foreground">No content available for this question.</div>
                    )}
                  </div>

                  <aside className="md:w-[420px] w-full shrink-0 md:sticky md:top-16 p-6 overflow-auto">
                    {rightContent.length > 0 && (
                      <div className="mb-4">
                        <QuestionContentRenderer content={rightContent} testNumber={1} highlights={p.isEnglishModule ? p.highlights : []} basePartIndex={0} enableFormatting={p.isEnglishModule} />
                      </div>
                    )}

                    {!p.isFreeResponse ? (
                      <RadioGroup value={p.currentQuestionData.userAnswer} onValueChange={p.updateAnswer}>
                        {p.options.map(opt => (
                          <div key={opt.key} className={`flex items-center space-x-2 rounded-md border p-3 ${p.currentQuestionData.userAnswer === opt.key ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-200'}`} onClick={() => p.updateAnswer(opt.key)}>
                            <RadioGroupItem value={opt.key} id={`option-${opt.key}`} className="flex-shrink-0" />
                            <Label htmlFor={`option-${opt.key}`} className="flex-1 cursor-pointer text-base font-normal">
                              <span className="font-medium mr-2">{opt.key}.</span>
                              <span className={`flex-1 ${p.crossouts && p.crossouts.includes(opt.key) ? 'line-through text-muted-foreground' : ''}`}>
                                <RenderedContent content={opt.text} testNumber={1} />
                              </span>
                            </Label>

                            <div className="flex-shrink-0 ml-2 h-full">
                              <button type="button" onClick={(e) => { e.stopPropagation(); p.toggleCrossout && p.toggleCrossout(opt.key) }} aria-pressed={p.crossouts ? p.crossouts.includes(opt.key) : false} className={`h-full px-2 inline-flex items-center justify-center rounded border ${p.crossouts && p.crossouts.includes(opt.key) ? 'bg-[var(--color-tertiary)] text-white border-[var(--color-tertiary)]' : 'border-gray-200 dark:border-gray-600 text-muted-foreground'}`}>
                                <XIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="space-y-4 mt-6">
                        <div className="max-w-[200px]">
                          <Input value={p.currentQuestionData.userAnswer} onChange={(e) => { const value = e.target.value.replace(/[^0-9./-]/g, ""); const maxLength = value.startsWith("-") ? 6 : 5; if (value.length <= maxLength) p.updateAnswer(value) }} onFocus={() => p.setIsFillFocused(true)} onBlur={() => p.setIsFillFocused(false)} className="text-lg font-medium text-center" placeholder={p.isFillFocused || p.currentQuestionData.userAnswer ? "" : "Your answer"} />
                        </div>
                      </div>
                    )}
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {p.calculatorOverlay}

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[1280px] mx-auto px-4 flex h-12 items-center justify-between">
          <Button onClick={p.goToPreviousQuestion} disabled={p.currentQuestion === 1} className="gap-2 bg-orange-400 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          {!p.isLastQuestion && (
            <Button onClick={p.goToReview} className="gap-2 bg-sky-500 hover:bg-sky-600 text-white">
              <ListChecks className="h-4 w-4 mr-1" />
              Review Module
            </Button>
          )}
          {!p.isLastQuestion ? (
            <Button onClick={p.goToNextQuestion} className="gap-2 bg-blue-600 hover:bg-blue-700">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={p.goToReview} className="gap-2 bg-sky-500 hover:bg-sky-600 text-white">
              <ListChecks className="h-4 w-4 mr-1" />
              Review Module
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
