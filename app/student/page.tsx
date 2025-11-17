"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { getCurrentUserId, getCurrentUserName } from "@/lib/auth"
import { 
  getPracticeTests,
} from "@/lib/supabase/test-results"

type PracticeTest = {
  test_id: number
  modules: any
  total_time: number
}

export default function DashboardPage() {
  const router = useRouter()
  const userId = getCurrentUserId()
  const userName = getCurrentUserName()
  
  const [practiceTests, setPracticeTests] = useState<PracticeTest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'practice' | 'progress' | 'leaderboard' | 'history'>('practice')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load practice tests (not completed)
      const { data: tests } = await getPracticeTests(userId)
      setPracticeTests((tests || []) as PracticeTest[])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getModuleStatus = (modules: any, moduleNum: number) => {
    const moduleKey = `module_${moduleNum}`
    const module = modules?.[moduleKey]
    return module?.completed ? 'complete' : 'incomplete'
  }

  const isModulePending = (modules: any, moduleNum: number) => {
    // Module 2 is pending if Module 1 is incomplete
    if (moduleNum === 2) {
      return getModuleStatus(modules, 1) === 'incomplete'
    }
    // Module 4 is pending if Module 3 is incomplete
    if (moduleNum === 4) {
      return getModuleStatus(modules, 3) === 'incomplete'
    }
    return false
  }

  const formatTimeSpent = (seconds: number) => {
    if (seconds === 0) {
      return <Badge variant="outline" className="text-muted-foreground bg-muted/50">Pending</Badge>
    }
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    // If >= 1 hour, show hours:minutes
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    // If >= 1 minute, show minutes:seconds
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    // Just seconds
    return `${secs}s`
  }

  const calculateTimeRemaining = (modules: any) => {
    let remainingMinutes = 0
    
    // Module 1 & 2 - Reading & Writing (32 min each)
    if (getModuleStatus(modules, 1) === 'incomplete') remainingMinutes += 32
    if (getModuleStatus(modules, 2) === 'incomplete') remainingMinutes += 32
    
    // Module 3 & 4 - Math (35 min each)
    if (getModuleStatus(modules, 3) === 'incomplete') remainingMinutes += 35
    if (getModuleStatus(modules, 4) === 'incomplete') remainingMinutes += 35
    
    // Convert to hours:minutes if >= 1 hour
    const hours = Math.floor(remainingMinutes / 60)
    const mins = remainingMinutes % 60
    
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${remainingMinutes}m`
  }

  const renderModuleCell = (test: PracticeTest, moduleNum: number) => {
    const status = getModuleStatus(test.modules, moduleNum)
    const pending = isModulePending(test.modules, moduleNum)
    const isReadingModule = moduleNum === 1 || moduleNum === 2
    
    if (pending) {
      return <Badge variant="outline" className="text-muted-foreground bg-muted/50">Pending</Badge>
    }
    
    if (status === 'complete') {
      return (
        <Badge 
          variant="secondary" 
          className={isReadingModule 
            ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" 
            : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
          }
        >
          Complete
        </Badge>
      )
    }
    
    return (
      <Button
        size="sm"
        onClick={() => router.push(`/test/module/${moduleNum}/intro?testId=${test.test_id}`)}
        className={isReadingModule 
          ? "bg-blue-600 hover:bg-blue-700 text-white" 
          : "bg-orange-500 hover:bg-orange-600 text-white"
        }
      >
        Start Module {moduleNum}
      </Button>
    )
  }

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
        <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold">
            <BookOpen className="h-5 w-5" />
            <span>skoon.</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">{userName}'s Dashboard</h1>
            <p className="text-muted-foreground">Track your progress and start new practice tests</p>
          </div>

          <Card>
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'practice' | 'progress' | 'leaderboard' | 'history')}
            >
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <TabsList className="w-full justify-start sm:w-auto">
                  <TabsTrigger value="practice" className="px-4">Practice</TabsTrigger>
                  <TabsTrigger value="progress" className="px-4">Progress</TabsTrigger>
                  <TabsTrigger value="leaderboard" className="px-4">Leaderboard</TabsTrigger>
                  <TabsTrigger value="history" className="px-4">History</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pb-4">
                <TabsContent value="practice" className="mt-0 min-h-[480px]">
                  {practiceTests.length > 0 ? (
                    <div className="max-h-[480px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-28">Test ID</TableHead>
                            <TableHead className="text-center">Module 1</TableHead>
                            <TableHead className="text-center">Module 2</TableHead>
                            <TableHead className="text-center">Module 3</TableHead>
                            <TableHead className="text-center">Module 4</TableHead>
                            <TableHead className="text-center">Time Spent</TableHead>
                            <TableHead className="text-center">Time Left</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {practiceTests.map((test) => (
                            <TableRow key={test.test_id}>
                              <TableCell className="font-medium">Test {test.test_id}</TableCell>
                              <TableCell className="text-center">{renderModuleCell(test, 1)}</TableCell>
                              <TableCell className="text-center">{renderModuleCell(test, 2)}</TableCell>
                              <TableCell className="text-center">{renderModuleCell(test, 3)}</TableCell>
                              <TableCell className="text-center">{renderModuleCell(test, 4)}</TableCell>
                              <TableCell className="text-center tabular-nums">
                                {formatTimeSpent(test.total_time)}
                              </TableCell>
                              <TableCell className="text-center tabular-nums">
                                {calculateTimeRemaining(test.modules)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                      <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No practice tests available</h3>
                      <p className="text-muted-foreground text-center">
                        You've completed all available tests! Check back later for more.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="progress" className="mt-0 min-h-[480px]">
                  <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-muted-foreground">Progress tab - Coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="leaderboard" className="mt-0 min-h-[480px]">
                  <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-muted-foreground">Leaderboard tab - Coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0 min-h-[480px]">
                  <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-muted-foreground">History tab - Coming soon</p>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  )
}
