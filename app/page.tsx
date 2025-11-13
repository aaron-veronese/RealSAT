"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, TrendingUp, Trophy, Play, RotateCcw } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { getCurrentUserId, getCurrentUserName } from "@/lib/auth"
import { 
  getAvailableTests, 
  getUserTestAttempts, 
  getUserCompletedTests,
  getGlobalLeaderboard,
  countCorrectInModule
} from "@/lib/supabase/test-attempts"
import type { DBTestAttempt } from "@/types/db"
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"

type TimeFilter = 'week' | 'month' | 'all';

export default function DashboardPage() {
  const router = useRouter()
  const userId = getCurrentUserId()
  const userName = getCurrentUserName()
  
  const [availableTestIds, setAvailableTestIds] = useState<number[]>([])
  const [userAttempts, setUserAttempts] = useState<DBTestAttempt[]>([])
  const [completedTests, setCompletedTests] = useState<DBTestAttempt[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('available')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      loadLeaderboard()
    }
  }, [activeTab, timeFilter])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load available tests
      const { data: testIds } = await getAvailableTests()
      setAvailableTestIds((testIds || []) as number[])

      // Load user's test attempts
      const { data: attempts } = await getUserTestAttempts(userId)
      setUserAttempts(attempts || [])

      // Load completed tests
      const { data: completed } = await getUserCompletedTests(userId)
      setCompletedTests(completed || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadLeaderboard = async () => {
    try {
      const { data } = await getGlobalLeaderboard(timeFilter)
      
      // Process data to get highest score per user
      const userBestScores = new Map()
      data?.forEach((attempt: DBTestAttempt) => {
        const currentBest = userBestScores.get(attempt.user_id)
        if (!currentBest || (attempt.total_score || 0) > (currentBest.total_score || 0)) {
          userBestScores.set(attempt.user_id, attempt)
        }
      })
      
      const sortedLeaderboard = Array.from(userBestScores.values())
        .sort((a, b) => b.total_score - a.total_score)
      
      setLeaderboard(sortedLeaderboard)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }

  const getTestStatus = (testId: number) => {
    const attempt = userAttempts.find(a => a.test_id === testId)
    if (!attempt) return 'new'
    if (attempt.test_status === 'COMPLETE') return 'completed'
    return 'in-progress'
  }

  const findNextIncompleteModule = (modules: any): number => {
    // Check modules in order 1 -> 2 -> 3 -> 4
    for (let i = 1; i <= 4; i++) {
      const moduleKey = `module_${i}`
      if (!modules[moduleKey] || !modules[moduleKey].completed) {
        return i
      }
    }
    return 1 // Fallback to module 1
  }

  const handleStartTest = (testId: number) => {
    const status = getTestStatus(testId)
    if (status === 'completed') {
      // View results
      router.push(`/test/results?testId=${testId}`)
    } else if (status === 'in-progress') {
      // Continue test - go directly to next incomplete module
      const attempt = userAttempts.find(a => a.test_id === testId)
      if (attempt) {
        const nextModule = findNextIncompleteModule(attempt.modules)
        router.push(`/test/module/${nextModule}/intro?testId=${testId}`)
      } else {
        router.push(`/test/new?testId=${testId}`)
      }
    } else {
      // Start new test
      router.push(`/test/new?testId=${testId}`)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getModuleScore = (modules: any, moduleKey: string) => {
    const module = modules[moduleKey]
    if (!module) return 0
    return countCorrectInModule(module)
  }

  // Prepare chart data for progress
  const progressChartData = completedTests.map((test, index) => ({
    index: index + 1,
    date: new Date(test.last_modified).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    reading: test.reading_score || 0,
    math: test.math_score || 0,
    total: test.total_score || 0,
  }))

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading dashboard...</div>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold">
            <BookOpen className="h-5 w-5" />
            <span>RealSAT</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">{userName}'s Dashboard</h1>
            <p className="text-muted-foreground">Track your progress and start new practice tests</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="available">Available Tests</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="progress">Your Progress</TabsTrigger>
            </TabsList>

            {/* Available Tests Tab */}
            <TabsContent value="available" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableTestIds.map((testId) => {
                  const status = getTestStatus(testId)
                  return (
                    <Card key={testId}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Test {testId}</span>
                          {status === 'completed' && (
                            <Badge variant="secondary" className="gap-1">
                              <Trophy className="h-3 w-3" /> Completed
                            </Badge>
                          )}
                          {status === 'in-progress' && (
                            <Badge variant="outline" className="gap-1">
                              <RotateCcw className="h-3 w-3" /> In Progress
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {status === 'completed' && 'View your results'}
                          {status === 'in-progress' && 'Continue where you left off'}
                          {status === 'new' && 'Full digital SAT practice test'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>134 minutes total</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span>4 modules, 98 questions</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full gap-2" 
                          onClick={() => handleStartTest(testId)}
                          variant={status === 'completed' ? 'outline' : 'default'}
                        >
                          {status === 'completed' && (
                            <>
                              <Trophy className="h-4 w-4" />
                              View Results
                            </>
                          )}
                          {status === 'in-progress' && (
                            <>
                              <RotateCcw className="h-4 w-4" />
                              Continue Test
                            </>
                          )}
                          {status === 'new' && (
                            <>
                              <Play className="h-4 w-4" />
                              Start Test
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Global Leaderboard</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        variant={timeFilter === 'week' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setTimeFilter('week')}
                      >
                        Last Week
                      </Button>
                      <Button 
                        variant={timeFilter === 'month' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setTimeFilter('month')}
                      >
                        Last Month
                      </Button>
                      <Button 
                        variant={timeFilter === 'all' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setTimeFilter('all')}
                      >
                        All Time
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Rank</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead className="text-right">Test</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Reading</TableHead>
                          <TableHead className="text-right">Math</TableHead>
                          <TableHead className="text-right">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboard.map((entry, index) => (
                          <TableRow 
                            key={entry.id}
                            className={entry.user_id === userId ? 'bg-primary/5 border-primary/20' : ''}
                          >
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="font-medium">
                              {(entry.users as any)?.username || 'Unknown'}
                              {entry.user_id === userId && (
                                <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{entry.test_id}</TableCell>
                            <TableCell className="text-right font-bold">{entry.total_score}</TableCell>
                            <TableCell className="text-right">{entry.reading_score}</TableCell>
                            <TableCell className="text-right">{entry.math_score}</TableCell>
                            <TableCell className="text-right">{formatTime(entry.total_time || 0)}</TableCell>
                          </TableRow>
                        ))}
                        {leaderboard.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              No completed tests yet. Be the first!
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Your Progress Tab */}
            <TabsContent value="progress" className="space-y-4">
              {completedTests.length > 0 ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Score Progress</CardTitle>
                      <CardDescription>Your scores over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={progressChartData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="date" />
                            <YAxis domain={[400, 1600]} />
                            <Tooltip />
                            <Legend />
                            <Area 
                              type="monotone" 
                              dataKey="total" 
                              fill="#3b82f6" 
                              stroke="#3b82f6" 
                              fillOpacity={0.3}
                              name="Total Score"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="reading" 
                              fill="#10b981" 
                              stroke="#10b981" 
                              fillOpacity={0.2}
                              name="Reading"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="math" 
                              fill="#f59e0b" 
                              stroke="#f59e0b" 
                              fillOpacity={0.2}
                              name="Math"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Test History</CardTitle>
                      <CardDescription>All your completed tests</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Test</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Reading</TableHead>
                            <TableHead className="text-right">Math</TableHead>
                            <TableHead className="text-right">M1</TableHead>
                            <TableHead className="text-right">M2</TableHead>
                            <TableHead className="text-right">M3</TableHead>
                            <TableHead className="text-right">M4</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {completedTests.map((test) => (
                            <TableRow key={test.id}>
                              <TableCell>
                                {new Date(test.last_modified).toLocaleDateString()}
                              </TableCell>
                              <TableCell>Test {test.test_id}</TableCell>
                              <TableCell className="text-right font-bold">{test.total_score}</TableCell>
                              <TableCell className="text-right">{test.reading_score}</TableCell>
                              <TableCell className="text-right">{test.math_score}</TableCell>
                              <TableCell className="text-right">
                                {getModuleScore(test.modules, 'module_1')}/27
                              </TableCell>
                              <TableCell className="text-right">
                                {getModuleScore(test.modules, 'module_2')}/27
                              </TableCell>
                              <TableCell className="text-right">
                                {getModuleScore(test.modules, 'module_3')}/22
                              </TableCell>
                              <TableCell className="text-right">
                                {getModuleScore(test.modules, 'module_4')}/22
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/test/results?testId=${test.test_id}`)}
                                >
                                  Review
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No completed tests yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Complete a test to see your progress here
                    </p>
                    <Button onClick={() => setActiveTab('available')}>
                      Browse Available Tests
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Completed Tests Section */}
          {completedTests.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Completed Tests</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedTests.map((test) => (
                  <Card key={test.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Test {test.test_id}</span>
                        <Badge className="gap-1">
                          <Trophy className="h-3 w-3" /> {test.total_score}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Completed {new Date(test.last_modified).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reading & Writing:</span>
                          <span className="font-medium">{test.reading_score}/800</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mathematics:</span>
                          <span className="font-medium">{test.math_score}/800</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time:</span>
                          <span className="font-medium">{formatTime(test.total_time || 0)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => router.push(`/test/results?testId=${test.test_id}`)}
                      >
                        Review Questions
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}