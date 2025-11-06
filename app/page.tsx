import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, BookOpen } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <BookOpen className="h-5 w-5" />
            <span>SAT Mirror</span>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container py-12 md:py-24 lg:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
              Practice for the Digital SAT
            </h1>
            <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
              Experience a realistic simulation of the College Board Bluebook digital SAT app
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/test/new">
                <Button size="lg" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Start New Test
                </Button>
              </Link>
            </div>
          </div>
        </section>
        <section className="container py-8 md:py-12 lg:py-16">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Realistic Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Four modules that mirror the official test format with accurate timing and question types.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Real SAT Scoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get scored using the same methodology as the official digital SAT with scaled scores.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Comprehensive Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Review your answers, flag questions for later study, and understand your performance across all
                  question types.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SAT Mirror. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">Not affiliated with College Board or the official SAT exam.</p>
        </div>
      </footer>
    </div>
  )
}
