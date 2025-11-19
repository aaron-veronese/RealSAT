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
  desmosContainerRef?: React.RefObject<HTMLDivElement>
  renderDesmosInLeft?: boolean
}

export default function TestModuleShell(p: Props) {
  const content: any[] = (p.currentQuestionData as any).content || []
  // For math modules, render all content blocks on the right and reserve the left pane for Desmos
  const leftContent = p.isMathModule ? [] : (content.length > 1 ? content.slice(0, -1) : content)
  const rightContent = p.isMathModule ? content : (content.length > 0 ? [content[content.length - 1]] : [])
  const leftCharCount = leftContent.reduce((acc, b: any) => acc + (b && b.type === 'text' ? String(b.value).length : 0), 0)

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
        <div className="w-full flex justify-center">
          <div className="w-full" style={{ maxWidth: 1500 }}>
            <div className="px-8 flex h-10 items-center relative">
                <div className="flex-1 mr-4" style={{ maxWidth: 'calc(50% - 4.5rem)' }}>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="header-full">Question {p.currentQuestion} of {p.totalQuestions}</span>
                  <span className="header-short">Question {p.currentQuestion}</span>
                  <span className="header-full">{p.percentComplete}% complete</span>
                  <span className="header-short">{p.percentComplete}%</span>
                </div>
                <Progress value={p.percentComplete} className="h-2 bg-gray-100 dark:bg-gray-700" fillColor={p.isMathModule ? 'var(--color-math)' : 'var(--color-reading)'} />
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
          </div>
        </div>
      </header>

      <main className="flex-1 pt-6 pb-12 w-full flex justify-center">
        <div className="w-full" style={{ maxWidth: 1500 }}>
          <div className="split-container w-full flex flex-row gap-0 rounded" style={{ minHeight: 'calc(100vh - 160px)', maxHeight: 'calc(100vh - 160px)', height: 'calc(100vh - 160px)' }} ref={p.contentRef} onMouseUp={p.onSelectionHighlight}>
            <div className="split-left w-1/2 flex flex-col p-8 border-r border-gray-700 overflow-auto" style={{ minHeight: '100%', maxHeight: '100%' }}>
              {p.isMathModule && p.showCalculator && p.renderDesmosInLeft && p.desmosContainerRef ? (
                <div className="w-full h-full" style={{ minHeight: '100%', height: '100%' }} ref={p.desmosContainerRef} />
              ) : leftContent.length > 0 ? (
                <QuestionContentRenderer
                  content={leftContent}
                  testNumber={1}
                  highlights={p.isEnglishModule ? p.highlights : []}
                  baseCharIndex={0}
                  enableFormatting={p.isEnglishModule}
                />
              ) : (
                // For math modules the left pane should be blank (Desmos occupies this area when opened).
                p.isMathModule ? <div /> : <div className="whitespace-pre-wrap text-muted-foreground">No content available for this question.</div>
              )}
            </div>
            <aside className="split-right w-1/2 flex flex-col p-8 overflow-auto" style={{ minHeight: '100%', maxHeight: '100%' }}>
              {rightContent.length > 0 && (
                <div className="mb-4">
                    <QuestionContentRenderer content={rightContent} testNumber={1} highlights={p.isEnglishModule ? p.highlights : []} baseCharIndex={leftCharCount} enableFormatting={p.isEnglishModule} />
                </div>
              )}
              {!p.isFreeResponse ? (
                <RadioGroup value={p.currentQuestionData.userAnswer} onValueChange={p.updateAnswer}>
                  {p.options.map(opt => (
                    <div key={opt.key} className={`flex items-center space-x-2 rounded-md border p-3 ${p.currentQuestionData.userAnswer === opt.key ? '' : 'border-gray-200'}`} onClick={() => p.updateAnswer(opt.key)} style={p.currentQuestionData.userAnswer === opt.key ? { borderColor: 'var(--color-reading)', backgroundColor: 'var(--color-light-highlight)' } : undefined}>
                      {/* Keep the hidden RadioGroupItem for accessibility but replace the visible radio UI with a custom circle showing the letter */}
                      <RadioGroupItem value={opt.key} id={`option-${opt.key}`} className="sr-only" />
                            <Label htmlFor={`option-${opt.key}`} className="flex-1 cursor-pointer text-base font-normal">
                              <div className="flex items-center">
                                <div
                                  className={`mr-3 h-8 w-8 flex items-center justify-center rounded-full border text-sm font-medium ${p.currentQuestionData.userAnswer === opt.key ? 'text-white' : 'text-muted-foreground'}`}
                                  style={p.currentQuestionData.userAnswer === opt.key ? { backgroundColor: 'var(--color-light-highlight)', borderColor: 'var(--color-reading)' } : undefined}
                                >
                                  {opt.key}
                                </div>
                                <div className={`flex-1 ${p.crossouts && p.crossouts.includes(opt.key) ? 'line-through text-muted-foreground' : ''}`} style={p.crossouts && p.crossouts.includes(opt.key) ? { textDecorationThickness: '2px', textDecorationColor: 'var(--color-math)' } : undefined}>
                                  <RenderedContent content={opt.text} testNumber={1} />
                                </div>
                              </div>
                            </Label>
                      <div className="flex-shrink-0 ml-2 flex items-center">
                        <button type="button" onClick={(e) => { e.stopPropagation(); p.toggleCrossout && p.toggleCrossout(opt.key) }} aria-pressed={p.crossouts ? p.crossouts.includes(opt.key) : false} className={`h-8 w-8 inline-flex items-center justify-center rounded border ${p.crossouts && p.crossouts.includes(opt.key) ? 'bg-[var(--color-tertiary)] text-white border-[var(--color-tertiary)]' : 'border-gray-200 dark:border-gray-600 text-muted-foreground'}`}>
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
      </main>

      <style jsx>{`
        /* Default: show full header, hide short */
        .header-full { display: inline; }
        .header-short { display: none; }

        /* Stack layout when viewport is portrait or square (height >= width) */
        @media (orientation: portrait), (max-aspect-ratio: 1/1) {
          .split-container {
            flex-direction: column !important;
            height: auto !important;
            max-height: calc(100vh - 160px) !important;
            overflow: auto !important; /* single scroll for stacked layout */
          }

          .split-container > .split-left,
          .split-container > .split-right {
            width: 100% !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important; /* let parent handle scrolling */
            border-right: none !important;
            border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));
          }

          .split-container > .split-right {
            border-bottom: none !important; /* avoid extra rule at end */
          }

          /* Header: show short form in portrait */
          .header-full { display: none !important; }
          .header-short { display: inline !important; }
        }
      `}</style>

      {p.calculatorOverlay}

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
        <div className="w-full flex justify-center">
          <div className="w-full" style={{ maxWidth: 1500 }}>
            <div className="px-8 flex h-10 items-center justify-between">
              <Button size="sm" onClick={p.goToPreviousQuestion} disabled={p.currentQuestion === 1} className="gap-2 bg-orange-400 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              {!p.isLastQuestion && (
                <Button size="sm" onClick={p.goToReview} className="gap-2 bg-sky-500 hover:bg-sky-600 text-white">
                  <ListChecks className="h-4 w-4 mr-1" />
                  Review Module
                </Button>
              )}
              {!p.isLastQuestion ? (
                <Button size="sm" onClick={p.goToNextQuestion} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={p.goToReview} className="gap-2 bg-sky-500 hover:bg-sky-600 text-white">
                  <ListChecks className="h-4 w-4 mr-1" />
                  Review Module
                </Button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
