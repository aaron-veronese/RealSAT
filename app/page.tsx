"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookOpen, BarChart, Trophy, Zap, ArrowRight, Sparkles, Target, Brain } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Floating Header */}
      <header className="sticky top-4 z-50 mx-4 mt-4">
        <div className="max-w-6xl mx-auto backdrop-blur-xl bg-background/80 border border-border/40 rounded-2xl shadow-lg">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                RealSAT
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button 
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25"
              >
                Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section with Gradient */}
        <section className="relative py-24 px-4 overflow-hidden">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-6">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Authentic Digital SAT Practice
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Ace the SAT
              </span>
              <br />
              <span className="text-foreground">with Confidence</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Full-length practice tests, instant feedback, and powerful analytics. 
              Everything you need to reach your target score.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => router.push('/dashboard')} 
                className="text-lg px-10 py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl shadow-blue-500/30 rounded-xl"
              >
                Start Practicing Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">98</div>
                <div className="text-sm text-muted-foreground">Questions per test</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">134</div>
                <div className="text-sm text-muted-foreground">Minutes of practice</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">1600</div>
                <div className="text-sm text-muted-foreground">Perfect score</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Glassmorphism Cards */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Built for Success
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">Everything you need in one powerful platform</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature Cards with Glassmorphism */}
              <div className="group relative backdrop-blur-xl bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 mb-4 shadow-lg shadow-blue-500/30">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Full-Length Tests</h3>
                <p className="text-muted-foreground">
                  Complete authentic practice tests with real timing and format
                </p>
              </div>

              <div className="group relative backdrop-blur-xl bg-gradient-to-br from-purple-500/5 to-purple-500/10 border border-purple-500/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 mb-4 shadow-lg shadow-purple-500/30">
                  <BarChart className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Smart Analytics</h3>
                <p className="text-muted-foreground">
                  Track progress with detailed score breakdowns and performance charts
                </p>
              </div>

              <div className="group relative backdrop-blur-xl bg-gradient-to-br from-pink-500/5 to-pink-500/10 border border-pink-500/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 mb-4 shadow-lg shadow-pink-500/30">
                  <Trophy className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Global Leaderboard</h3>
                <p className="text-muted-foreground">
                  Compete with students worldwide and see where you rank
                </p>
              </div>

              <div className="group relative backdrop-blur-xl bg-gradient-to-br from-orange-500/5 to-orange-500/10 border border-orange-500/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 mb-4 shadow-lg shadow-orange-500/30">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Instant Feedback</h3>
                <p className="text-muted-foreground">
                  Get immediate scores and explanations after every module
                </p>
              </div>

              <div className="group relative backdrop-blur-xl bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 mb-4 shadow-lg shadow-green-500/30">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Question Review</h3>
                <p className="text-muted-foreground">
                  Deep dive into every question with detailed answer explanations
                </p>
              </div>

              <div className="group relative backdrop-blur-xl bg-gradient-to-br from-cyan-500/5 to-cyan-500/10 border border-cyan-500/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 mb-4 shadow-lg shadow-cyan-500/30">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Real Experience</h3>
                <p className="text-muted-foreground">
                  Practice with the exact interface used on test day
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Test Structure - Modern Split Design */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Test Format
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">Two sections, four modules, one goal</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Reading & Writing */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative backdrop-blur-xl bg-background/90 border border-blue-500/30 rounded-3xl p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Reading & Writing</h3>
                      <p className="text-muted-foreground">Modules 1 & 2</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-semibold">64 minutes</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                      <span className="text-muted-foreground">Questions</span>
                      <span className="font-semibold">54 total</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                      <span className="text-muted-foreground">Score Range</span>
                      <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">200-800</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Math */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative backdrop-blur-xl bg-background/90 border border-orange-500/30 rounded-3xl p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 shadow-lg shadow-orange-500/30">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Mathematics</h3>
                      <p className="text-muted-foreground">Modules 3 & 4</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-semibold">70 minutes</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                      <span className="text-muted-foreground">Questions</span>
                      <span className="font-semibold">44 total</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20">
                      <span className="text-muted-foreground">Score Range</span>
                      <span className="font-bold text-lg bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">200-800</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Gradient Background */}
        <section className="relative py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Ready to Begin?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of students mastering the SAT with our comprehensive practice platform
            </p>
            <Button 
              size="lg" 
              onClick={() => router.push('/dashboard')} 
              className="text-lg px-10 py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl shadow-blue-500/30 rounded-xl"
            >
              Open Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t backdrop-blur-xl bg-background/80 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RealSAT
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 RealSAT • Your path to SAT success
          </p>
        </div>
      </footer>
    </div>
  )
}