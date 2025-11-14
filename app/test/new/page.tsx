"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calculator, Clock, Home } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function NewTestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const testId = parseInt(searchParams.get('testId') || '1', 10)

  const handleBeginFullTest = () => {
    router.push(`/test/module/1/intro?testId=${testId}`)
  }

  const handleJumpToMath = () => {
    router.push(`/test/module/3/intro?testId=${testId}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto flex h-10 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold">
            <BookOpen className="h-5 w-5" />
            <span>SAT Practice</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 py-6">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Test {testId}</h1>
            <p className="text-muted-foreground">Begin a full SAT practice test with 4 modules</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  Module 1
                </CardTitle>
                <CardDescription>Reading & Writing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>32 minutes</span>
                  </p>
                  <p>27 multiple choice questions</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  Module 2
                </CardTitle>
                <CardDescription>Reading & Writing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>32 minutes</span>
                  </p>
                  <p>27 multiple choice questions</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                    <Calculator className="h-4 w-4" />
                  </div>
                  Module 3
                </CardTitle>
                <CardDescription>Mathematics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>35 minutes</span>
                  </p>
                  <p>22 questions (some fill-in-the-blank)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                    <Calculator className="h-4 w-4" />
                  </div>
                  Module 4
                </CardTitle>
                <CardDescription>Mathematics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>35 minutes</span>
                  </p>
                  <p>22 questions (MCQ & free-response)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Test Information</CardTitle>
              <CardDescription>What to expect during your practice test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Test Structure</h3>
                <p className="text-sm text-muted-foreground">
                  The digital SAT consists of four modules: two Reading & Writing and two Math modules. All modules are presented with consistent difficulty.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Timing</h3>
                <p className="text-sm text-muted-foreground">
                  The total test time is 134 minutes (2 hours and 14 minutes). You'll have 32 minutes for each Reading & Writing module and 35 minutes for each Math module.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Scoring</h3>
                <p className="text-sm text-muted-foreground">
                  Your score will range from 400-1600, with each section (Reading & Writing and Math) scored from 200-800. Your performance on both modules in each section contributes to your section score.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button
                onClick={handleBeginFullTest}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white sm:flex-1"
              >
                Begin Full Test
              </Button>
              <Button
                onClick={handleJumpToMath}
                size="lg"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white sm:flex-1"
              >
                Jump to Math Section
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
