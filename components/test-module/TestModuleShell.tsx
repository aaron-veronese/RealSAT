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
  const content: any[] = (p.currentQuestionData as any).content || [];
  // For math modules, render all content blocks on the right and reserve the left pane for Desmos
  const leftContent = p.isMathModule ? [] : (content.length > 1 ? content.slice(0, -1) : content);
  const rightContent = p.isMathModule ? content : (content.length > 0 ? [content[content.length - 1]] : []);
  const leftCharCount = leftContent.reduce((acc, b: any) => acc + (b && b.type === 'text' ? String(b.value).length : 0), 0);

  // Resizable Splitter State
  const [splitRatio, setSplitRatio] = React.useState(0.5); // 50% left, 50% right
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);
  const pointerCaptureElement = React.useRef<HTMLElement | null>(null);
  const pointerIdRef = React.useRef<number | null>(null);
  const splitOrientationRef = React.useRef<'horizontal' | 'vertical'>('horizontal');
  // Portrait detection: when true and in reading (English) module, hide the divider
  const [isPortrait, setIsPortrait] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia('(orientation: portrait)');
    const update = () => setIsPortrait(!!m.matches);
    update();
    try { m.addEventListener('change', update); } catch { m.addListener(update); }
    return () => { try { m.removeEventListener('change', update); } catch { m.removeListener(update); } };
  }, []);

  // Update split orientation whenever portrait/math state changes
  // Maintain a ref for the drag handler but compute orientation synchronously for rendering
  const isVertical = isPortrait && p.isMathModule;
  React.useEffect(() => {
    splitOrientationRef.current = isVertical ? 'vertical' : 'horizontal';
  }, [isVertical]);

  // When device orientation changes (portrait <-> landscape), reset the splitter to 50/50
  React.useEffect(() => {
    setSplitRatio(0.5);
  }, [isPortrait]);

  // Drag logic (supports horizontal and vertical modes, unified pointer handling)
  React.useEffect(() => {
    function onMove(e: MouseEvent | any) {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;
      const maybe = e as any;
      const isTouch = maybe && maybe.touches !== undefined;
      if (isTouch) {
        const t = maybe.touches[0];
        if (!t) return;
        clientX = t.clientX;
        clientY = t.clientY;
      } else if (maybe.clientX !== undefined) {
        clientX = maybe.clientX;
        clientY = maybe.clientY;
      } else {
        // fallback if shape is unexpected
        return;
      }

      let ratio = 0.5;
      if (splitOrientationRef.current === 'vertical') {
        const y = clientY - rect.top;
        ratio = y / rect.height;
      } else {
        const x = clientX - rect.left;
        ratio = x / rect.width;
      }
      ratio = Math.max(0.05, Math.min(0.95, ratio));
      if (isTouch) maybe.preventDefault?.();
      setSplitRatio(ratio);
    }

    function onUp(e?: MouseEvent | TouchEvent | PointerEvent) {
      isDragging.current = false;
      document.body.style.cursor = '';
      try {
        // If we previously captured the pointer on the divider element, release it now
        if (pointerCaptureElement.current && pointerIdRef.current != null) {
          try { pointerCaptureElement.current.releasePointerCapture?.(pointerIdRef.current); } catch {}
        }
        pointerCaptureElement.current = null;
        pointerIdRef.current = null;
      } catch {}
    }

    window.addEventListener('mousemove', onMove as any);
    window.addEventListener('touchmove', onMove as any, { passive: false } as any);
    window.addEventListener('pointermove', onMove as any);
    window.addEventListener('mouseup', onUp as any);
    window.addEventListener('touchend', onUp as any);
    window.addEventListener('pointerup', onUp as any);

    return () => {
      window.removeEventListener('mousemove', onMove as any);
      try { window.removeEventListener('touchmove', onMove as any); } catch {}
      try { window.removeEventListener('pointermove', onMove as any); } catch {}
      window.removeEventListener('mouseup', onUp as any);
      try { window.removeEventListener('touchend', onUp as any); } catch {}
      try { window.removeEventListener('pointerup', onUp as any); } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
        <div className="w-full flex justify-center">
          <div className="w-full" style={{ maxWidth: 1920 }}>
            <div className="px-8 flex h-12 items-center relative">
                <div className="flex-1 mr-4" style={{ maxWidth: 'calc(50% - 4.5rem)' }}>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="header-full">Question {p.currentQuestion} of {p.totalQuestions}</span>
                  <span className="header-short">Question {p.currentQuestion}</span>
                  <span className="header-full">{p.percentComplete}% complete</span>
                  <span className="header-short">{p.percentComplete}%</span>
                </div>
                <Progress value={p.percentComplete} className="h-2 bg-gray-100 dark:bg-gray-700" fillColor={p.isMathModule ? 'var(--color-secondary)' : 'var(--color-primary)'} />
              </div>
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className={`${p.timeLeft < 300 ? "text-[var(--color-secondary)] font-medium" : ""}`}>{p.formatClock(p.timeLeft)}</span>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-4">
                {p.isEnglishModule && p.highlights.length > 0 && (
                  <Button variant="outline" size="sm" onClick={p.onClearHighlights}>Clear</Button>
                )}
                {p.isMathModule && p.toggleCalculator && (
                  <Button variant={p.showCalculator ? "secondary" : "outline"} onClick={p.toggleCalculator}>
                    <Calculator className="h-4 w-4 min-[800px]:mr-2" />
                    <span className="hidden min-[800px]:inline">Calculator</span>
                  </Button>
                )}
                <Button variant={p.currentQuestionData.flagged ? "quaternary" : "outline"} onClick={p.toggleFlag} className={p.currentQuestionData.flagged ? "bg-yellow-400 hover:bg-yellow-500 text-white border-yellow-400" : ""}>
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
        <div className="w-full" style={{ maxWidth: 1920 }}>
          <div
            className="split-container w-full flex flex-row gap-0 rounded"
            style={{ minHeight: 'calc(100vh - 160px)', maxHeight: 'calc(100vh - 160px)', height: 'calc(100vh - 160px)' }}
            ref={containerRef}
            onMouseUp={p.onSelectionHighlight}
          >
            <div
              className="split-left flex flex-col px-8 border-r border-gray-700 overflow-auto"
              style={(() => {
                if (isVertical) return { minHeight: '100%', maxHeight: '100%', height: `${splitRatio * 100}%`, width: '100%', transition: isDragging.current ? 'none' : 'height 0.2s' };
                return { minHeight: '100%', maxHeight: '100%', width: `${splitRatio * 100}%`, transition: isDragging.current ? 'none' : 'width 0.2s' };
              })()}
            >
              {/* In vertical portrait math mode, show Desmos in the TOP pane and content in the BOTTOM pane */}
              {isVertical && p.isMathModule ? (
                (p.showCalculator && p.desmosContainerRef) ? (
                  <div className="w-full h-full" style={{ minHeight: 0, height: '100%' }} ref={p.desmosContainerRef} />
                ) : (
                  // top pane with calculator hidden: show an empty placeholder
                  <div />
                )
              ) : (
                // Non-vertical or non-math: original left content or Desmos-in-left when applicable
                ( (!isVertical) && p.isMathModule && p.showCalculator && p.renderDesmosInLeft && p.desmosContainerRef) ? (
                  <div className="w-full h-full" style={{ minHeight: 0, height: '100%' }} ref={p.desmosContainerRef} />
                ) : leftContent.length > 0 ? (
                  <div ref={p.contentRef}>
                    <QuestionContentRenderer
                      content={leftContent}
                      testNumber={1}
                      highlights={p.isEnglishModule ? p.highlights : []}
                      baseCharIndex={0}
                      enableFormatting={p.isEnglishModule}
                    />
                  </div>
                ) : (
                  p.isMathModule ? <div /> : <div className="whitespace-pre-wrap text-muted-foreground">No content available for this question.</div>
                )
              )}
            </div>
            {/* Movable Divider (hidden for English module in portrait mode) */}
            {!(p.isEnglishModule && isPortrait) && (() => {
              const dividerIsVertical = isVertical;
              return (
                <div
                  className="split-divider"
                  style={dividerIsVertical ? { height: 12, cursor: 'row-resize', background: 'var(--border-color, rgba(0,0,0,0.08))', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' as any } : { width: 12, cursor: 'col-resize', background: 'var(--border-color, rgba(0,0,0,0.08))', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' as any }}
                  onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
                    isDragging.current = true;
                    // capture on the element itself (use currentTarget) to ensure we can track pointer moves
                    try { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); pointerCaptureElement.current = e.currentTarget as HTMLElement; pointerIdRef.current = e.pointerId; } catch {}
                    document.body.style.cursor = dividerIsVertical ? 'row-resize' : 'col-resize';
                    e.preventDefault();
                  }}
                  onMouseDown={e => {
                    isDragging.current = true;
                    document.body.style.cursor = dividerIsVertical ? 'row-resize' : 'col-resize';
                    e.preventDefault();
                  }}
                  onTouchStart={e => { isDragging.current = true; e.preventDefault(); document.body.style.cursor = dividerIsVertical ? 'row-resize' : 'col-resize'; }}
                  role="separator"
                  aria-orientation={dividerIsVertical ? 'horizontal' : 'vertical'}
                  tabIndex={0}
                >
                  {dividerIsVertical ? (
                    <div style={{ height: 4, width: 32, borderRadius: 2, background: 'var(--color-tertiary, #888)', opacity: 0.5 }} />
                  ) : (
                    <div style={{ width: 4, height: 32, borderRadius: 2, background: 'var(--color-tertiary, #888)', opacity: 0.5 }} />
                  )}
                </div>
              )
            })()}
            <aside
              className="split-right flex flex-col p-8 overflow-auto"
              style={(() => {
                if (isVertical) return { minHeight: '100%', maxHeight: '100%', height: `${(1 - splitRatio) * 100}%`, width: '100%', transition: isDragging.current ? 'none' : 'height 0.2s' };
                return { minHeight: '100%', maxHeight: '100%', width: `${(1 - splitRatio) * 100}%`, transition: isDragging.current ? 'none' : 'width 0.2s' };
              })()}
            >
              {/* In portrait math the bottom pane contains the question content + answers */}
              {isVertical ? (
                <>
                  {content.length > 0 && (
                    <div className="mb-4" ref={p.contentRef}>
                      <QuestionContentRenderer content={content} testNumber={1} highlights={p.isEnglishModule ? p.highlights : []} baseCharIndex={0} enableFormatting={p.isEnglishModule} />
                    </div>
                  )}

                  {!p.isFreeResponse ? (
                    <RadioGroup value={p.currentQuestionData.userAnswer} onValueChange={p.updateAnswer}>
                      {p.options.map(opt => (
                        <div key={opt.key} className={`flex items-center space-x-2 rounded-md border p-3 ${p.currentQuestionData.userAnswer === opt.key ? '' : 'border-gray-200'} hover:brightness-75`} onClick={() => p.updateAnswer(opt.key)} style={p.currentQuestionData.userAnswer === opt.key ? { borderColor: 'var(--color-tertiary)', backgroundColor: 'color-mix(in srgb, var(--color-tertiary) 8%, transparent)' } : undefined}>
                          <RadioGroupItem value={opt.key} id={`option-${opt.key}`} className="sr-only" />
                          <Label htmlFor={`option-${opt.key}`} className="flex-1 cursor-pointer text-base font-normal">
                            <div className="flex items-center">
                              <div
                                className={`mr-3 h-8 w-8 flex items-center justify-center rounded-full border text-sm font-medium ${p.currentQuestionData.userAnswer === opt.key ? 'text-[var(--color-light-bg)] dark:text-[var(--color-dark-bg)]' : 'text-muted-foreground'}`}
                                style={p.currentQuestionData.userAnswer === opt.key ? { backgroundColor: 'var(--color-tertiary)', borderColor: 'var(--color-tertiary)' } : undefined}
                              >
                                {opt.key}
                              </div>
                              <div className={`flex-1 ${p.crossouts && p.crossouts.includes(opt.key) ? 'line-through text-muted-foreground' : ''}`} style={p.crossouts && p.crossouts.includes(opt.key) ? { textDecorationThickness: '2px', textDecorationColor: 'var(--color-secondary)' } : undefined}>
                                <RenderedContent content={opt.text} testNumber={1} />
                              </div>
                            </div>
                          </Label>
                          <div className="flex-shrink-0 ml-2 flex items-center">
                            <button type="button" onClick={(e) => { e.stopPropagation(); p.toggleCrossout && p.toggleCrossout(opt.key) }} aria-pressed={p.crossouts ? p.crossouts.includes(opt.key) : false} className={`h-8 w-8 inline-flex items-center justify-center rounded border ${p.crossouts && p.crossouts.includes(opt.key) ? '' : 'border-gray-200 dark:border-gray-600 text-muted-foreground'}`} style={p.crossouts && p.crossouts.includes(opt.key) ? { backgroundColor: 'var(--color-secondary)', borderColor: 'var(--color-secondary)', color: 'white' } : undefined}>
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
                </>
              ) : (
                <>
                  {rightContent.length > 0 && (
                    <div className="mb-4" ref={p.contentRef}>
                      <QuestionContentRenderer content={rightContent} testNumber={1} highlights={p.isEnglishModule ? p.highlights : []} baseCharIndex={leftCharCount} enableFormatting={p.isEnglishModule} />
                    </div>
                  )}

                  {!p.isFreeResponse ? (
                    <RadioGroup value={p.currentQuestionData.userAnswer} onValueChange={p.updateAnswer}>
                      {p.options.map(opt => (
                        <div key={opt.key} className={`flex items-center space-x-2 rounded-md border p-3 ${p.currentQuestionData.userAnswer === opt.key ? '' : 'border-gray-200'} hover:brightness-75`} onClick={() => p.updateAnswer(opt.key)} style={p.currentQuestionData.userAnswer === opt.key ? { borderColor: 'var(--color-tertiary)', backgroundColor: 'color-mix(in srgb, var(--color-tertiary) 8%, transparent)' } : undefined}>
                          <RadioGroupItem value={opt.key} id={`option-${opt.key}`} className="sr-only" />
                          <Label htmlFor={`option-${opt.key}`} className="flex-1 cursor-pointer text-base font-normal">
                            <div className="flex items-center">
                              <div
                                className={`mr-3 h-8 w-8 flex items-center justify-center rounded-full border text-sm font-medium ${p.currentQuestionData.userAnswer === opt.key ? 'text-[var(--color-light-bg)] dark:text-[var(--color-dark-bg)]' : 'text-muted-foreground'}`}
                                style={p.currentQuestionData.userAnswer === opt.key ? { backgroundColor: 'var(--color-tertiary)', borderColor: 'var(--color-tertiary)' } : undefined}
                              >
                                {opt.key}
                              </div>
                              <div className={`flex-1 ${p.crossouts && p.crossouts.includes(opt.key) ? 'line-through text-muted-foreground' : ''}`} style={p.crossouts && p.crossouts.includes(opt.key) ? { textDecorationThickness: '2px', textDecorationColor: 'var(--color-secondary)' } : undefined}>
                                <RenderedContent content={opt.text} testNumber={1} />
                              </div>
                            </div>
                          </Label>
                          <div className="flex-shrink-0 ml-2 flex items-center">
                            <button type="button" onClick={(e) => { e.stopPropagation(); p.toggleCrossout && p.toggleCrossout(opt.key) }} aria-pressed={p.crossouts ? p.crossouts.includes(opt.key) : false} className={`h-8 w-8 inline-flex items-center justify-center rounded border ${p.crossouts && p.crossouts.includes(opt.key) ? '' : 'border-gray-200 dark:border-gray-600 text-muted-foreground'}`} style={p.crossouts && p.crossouts.includes(opt.key) ? { backgroundColor: 'var(--color-secondary)', borderColor: 'var(--color-secondary)', color: 'white' } : undefined}>
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
                </>
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
              max-height: calc(100vh - 160px) !important;
            }

            /* Let each pane scroll individually when stacked (portrait). */
            .split-container > .split-left,
            .split-container > .split-right {
              width: 100% !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: auto !important; /* each pane scrolls when content overflows */
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
          <div className="w-full" style={{ maxWidth: 1920 }}>
            <div className="px-8 flex h-12 items-center justify-between">
              <Button
                onClick={p.goToPreviousQuestion}
                disabled={p.currentQuestion === 1}
                variant="secondary"
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              {!p.isLastQuestion && (
                <Button
                  onClick={p.goToReview}
                  variant="tertiary"
                  className="gap-2"
                >
                  <ListChecks className="h-4 w-4 mr-1" />
                  Review Module
                </Button>
              )}
              {!p.isLastQuestion ? (
                <Button
                  onClick={p.goToNextQuestion}
                  variant="primary"
                  className="gap-2"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={p.goToReview}
                  variant="tertiary"
                  className="gap-2"
                >
                  <ListChecks className="h-4 w-4 mr-1" />
                  Review Module
                </Button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
