"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calculator, Clock, FileText } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function NewTestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const testId = parseInt(searchParams.get('testId') || '1', 10)

  const handleBeginTest = () => {
    router.push(`/test/module/1/intro?testId=${testId}`)
  }

  const handleJumpToMath = () => {
    router.push(`/test/module/3/intro?testId=${testId}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold">
            <BookOpen className="h-5 w-5" />
            <span>SAT Practice</span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 py-6">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-3">Test {testId}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The SAT consists of two sections: Reading & Writing (modules 1 & 2) and Math (modules 3 & 4).
              You can complete the full test or jump directly to the Math section.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto mb-8">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  Reading & Writing
                </CardTitle>
                <CardDescription className="text-base">Modules 1 & 2</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>64 minutes total (32 min per module)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>54 questions (27 per module)</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground pt-2">
                  Tests your ability to read, analyze, and edit texts across literature, history, social studies, and science.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <Calculator className="h-5 w-5" />
                  </div>
                  Mathematics
                </CardTitle>
                <CardDescription className="text-base">Modules 3 & 4</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>70 minutes total (35 min per module)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>44 questions (22 per module)</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground pt-2">
                  Covers algebra, advanced math, problem-solving, data analysis, geometry, and trigonometry.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
            <Button
              size="lg"
              onClick={handleBeginTest}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Begin Test
            </Button>
            <Button
              size="lg"
              onClick={handleJumpToMath}
              variant="outline"
              className="w-full sm:w-auto border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 px-8"
            >
              <Calculator className="mr-2 h-5 w-5" />
              Jump to Math Section
            </Button>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="gap-2"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
