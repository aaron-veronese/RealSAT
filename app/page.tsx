"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Video, Calculator, Trophy, Users, ClipboardCheck, Building2, Palette, ArrowRight, CheckCircle2, Star, Play } from "lucide-react"
import { TopPerformers } from '@/components/TopPerformers'
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">skoon.</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section with Background */}
      <section className="relative py-32 px-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 hero-animated">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
            One Platform.<br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Every User.
            </span>
          </h1>
          <p className="text-2xl text-muted-foreground mb-4">
            skoon. transforms Digital SAT preparation for students, educators, and institutions.
          </p>
          <p className="text-lg text-muted-foreground mb-12">
            Choose your role to explore how skoon. works
          </p>
        </div>
      </section>

      {/* Tabbed Content */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto gap-2 bg-muted p-2 rounded-xl">
              <TabsTrigger 
                value="students" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white py-4"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                <span className="font-semibold">Students</span>
              </TabsTrigger>
              <TabsTrigger 
                value="teachers"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white py-4"
              >
                <Users className="h-5 w-5 mr-2" />
                <span className="font-semibold">Teachers</span>
              </TabsTrigger>
              <TabsTrigger 
                value="schools"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white py-4"
              >
                <Building2 className="h-5 w-5 mr-2" />
                <span className="font-semibold">Schools</span>
              </TabsTrigger>
            </TabsList>

            {/* Students Tab */}
            <TabsContent value="students" className="mt-8">
              <div className="space-y-8">
                {/* Hero Section for Students */}
                  <div className="text-center mb-12">
                  <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Self-Study with Expert Guidance
                  </h2>
                  <p className="text-muted-foreground text-xl max-w-3xl mx-auto mb-8">
                    Master the Digital SAT with video explanations from a real SAT teacher—no boring textbook answers, 
                    just practical hacks and time-saving strategies.
                  </p>
                  <div className="flex gap-3 justify-center mt-6">
                    <Button 
                    size="lg" 
                    onClick={() => router.push('/test/module/1/intro?testId=1')} 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-6 text-lg shadow-lg"
                  >
                    Take a Free Test Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                    <Button size="lg" variant="outline" onClick={() => router.push('/findatutor')} className="px-10 py-6">
                      Find your SAT Tutor
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">No account required to start • Sign up to save your progress</p>
                </div>

                {/* Screenshots Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {/* Test Interface Screenshot */}
                  <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-600/5 hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg mb-4 flex items-center justify-center">
                        <Calculator className="h-16 w-16 text-blue-600 dark:text-blue-300" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">Real Test Interface</h3>
                      <p className="text-sm text-muted-foreground">
                        Practice with the exact same interface and Desmos calculator as the real Digital SAT
                      </p>
                    </CardContent>
                  </Card>

                  {/* Dashboard Screenshot */}
                  <Card className="border-blue-500/20 bg-gradient-to-br from-purple-500/5 to-purple-600/5 hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-lg mb-4 flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-purple-600 dark:text-purple-300" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">Your Dashboard</h3>
                      <p className="text-sm text-muted-foreground">
                        Track all your tests, progress, and achievements in one clean dashboard
                      </p>
                    </CardContent>
                  </Card>

                  {/* Progress Charts Screenshot */}
                  <Card className="border-blue-500/20 bg-gradient-to-br from-pink-500/5 to-pink-600/5 hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="aspect-video bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800 rounded-lg mb-4 flex items-center justify-center">
                        <Trophy className="h-16 w-16 text-pink-600 dark:text-pink-300" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">Progress Charts</h3>
                      <p className="text-sm text-muted-foreground">
                        Visualize your score improvement over time with detailed analytics
                      </p>
                    </CardContent>
                  </Card>

                  {/* Video Explanation GIF Placeholder */}
                  <Card className="border-blue-500/20 bg-gradient-to-br from-orange-500/5 to-orange-600/5 hover:shadow-xl transition-shadow lg:col-span-2">
                    <CardContent className="p-6">
                      <div className="aspect-video bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-lg mb-4 flex items-center justify-center relative">
                        <Video className="h-20 w-20 text-orange-600 dark:text-orange-300" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/90 dark:bg-black/90 flex items-center justify-center">
                            <Play className="h-8 w-8 text-orange-600 dark:text-orange-300 ml-1" />
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-lg mb-2">Expert Video Explanations</h3>
                      <p className="text-sm text-muted-foreground">
                        Watch a real SAT teacher explain every problem with shortcuts, hacks, and time-saving techniques—not lengthy textbook explanations
                      </p>
                    </CardContent>
                  </Card>

                  {/* Leaderboard Screenshot */}
                  <Card className="border-blue-500/20 bg-gradient-to-br from-teal-500/5 to-teal-600/5 hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="aspect-video bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900 dark:to-teal-800 rounded-lg mb-4 flex items-center justify-center">
                        <Star className="h-16 w-16 text-teal-600 dark:text-teal-300" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">Global Leaderboards</h3>
                      <p className="text-sm text-muted-foreground">
                        Compete with students worldwide and see how you rank on each test
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Feature List */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex gap-4 p-6 rounded-xl border bg-gradient-to-br from-blue-500/5 to-purple-500/5 hover:shadow-md transition-shadow">
                    <Video className="h-10 w-10 text-blue-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-lg mb-2">No Boring Explanations</h3>
                      <p className="text-muted-foreground text-sm">
                        Get quick videos from a real teacher with proven shortcuts—not wall-of-text proper math and english explanations from Bluebook
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-6 rounded-xl border bg-gradient-to-br from-purple-500/5 to-pink-500/5 hover:shadow-md transition-shadow">
                    <Calculator className="h-10 w-10 text-purple-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-lg mb-2">Authentic Test Experience</h3>
                      <p className="text-muted-foreground text-sm">
                        Same interface, timing, and calculator as the real Digital SAT—practice like it's test day
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-6 rounded-xl border bg-gradient-to-br from-pink-500/5 to-orange-500/5 hover:shadow-md transition-shadow">
                    <Trophy className="h-10 w-10 text-pink-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-lg mb-2">Track & Compete</h3>
                      <p className="text-muted-foreground text-sm">
                        Global leaderboards and detailed analytics show your progress and keep you motivated
                      </p>
                    </div>
                  </div>
                </div>

                {/* Final CTA */}
                <div className="text-center pt-8">
                  <div className="flex justify-center gap-3">
                    <Button 
                      size="lg" 
                      onClick={() => router.push('/test/module/1/intro?testId=1')} 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-lg shadow-lg"
                    >
                      Start Your Free Practice Test
                      <ArrowRight className="ml-2 h-6 w-6" />
                    </Button>
                    <Button size="lg" variant="outline" className="px-12 py-6" onClick={() => router.push('/findatutor')}>
                      Find a Tutor
                      <ArrowRight className="ml-2 h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Teachers Tab */}
            <TabsContent value="teachers" className="mt-8">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="grid grid-cols-1 gap-4">
                  <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
                    <CardContent className="p-6">
                      <Users className="h-10 w-10 text-emerald-500 mb-3" />
                      <h3 className="font-bold mb-2">All Classes in One View</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage 1-on-1 and group classes. See who completed tests and track progress instantly.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-emerald-500/20 bg-gradient-to-br from-teal-500/5 to-emerald-600/5">
                    <CardContent className="p-6">
                      <ClipboardCheck className="h-10 w-10 text-emerald-500 mb-3" />
                      <h3 className="font-bold mb-2">Class-Wide Test Results</h3>
                      <p className="text-sm text-muted-foreground">
                        Click any test to view aggregated results—every student's answers and scores in one place
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-600/5 to-teal-600/5">
                    <CardContent className="p-6">
                      <Star className="h-10 w-10 text-emerald-500 mb-3" />
                      <h3 className="font-bold mb-2">Filter & Analyze</h3>
                      <p className="text-sm text-muted-foreground">
                        Filter by student name, question type, or difficulty. Student emails are private—only names visible.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Manage Classes & Track Success</h2>
                    <p className="text-muted-foreground text-lg">
                      Whether you teach 1-on-1 or manage multiple classes, skoon. gives you a complete 
                      view of student performance and progress.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold mb-1">Unified Class Management</h3>
                        <p className="text-sm text-muted-foreground">
                          All your classes and students organized in one intuitive dashboard
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold mb-1">Instant Test Analytics</h3>
                        <p className="text-sm text-muted-foreground">
                          See which questions students missed and identify learning gaps immediately
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold mb-1">Privacy Protected</h3>
                        <p className="text-sm text-muted-foreground">
                          Teachers can filter by student name but cannot see email addresses
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button size="lg" onClick={() => router.push('/teacher')} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white w-full">
                      Access Teacher Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                    <Button size="lg" variant="outline" onClick={() => router.push('/tutor')} className="w-full">
                      Become a Tutor
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Schools Tab */}
            <TabsContent value="schools" className="mt-8">
              <div className="space-y-8">
                <div className="text-center max-w-3xl mx-auto">
                  <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Complete School Management</h2>
                  <p className="text-muted-foreground text-lg">
                    Administrators organize programs and track results. School owners control branding, billing, and permissions.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Administrators */}
                  <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold">For Administrators</h3>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex gap-3">
                          <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Create & Organize Classrooms</p>
                            <p className="text-sm text-muted-foreground">Set up classes and manage student-teacher assignments</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Invite Students & Teachers</p>
                            <p className="text-sm text-muted-foreground">Send email invitations to add users to your school</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Assign & Track Tests</p>
                            <p className="text-sm text-muted-foreground">Assign tests to classes and view aggregated score analytics</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Question Type Insights</p>
                            <p className="text-sm text-muted-foreground">Identify which question types each class struggles with most</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button size="lg" onClick={() => router.push('/school')} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                        Admin Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                        <Button size="lg" onClick={() => router.push('/admin')} variant="outline" className="w-full">
                          Owner Dashboard
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* School Owners */}
                  <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-600/5">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                          <Palette className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold">For School Owners</h3>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex gap-3">
                          <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Custom Branding</p>
                            <p className="text-sm text-muted-foreground">Upload your logo and customize theme colors</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Payment Management</p>
                            <p className="text-sm text-muted-foreground">Add and manage payment methods for your school subscription</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Create Admin Accounts</p>
                            <p className="text-sm text-muted-foreground">Grant administrator access to trusted staff members</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Full Permission Control</p>
                            <p className="text-sm text-muted-foreground">Manage access levels and permissions across your school</p>
                          </div>
                        </div>
                      </div>

                      <Button size="lg" onClick={() => router.push('/admin')} variant="outline" className="w-full border-2 border-orange-500/50 hover:bg-orange-500/10">

      {/* Top Performers */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Top Performers</h2>
            <p className="text-muted-foreground">Top scores and most improved students and schools</p>
          </div>
          <TopPerformers />
        </div>
      </section>
                        Owner Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6 mt-auto bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">skoon.</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2024 skoon. • Complete Digital SAT Platform for Students, Teachers, and Schools
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
