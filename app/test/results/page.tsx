"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Home } from "lucide-react"
import { calculateTestScore } from "@/lib/scoring"
import type { Test, TestModule, TestScore } from "@/lib/types"

export default function TestResultsPage() {
  const [testScore, setTestScore] = useState<TestScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Clear the test-in-progress flag when viewing results
    sessionStorage.removeItem("test-in-progress")

    // Calculate the test score based on the completed modules
    const calculateScore = () => {
      // In a real app, we would load the test data from a database
      // For this demo, we'll create a mock test with the modules from session storage
      const mockTest: Test = {
        id: "test-1",
        startedAt: new Date(),
        modules: [],
      }

      // Try to reconstruct the modules from session storage
      const modules: TestModule[] = []

      for (let i = 1; i <= 4; i++) {
        const moduleQuestions = sessionStorage.getItem(`module-${i}-questions`)
        if (moduleQuestions) {
          const questions = JSON.parse(moduleQuestions)
          modules.push({
            id: `module-${i}`,
            testId: mockTest.id,
            moduleNumber: i,
            moduleType: i <= 2 ? "reading" : "math",
            isAdaptive: i === 2 || i === 4,
            startedAt: new Date(),
            completedAt: new Date(),
            questions,
          })
        }
      }

      // If we have modules, calculate the score
      if (modules.length > 0) {
        mockTest.modules = modules
        const score = calculateTestScore(modules)
        setTestScore(score)
      }

      setIsLoading(false)

      // Clean up any other test-related session storage items
      for (let i = 1; i <= 4; i++) {
        sessionStorage.removeItem(`module-${i}-timer-end`)
        // Don't remove the questions as we need them for the results page
        // sessionStorage.removeItem(`module-${i}-questions`)
      }
    }

    calculateScore()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Calculating your score...</h1>
          <p className="text-muted-foreground">Please wait while we process your test results.</p>
        </div>
      </div>
    )
  }

  if (!testScore) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No test data found</h1>
          <p className="text-muted-foreground mb-4">We couldn't find any completed test data.</p>
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <span>SAT Mirror</span>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container py-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Your SAT Practice Test Results</h1>
            <p className="text-muted-foreground">
              Here's how you performed on your practice test. Use these results to focus your study efforts.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-4xl">{testScore.total}</CardTitle>
              <CardDescription>Total Score (out of 1600)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Reading & Writing</h3>
                      <p className="text-sm text-muted-foreground">Modules 1 & 2</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{testScore.readingWriting.scaledScore}</div>
                      <p className="text-sm text-muted-foreground">
                        Raw Score: {testScore.readingWriting.rawScore} / 54
                      </p>
                    </div>
                  </div>
                  <Progress value={(testScore.readingWriting.scaledScore - 200) / 6} className="h-2" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Mathematics</h3>
                      <p className="text-sm text-muted-foreground">Modules 3 & 4</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{testScore.math.scaledScore}</div>
                      <p className="text-sm text-muted-foreground">Raw Score: {testScore.math.rawScore} / 44</p>
                    </div>
                  </div>
                  <Progress value={(testScore.math.scaledScore - 200) / 6} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>
                Take another practice test to improve your skills and track your progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/" className="flex-1">
                  <Button className="w-full gap-2">
                    Take Another Test
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
