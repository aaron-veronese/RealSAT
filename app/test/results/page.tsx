"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChartContainer } from "@/components/ui/chart"
import { Home, Gem, ChevronUp, Lock } from "lucide-react"
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
import { calculateTestScore } from "@/lib/scoring"
import { RenderedContent } from "@/components/rendered-content"
import QuestionContentRenderer from "@/components/questions/QuestionContentRenderer"
import { ThemeToggle } from "@/components/theme-toggle"
import { SignupModal } from "@/components/signup-modal"
import { isCurrentUserTemp, getCurrentUserId } from "@/lib/auth"
import { unlockVideo, requestVideo as requestVideoAPI, getUserVideoData, getQuestionVideos } from "@/lib/supabase/video-requests"
import type { Test, TestModule, TestScore } from "@/lib/types"

type StoredProgressEntry = {
  id: string
  completedAt: number
  reading: number
  math: number
  testId: number
}

type ProgressChartPoint = StoredProgressEntry & {
  total: number
  index: number
  label: string
}

const SCORE_DOMAIN: [number, number] = [0, 1600]

type TooltipContentProps = {
  active?: boolean
  payload?: Array<{ payload?: ProgressChartPoint }>
}

type LegendContentProps = {
  payload?: ReadonlyArray<{ value?: string | number; color?: string }>
}

const fetchUserTestResults = async (): Promise<StoredProgressEntry[]> => {
  try {
    // Import dynamically to avoid SSR issues
    const { supabase } = await import("@/lib/supabase/client")
    const { getCurrentUserId } = await import("@/lib/auth")
    const { calculateTestScore } = await import("@/lib/scoring")
    
    const userId = getCurrentUserId()
    
    // Fetch all test attempts for this user
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    
    if (error || !data) {
      console.error('Error fetching user test results:', error)
      return []
    }
    
    // Convert database results to StoredProgressEntry format
    return data.map((attempt: any) => {
      const dbModules = attempt.modules || {}
      
      // Build modules array for scoring
      const modulesForScoring = Object.entries(dbModules).map(([key, mod]: [string, any]) => ({
        id: key,
        testId: String(attempt.test_id),
        moduleNumber: mod.module_number,
        moduleType: mod.module_number <= 2 ? "reading" : "math",
        isAdaptive: mod.module_number === 2 || mod.module_number === 4,
        startedAt: new Date(),
        completedAt: new Date(),
        questions: (mod.questions || []).map((q: any) => ({
          correctAnswer: q.correct_answer,
          userAnswer: q.user_answer,
          options: q.options || [],
        }))
      }))
      
      const score = calculateTestScore(modulesForScoring as any)
      
      return {
        id: attempt.id,
        completedAt: new Date(attempt.created_at).getTime(),
        reading: score.readingWriting.scaledScore,
        math: score.math.scaledScore,
        testId: attempt.test_id,
      }
    })
  } catch (err) {
    console.error('Error in fetchUserTestResults:', err)
    return []
  }
}

const formatAxisLabel = (timestamp: number): string => {
  try {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  } catch {
    return ""
  }
}

const deriveTestIdFromModules = (modules: TestModule[]): number | null => {
  for (const module of modules) {
    if (!module?.testId) continue
    const match = module.testId.match(/\d+/)
    if (match?.[0]) {
      const parsed = Number(match[0])
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }
  return null
}

// Safe math expression evaluator for free response answers
function evaluateMathExpression(expression: string): number | null {
  try {
    // Remove whitespace
    const expr = expression.replace(/\s+/g, '')

    // Handle fractions like "30/20"
    if (expr.includes('/')) {
      const parts = expr.split('/')
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0])
        const denominator = parseFloat(parts[1])
        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          return numerator / denominator
        }
      }
      return null
    }

    // Handle basic decimal numbers
    const num = parseFloat(expr)
    return isNaN(num) ? null : num

  } catch {
    return null
  }
}

// Compare answers, handling mathematical evaluation for free response
function answersMatch(userAnswer: string, correctAnswer: string, isFreeResponse: boolean): boolean {
  if (!isFreeResponse) {
    // For multiple choice, exact string match
    return userAnswer === correctAnswer
  }

  // For free response, try mathematical evaluation
  const userValue = evaluateMathExpression(userAnswer)
  const correctValue = evaluateMathExpression(correctAnswer)

  if (userValue === null || correctValue === null) {
    // If evaluation fails, fall back to string comparison
    return userAnswer === correctAnswer
  }

  // Compare with small tolerance for floating point precision
  const tolerance = 0.0001
  return Math.abs(userValue - correctValue) < tolerance
}

// Format time in seconds to MM:SS format
function formatTimeSpent(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function TestResultsPage() {
  const [testScore, setTestScore] = useState<TestScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [modules, setModules] = useState<TestModule[]>([])
  const { resolvedTheme } = useTheme()
  const [userResults, setUserResults] = useState<StoredProgressEntry[]>([])
  // New: DB fetch state
  const [dbError, setDbError] = useState<string | null>(null)

  // Animation states
  const [animatedTotal, setAnimatedTotal] = useState(0)
  const [animatedReading, setAnimatedReading] = useState(0)
  const [animatedMath, setAnimatedMath] = useState(0)
  const [animatedModuleScores, setAnimatedModuleScores] = useState([0, 0, 0, 0])
  const [animatedProgressBars, setAnimatedProgressBars] = useState([0, 0, 0, 0])
  const [animatedReadingDash, setAnimatedReadingDash] = useState(0)
  const [animatedMathDash, setAnimatedMathDash] = useState(0)

  const [gemsBalance, setGemsBalance] = useState(0)
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['all'])
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [userVideoRequests, setUserVideoRequests] = useState<string[]>([])
  const [questionVideos, setQuestionVideos] = useState<Map<string, string>>(new Map()) // questionId -> video URL
  const [timeSortOrder, setTimeSortOrder] = useState<'desc' | 'asc' | 'none'>('none')
  const [leaderboardScrollTop, setLeaderboardScrollTop] = useState(0)
  const [activeTab, setActiveTab] = useState<'score' | 'leaderboard' | 'progress'>('score')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [isTempUser, setIsTempUser] = useState(false)
  const searchParams = useSearchParams()
  const sectionParam = (searchParams?.get('section') || 'full').toLowerCase() as 'full' | 'rw' | 'math'
  const testIdParam = searchParams?.get('testId') ? parseInt(searchParams.get('testId')!) : null
  const isRWView = sectionParam === 'rw'
  const isMathView = sectionParam === 'math'
  const isFullView = sectionParam === 'full'
  const [leaderboardSort, setLeaderboardSort] = useState<{column: string, direction: 'asc' | 'desc'}>({
    column: isRWView ? 'readingScore' : isMathView ? 'mathScore' : 'score',
    direction: 'desc'
  })

  const scrollToTop = useCallback(() => {
    if (typeof window === "undefined") return
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const handleTabChange = useCallback((value: string) => {
    // Allow all tabs - show blurred content with signup prompt for temp users
    setActiveTab(value as 'score' | 'leaderboard' | 'progress')
  }, [])

  const handleSignupSuccess = () => {
    setShowSignupModal(false)
    setIsTempUser(false)
    // Refresh page to update with real user data
    window.location.reload()
  }

  useEffect(() => {
    // Check if current user is temp
    const tempStatus = isCurrentUserTemp()
    console.log('[RESULTS] isTempUser check:', tempStatus, 'userId:', getCurrentUserId())
    setIsTempUser(tempStatus)

    // Load user's gems balance and video requests
    if (!tempStatus) {
      const loadUserVideoData = async () => {
        const userId = getCurrentUserId()
        if (userId) {
          const { videoRequests, gemsBalance: gems } = await getUserVideoData(userId)
          setUserVideoRequests(videoRequests)
          setGemsBalance(gems)
        }
      }
      loadUserVideoData()
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 320)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  useEffect(() => {
    if (!testScore) return

    let isMounted = true

    const loadResults = async () => {
      const computedCompletedAt = (() => {
        const latest = modules.reduce((acc, module) => {
          if (!module?.completedAt) return acc
          const time = module.completedAt instanceof Date ? module.completedAt.getTime() : new Date(module.completedAt).getTime()
          return Math.max(acc, Number.isFinite(time) ? time : acc)
        }, 0)
        return latest || Date.now()
      })()

      try {
        const fetched = await fetchUserTestResults()
        const sanitized = fetched
          .map((entry) => ({
            id: entry.id,
            completedAt: Number(entry.completedAt),
            reading: Number(entry.reading),
            math: Number(entry.math),
            testId: Number(entry.testId),
          }))
          .filter(
            (entry): entry is StoredProgressEntry =>
              Boolean(entry.id) &&
              Number.isFinite(entry.completedAt) &&
              Number.isFinite(entry.reading) &&
              Number.isFinite(entry.math) &&
              Number.isFinite(entry.testId),
          )

        const resolvedTestId = deriveTestIdFromModules(modules) ?? sanitized[sanitized.length - 1]?.testId ?? 1

        const currentEntry: StoredProgressEntry = {
          id: `current-${Date.now()}`,
          completedAt: computedCompletedAt,
          reading: testScore.readingWriting.scaledScore,
          math: testScore.math.scaledScore,
          testId: resolvedTestId,
        }

        const merged = [...sanitized]

        const duplicate = merged.some(
          (entry) =>
            Math.abs(entry.completedAt - currentEntry.completedAt) < 60000 &&
            entry.reading === currentEntry.reading &&
            entry.math === currentEntry.math,
        )
        
        console.log('[LOAD RESULTS] Duplicate check:', duplicate, 'DB entries:', sanitized.length, 'Current entry:', currentEntry)
        
        if (!duplicate) {
          merged.push(currentEntry)
        }

        merged.sort((a, b) => a.completedAt - b.completedAt)

        if (isMounted) {
          setUserResults(merged)
        }
      } catch (error) {
        console.error("Failed to load user results", error)
        if (isMounted) {
          const fallbackTestId = deriveTestIdFromModules(modules) ?? 1
          setUserResults([
            {
              id: `current-${Date.now()}`,
              completedAt: computedCompletedAt,
              reading: testScore.readingWriting.scaledScore,
              math: testScore.math.scaledScore,
              testId: fallbackTestId,
            },
          ])
        }
      }
    }

    loadResults()

    return () => {
      isMounted = false
    }
  }, [testScore, modules])

  // Load video availability for all questions (batch request)
  useEffect(() => {
    const loadQuestionVideos = async () => {
      if (modules.length === 0) return

      const allQuestionIds = modules.flatMap(module =>
        module.questions.map(q => q.id)
      )

      const videoMap = await getQuestionVideos(allQuestionIds)
      setQuestionVideos(videoMap)
    }

    loadQuestionVideos()
  }, [modules])

  const chartData = useMemo<ProgressChartPoint[]>(() => {
    console.log('[CHART DATA] isTempUser:', isTempUser, 'userResults.length:', userResults.length)
    
    // For temp users, show seed data with increasing scores
    if (isTempUser) {
      const seedData: StoredProgressEntry[] = [
        {
          id: "seed-1",
          completedAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
          reading: 480,
          math: 490,
          testId: 1,
        },
        {
          id: "seed-2",
          completedAt: Date.now() - 50 * 24 * 60 * 60 * 1000,
          reading: 510,
          math: 520,
          testId: 2,
        },
        {
          id: "seed-3",
          completedAt: Date.now() - 40 * 24 * 60 * 60 * 1000,
          reading: 540,
          math: 550,
          testId: 3,
        },
        {
          id: "seed-4",
          completedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
          reading: 560,
          math: 575,
          testId: 4,
        },
        {
          id: "seed-5",
          completedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
          reading: 590,
          math: 600,
          testId: 5,
        },
        {
          id: "seed-6",
          completedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
          reading: 610,
          math: 625,
          testId: 6,
        },
        {
          id: "seed-7",
          completedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
          reading: 640,
          math: 650,
          testId: 7,
        },
        {
          id: "seed-8",
          completedAt: Date.now(),
          reading: testScore?.readingWriting.scaledScore || 670,
          math: testScore?.math.scaledScore || 680,
          testId: 8,
        },
      ]
      
      return seedData
        .slice()
        .sort((a, b) => a.completedAt - b.completedAt)
        .map((entry, index) => ({
          ...entry,
          total: entry.reading + entry.math,
          index,
          label: formatAxisLabel(entry.completedAt),
        }))
    }
    
    // Count entries that start with "current-" (these are from the current session)
    const currentSessionEntries = userResults.filter(r => r.id.startsWith('current-'))
    const dbEntries = userResults.filter(r => !r.id.startsWith('current-'))
    
    console.log('[CHART DATA] DB entries:', dbEntries.length, 'Current session:', currentSessionEntries.length)
    
    // For authenticated users with only 1 DB entry (first test ever), add baseline
    if (!isTempUser && dbEntries.length === 1) {
      // This is their first test ever - add a baseline seed
      const realResult = dbEntries[0]
      const baselineSeed: StoredProgressEntry = {
        id: "baseline",
        completedAt: realResult.completedAt - 30 * 24 * 60 * 60 * 1000, // 30 days before
        reading: 200,
        math: 200,
        testId: 0,
      }
      
      console.log('[CHART DATA] First test (1 DB entry), adding baseline seed')
      
      return [baselineSeed, realResult]
        .slice()
        .sort((a, b) => a.completedAt - b.completedAt)
        .map((entry, index) => ({
          ...entry,
          total: entry.reading + entry.math,
          index,
          label: formatAxisLabel(entry.completedAt),
        }))
    }
    
    // For all other cases, only show DB entries (no current session entries)
    return dbEntries
      .slice()
      .sort((a, b) => a.completedAt - b.completedAt)
      .map((entry, index) => ({
        ...entry,
        total: entry.reading + entry.math,
        index,
        label: formatAxisLabel(entry.completedAt),
      }))
    
    // For authenticated users with multiple results, show only real data
    return userResults
      .slice()
      .sort((a, b) => a.completedAt - b.completedAt)
      .map((entry, index) => ({
        ...entry,
        total: entry.reading + entry.math,
        index,
        label: formatAxisLabel(entry.completedAt),
      }))
  }, [userResults, isTempUser, testScore])

  const xTicks = useMemo(() => chartData.map((entry) => entry.index), [chartData])

  const xDomain = useMemo<[number, number]>(() => [0, Math.max(chartData.length - 1, 0)], [chartData])

  const chartColors = useMemo(() => {
    const isDarkTheme = resolvedTheme === "dark"
    return {
      reading: {
        stroke: "#3b82f6",
        fill: "rgba(59,130,246,0.18)",
      },
      math: {
        stroke: "#f97316",
        fill: isDarkTheme ? "rgba(249,115,22,0.2)" : "rgba(249,115,22,0.15)",
      },
    }
  }, [resolvedTheme])

  const renderTooltip = useCallback(
    ({ active, payload }: TooltipContentProps) => {
      if (!active || !payload || payload.length === 0) {
        return null
      }

      const point = payload[0]?.payload as ProgressChartPoint | undefined
      if (!point) {
        return null
      }

      return (
        <div className="space-y-2 rounded-md border border-border bg-background px-3 py-2 text-xs shadow-sm">
          <div className="font-semibold text-muted-foreground">
            Test {point.testId}
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-2.5 w-2.5 rounded-full border border-border bg-white"
            />
            <span className="font-medium text-foreground">Total: {point.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: chartColors.math.stroke }}
            />
            <span className="text-foreground">Math: {point.math}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: chartColors.reading.stroke }}
            />
            <span className="text-foreground">Reading &amp; Writing: {point.reading}</span>
          </div>
        </div>
      )
    },
    [chartColors.math.stroke, chartColors.reading.stroke],
  )

  const renderLegend = useCallback(
    ({ payload }: LegendContentProps) => {
      if (!payload) {
        return null
      }

      return (
        <div className="flex justify-center gap-6 pt-3 text-xs text-muted-foreground sm:text-sm">
          {payload.map((entry, index) => {
            const labelValue = entry.value ?? ""
            const label = typeof labelValue === "number" ? labelValue.toString() : labelValue
            const color = entry.color ?? "currentColor"

            return (
              <div key={`${label}-${index}`} className="flex items-center gap-2">
                <span
                  className="inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span>{label}</span>
              </div>
            )
          })}
        </div>
      )
    },
    [],
  )

  const primaryTestId = useMemo(() => {
    const moduleDerived = deriveTestIdFromModules(modules)
    if (moduleDerived && moduleDerived > 0) {
      return moduleDerived
    }

    let latest: StoredProgressEntry | null = null
    for (const entry of userResults) {
      if (!latest || entry.completedAt > latest.completedAt) {
        latest = entry
      }
    }

    return latest?.testId ?? null
  }, [modules, userResults])

  const headerTitle = isFullView
    ? (primaryTestId ? `Test ${primaryTestId} Results` : "Test Results")
    : (isRWView ? 'Reading & Writing Results' : 'Math Results')


  const leaderboardColumnWidths = {
    rank: '3.5rem',
    name: '10rem',
    totalScore: '6rem',
    readingScore: '6rem',
    mathScore: '6rem',
    module: '5rem',
    time: '6rem',
  }
  const getColumnStyle = (key: keyof typeof leaderboardColumnWidths) => ({
    width: leaderboardColumnWidths[key],
    minWidth: leaderboardColumnWidths[key],
  })
  const renderLeaderboardColgroup = () => {
    if (isRWView) {
      return (
        <colgroup>
          <col style={getColumnStyle('rank')} />
          <col style={getColumnStyle('name')} />
          <col style={getColumnStyle('readingScore')} />
          <col style={getColumnStyle('module')} />
          <col style={getColumnStyle('module')} />
          <col style={getColumnStyle('time')} />
        </colgroup>
      )
    }
    if (isMathView) {
      return (
        <colgroup>
          <col style={getColumnStyle('rank')} />
          <col style={getColumnStyle('name')} />
          <col style={getColumnStyle('mathScore')} />
          <col style={getColumnStyle('module')} />
          <col style={getColumnStyle('module')} />
          <col style={getColumnStyle('time')} />
        </colgroup>
      )
    }
    return (
      <colgroup>
        <col style={getColumnStyle('rank')} />
        <col style={getColumnStyle('name')} />
        <col style={getColumnStyle('totalScore')} />
        <col style={getColumnStyle('readingScore')} />
        <col style={getColumnStyle('mathScore')} />
        <col style={getColumnStyle('module')} />
        <col style={getColumnStyle('module')} />
        <col style={getColumnStyle('module')} />
        <col style={getColumnStyle('module')} />
        <col style={getColumnStyle('time')} />
      </colgroup>
    )
  }
  const getSortIndicator = (column: string) =>
    leaderboardSort.column === column && leaderboardSort.direction === 'asc' ? '↑' : '↓'
  const renderSortableHeaderContent = (label: string, column: string) => (
    <span className="flex items-center justify-end gap-1 text-right">
      <span
        className={`text-xs transition-opacity w-3 text-center ${
          leaderboardSort.column === column ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      >
        {getSortIndicator(column)}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </span>
  )

  // Leaderboard data from database
  const [dbLeaderboardData, setDbLeaderboardData] = useState<Array<{
    id: string
    name: string
    score: number
    readingScore: number
    mathScore: number
    timeSpent: number
    module1: number
    module2: number
    module3: number
    module4: number
    isCurrentUser: boolean
  }>>([])

  // Fetch current user's name from database
  const [currentUserName, setCurrentUserName] = useState<string>('You')
  
  useEffect(() => {
    async function fetchUserName() {
      if (!isTempUser) {
        const { getCurrentUserName } = await import('@/lib/auth')
        const name = await getCurrentUserName()
        setCurrentUserName(name)
      } else {
        setCurrentUserName('Guest')
      }
    }
    fetchUserName()
  }, [isTempUser])

  // Current user's data from actual test results
  const currentUserData = testScore ? {
    id: "current-user",
    name: currentUserName,
    score: testScore.total,
    readingScore: testScore.readingWriting.scaledScore,
    mathScore: testScore.math.scaledScore,
    timeSpent: modules.reduce((total, module) => 
      total + module.questions.reduce((moduleTotal, q) => moduleTotal + (q.timeSpent || 0), 0), 0
    ),
    module1: modules.find(m => m.moduleNumber === 1)?.questions.filter(q => {
      const isFreeResponse = !q.options || q.options.length === 0
      return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse)
    }).length || 0,
    module2: modules.find(m => m.moduleNumber === 2)?.questions.filter(q => {
      const isFreeResponse = !q.options || q.options.length === 0
      return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse)
    }).length || 0,
    module3: modules.find(m => m.moduleNumber === 3)?.questions.filter(q => {
      const isFreeResponse = !q.options || q.options.length === 0
      return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse)
    }).length || 0,
    module4: modules.find(m => m.moduleNumber === 4)?.questions.filter(q => {
      const isFreeResponse = !q.options || q.options.length === 0
      return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse)
    }).length || 0,
    isCurrentUser: true,
  } : null

  // Determine if score should be submitted to leaderboard
  // Only submit if all 4 modules are present

  // Calculate ranks based on current sort column and direction
  const allLeaderboardEntries = dbLeaderboardData
  const sortedForRanking = currentUserData ?
    [...allLeaderboardEntries, currentUserData].sort((a, b) => {
      const aVal = a[leaderboardSort.column as keyof typeof a] as number
      const bVal = b[leaderboardSort.column as keyof typeof b] as number
      return leaderboardSort.direction === 'desc' ? bVal - aVal : aVal - bVal
    }) : allLeaderboardEntries.sort((a, b) => {
      const aVal = a[leaderboardSort.column as keyof typeof a] as number
      const bVal = b[leaderboardSort.column as keyof typeof b] as number
      return leaderboardSort.direction === 'desc' ? bVal - aVal : aVal - bVal
    })

  const rankMap = new Map(sortedForRanking.map((entry, index) => {
    // For ascending sort, reverse the rank order so lowest values get highest rank numbers
    const rank = leaderboardSort.direction === 'asc' ? sortedForRanking.length - index : index + 1
    return [entry.id, rank]
  }))

  // Prepare leaderboard display data
  const allEntries = sortedForRanking
  const currentUserEntry = currentUserData ? sortedForRanking.find(entry => entry.id === 'current-user') : null
  const currentUserRank = currentUserEntry ? rankMap.get('current-user') || 0 : 0
  // Show all entries in the leaderboard
  const leaderboardData = allEntries.map(entry => ({
    ...entry,
    rank: rankMap.get(entry.id) || (rankMap.size + 1),
  }))

  // Calculate if user's actual entry is visible in the current scroll viewport
  // Account for table header height (~60px) and row height (~48px)
  const headerHeight = 60
  const rowHeight = 48
  const containerHeight = 480
  const userEntryIndex = currentUserEntry ? allEntries.findIndex(entry => entry.id === 'current-user') : -1
  const userEntryTop = userEntryIndex * rowHeight + headerHeight
  const isUserEntryVisible = userEntryIndex >= 0 && 
    leaderboardScrollTop <= userEntryTop && 
    userEntryTop < leaderboardScrollTop + containerHeight

  // Determine if user entry should be shown at top or bottom
  const showUserAtTop = currentUserEntry && !isUserEntryVisible && userEntryIndex >= 0 && userEntryTop < leaderboardScrollTop
  const showUserAtBottom = currentUserEntry && !isUserEntryVisible && userEntryIndex >= 0 && userEntryTop >= leaderboardScrollTop + containerHeight
  const handleLeaderboardSort = (column: string) => {
    setLeaderboardSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const handleLeaderboardScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setLeaderboardScrollTop(e.currentTarget.scrollTop)
  }

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!testIdParam) return
      
      try {
        const { getLeaderboard } = await import("@/lib/supabase/test-results")
        const { getCurrentUserId } = await import("@/lib/auth")
        const { calculateTestScore } = await import("@/lib/scoring")
        
        const currentUserId = getCurrentUserId()
        const { data, error } = await getLeaderboard(testIdParam)
        
        if (error || !data) {
          console.error('Error fetching leaderboard:', error)
          return
        }
        
        // Helper function to match answers (same as in main useEffect)
        const answersMatch = (userAnswer: string, correctAnswer: string, isFreeResponse: boolean): boolean => {
          if (!userAnswer || userAnswer.trim() === '') return false
          
          if (isFreeResponse) {
            try {
              const userVal = parseFloat(userAnswer.replace(/[^\d.-]/g, ''))
              const correctVal = parseFloat(correctAnswer.replace(/[^\d.-]/g, ''))
              
              if (isNaN(userVal) || isNaN(correctVal)) {
                return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
              }
              
              const tolerance = 0.0001
              return Math.abs(userVal - correctVal) < tolerance
            } catch {
              return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
            }
          }
          
          return userAnswer.trim() === correctAnswer.trim()
        }
        
        // Process each test attempt to calculate scores
        const processedData = data.map((attempt: any) => {
          const dbModules = attempt.modules || {}
          
          // Helper function to count correct answers
          const countCorrect = (moduleNum: number) => {
            const moduleKey = `module_${moduleNum}`
            const module = dbModules[moduleKey]
            if (!module || !module.questions) return 0
            
            return module.questions.filter((q: any) => {
              const isFreeResponse = !q.options || q.options.length === 0
              return answersMatch(q.user_answer || '', q.correct_answer, isFreeResponse)
            }).length
          }
          
          // Calculate total time spent
          const totalTime = Object.values(dbModules).reduce((total: number, mod: any) => {
            if (!mod.questions) return total
            return total + mod.questions.reduce((sum: number, q: any) => sum + (q.time_spent || 0), 0)
          }, 0)
          
          // Build modules array for scoring
          const modulesForScoring = Object.entries(dbModules).map(([key, mod]: [string, any]) => ({
            id: key,
            testId: String(attempt.test_id),
            moduleNumber: mod.module_number,
            moduleType: mod.module_number <= 2 ? "reading" : "math",
            isAdaptive: mod.module_number === 2 || mod.module_number === 4,
            startedAt: new Date(),
            completedAt: new Date(),
            questions: (mod.questions || []).map((q: any) => ({
              correctAnswer: q.correct_answer,
              userAnswer: q.user_answer,
              options: q.options || [],
            }))
          }))
          
          const score = calculateTestScore(modulesForScoring as any)
          
          return {
            id: attempt.user_id,
            name: attempt.user_id === currentUserId ? currentUserName : `User${attempt.user_id.slice(0, 8)}`,
            score: score.total,
            readingScore: score.readingWriting.scaledScore,
            mathScore: score.math.scaledScore,
            timeSpent: totalTime,
            module1: countCorrect(1),
            module2: countCorrect(2),
            module3: countCorrect(3),
            module4: countCorrect(4),
            isCurrentUser: attempt.user_id === currentUserId,
          }
        })
        
        setDbLeaderboardData(processedData)
      } catch (err) {
        console.error('Error processing leaderboard:', err)
      }
    }
    
    fetchLeaderboard()
  }, [testIdParam])

  useEffect(() => {
    // Clear the test-in-progress flag when viewing results
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("test-in-progress")
    }

    // Fetch test_attempts from Supabase
    const fetchTestAttemptFromDB = async () => {
      setIsLoading(true);
      setDbError(null);
      try {
        // Import auth module to get current user ID
        const { getCurrentUserId } = await import("@/lib/auth");
        const userId = getCurrentUserId();
        
        // Get testId from URL params, fallback to 1
        const testId = testIdParam || 1;
        
        // Import getTestAttempt dynamically to avoid SSR issues
        const { getTestAttempt } = await import("@/lib/supabase/test-results");
        const { data, error } = await getTestAttempt(userId, testId);
        
        if (error || !data) {
          setDbError(error?.message || "No test attempt found for this user and test ID.");
          setIsLoading(false);
          return;
        }
        // Parse modules from DBTestAttempt
        const dbModules = data.modules || {};
        
        // Get the module numbers we need based on section
        const moduleNumbers = isRWView ? [1, 2] : isMathView ? [3, 4] : [1, 2, 3, 4];
        
        // Import supabase client
        const { supabase } = await import("@/lib/supabase/client");
        
        // Fetch full question data from questions table for these modules
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('test_id', testId)
          .in('module_number', moduleNumbers)
          .order('module_number')
          .order('question_number');
        
        console.log('Questions data from DB:', questionsData, questionsError);
        
        if (questionsError) {
          console.error('Error fetching questions:', questionsError);
        }
        
        // Create a map of questions by module and question number
        const questionsMap = new Map<string, any>();
        if (questionsData) {
          questionsData.forEach((q: any) => {
            const key = `${q.module_number}-${q.question_number}`;
            questionsMap.set(key, q);
          });
        }
        
        // Convert DB modules to TestModule[], filtering by section if needed
        const parsedModules: TestModule[] = Object.entries(dbModules)
          .filter(([key, mod]: [string, any]) => {
            // Filter modules based on section view
            if (isRWView) return mod.module_number === 1 || mod.module_number === 2;
            if (isMathView) return mod.module_number === 3 || mod.module_number === 4;
            return true; // Full view shows all modules
          })
          .map(([key, mod]: [string, any]) => {
            return {
              id: key,
              testId: String(data.test_id),
              moduleNumber: mod.module_number,
              moduleType: mod.module_number <= 2 ? "reading" : "math",
              isAdaptive: mod.module_number === 2 || mod.module_number === 4,
              startedAt: new Date(),
              completedAt: new Date(),
              questions: (mod.questions || []).map((q: any, idx: number) => {
                // Get full question data from questions table
                const questionKey = `${mod.module_number}-${q.question_number}`;
                const fullQuestion = questionsMap.get(questionKey);
                
                // Extract options from the answers array in the database
                const options = fullQuestion?.answers?.map((ans: any) => ans.value) || [];
                
                return {
                  id: fullQuestion?.id || `${key}-q${idx+1}`, // Use database UUID if available
                  moduleId: key,
                  questionNumber: q.question_number,
                  questionText: fullQuestion?.content?.[0]?.value || "",
                  questionType: options.length > 0 ? "multiple-choice" : "free-response",
                  options: options,
                  correctAnswer: q.correct_answer,
                  userAnswer: q.user_answer,
                  flagged: false,
                  difficulty: undefined,
                  contentColumns: fullQuestion?.content?.map((c: any) => c.value) || [],
                  tags: fullQuestion?.tags || [],
                  timeSpent: q.time_spent || 0,
                  content: fullQuestion?.content || [],
                  answers: fullQuestion?.answers || [],
                  section: fullQuestion?.section || (mod.module_number <= 2 ? "READING" : "MATH"),
                };
              })
            };
          });
        
        if (parsedModules.length === 0) {
          setDbError(`No ${sectionParam === 'rw' ? 'Reading & Writing' : sectionParam === 'math' ? 'Math' : ''} modules found for this test.`);
          setIsLoading(false);
          return;
        }
        setModules(parsedModules);
        // Calculate score
        const score = calculateTestScore(parsedModules);
        setTestScore(score);
        // Animate scores
        const moduleRawScores = [
          parsedModules.find((m: any) => m.moduleNumber === 1)?.questions.filter((q: any) => {
            const isFreeResponse = !q.options || q.options.length === 0;
            return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse);
          }).length || 0,
          parsedModules.find((m: any) => m.moduleNumber === 2)?.questions.filter((q: any) => {
            const isFreeResponse = !q.options || q.options.length === 0;
            return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse);
          }).length || 0,
          parsedModules.find((m: any) => m.moduleNumber === 3)?.questions.filter((q: any) => {
            const isFreeResponse = !q.options || q.options.length === 0;
            return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse);
          }).length || 0,
          parsedModules.find((m: any) => m.moduleNumber === 4)?.questions.filter((q: any) => {
            const isFreeResponse = !q.options || q.options.length === 0;
            return answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse);
          }).length || 0
        ];
        animateScores(score, moduleRawScores);
        setIsLoading(false);
      } catch (err: any) {
        setDbError(err?.message || "Unknown error fetching test attempt.");
        setIsLoading(false);
      }
    };
    fetchTestAttemptFromDB();
  }, [testIdParam])

  // Animation function
  const animateScores = (score: TestScore, rawScores: number[]) => {
    const duration = 1500 // 1 second
    const steps = 200
    const incrementTotal = score.total / steps
    const incrementReading = score.readingWriting.scaledScore / steps
    const incrementMath = score.math.scaledScore / steps
    const incrementModules = rawScores.map(s => s / steps)
    const incrementProgressBars = rawScores.map(s => s / steps) // Same as modules for now
    // For section views: full circle (251.2 units), so score/800 * 251.2
    // For full view: half circle (125.6 units), so score/800 * 125.6
    const readingCircleLength = isRWView ? 251.2 : 125.6
    const mathCircleLength = isMathView ? 251.2 : 125.6
    const incrementReadingDash = ((score.readingWriting.scaledScore / 800) * readingCircleLength) / steps
    const incrementMathDash = ((score.math.scaledScore / 800) * mathCircleLength) / steps

    let current = 0
    const timer = setInterval(() => {
      current++
      setAnimatedTotal(Math.floor(current * incrementTotal))
      setAnimatedReading(Math.floor(current * incrementReading))
      setAnimatedMath(Math.floor(current * incrementMath))
      setAnimatedModuleScores(incrementModules.map((inc, i) => current * inc))
      setAnimatedProgressBars(incrementProgressBars.map((inc, i) => current * inc))
      setAnimatedReadingDash(current * incrementReadingDash)
      setAnimatedMathDash(current * incrementMathDash)

      if (current >= steps) {
        setAnimatedTotal(score.total)
        setAnimatedReading(score.readingWriting.scaledScore)
        setAnimatedMath(score.math.scaledScore)
        setAnimatedModuleScores(rawScores)
        setAnimatedProgressBars(rawScores)
        setAnimatedReadingDash((score.readingWriting.scaledScore / 800) * readingCircleLength)
        setAnimatedMathDash((score.math.scaledScore / 800) * mathCircleLength)
        clearInterval(timer)
      }
    }, duration / steps)
  }

  // Get all questions with their module info
  const allQuestions = modules
    .filter(module => {
      // Filter modules based on section view
      if (isRWView) return module.moduleNumber === 1 || module.moduleNumber === 2
      if (isMathView) return module.moduleNumber === 3 || module.moduleNumber === 4
      return true // Full view shows all modules
    })
    .flatMap(module =>
      module.questions.map((q, qIndex) => {
        const isFreeResponse = !q.options || q.options.length === 0
        return {
          ...q,
          moduleNumber: module.moduleNumber,
          moduleType: module.moduleType,
          isCorrect: answersMatch(q.userAnswer || '', q.correctAnswer, isFreeResponse),
          isUnanswered: !q.userAnswer || q.userAnswer.trim() === '',
          questionNumber: qIndex + 1,
        }
      })
    )

  const getQuestionKey = (question: typeof allQuestions[number]) =>
    question.id || `${question.moduleType}-${question.moduleNumber}-${question.questionNumber}`

  // Filter questions
  const filteredQuestions = allQuestions.filter(question => {
    if (selectedFilters.includes('all')) return true

    return selectedFilters.every(filter => {
      switch (filter) {
        case 'correct':
          return question.isCorrect
        case 'incorrect':
          return !question.isCorrect && !question.isUnanswered
        case 'unanswered':
          return question.isUnanswered
        case 'reading':
          return question.moduleType === 'reading'
        case 'math':
          return question.moduleType === 'math'
        default:
          return false
      }
    })
  }).sort((a, b) => {
    if (timeSortOrder === 'none') return 0
    const aTime = a.timeSpent || 0
    const bTime = b.timeSpent || 0
    if (timeSortOrder === 'desc') {
      return bTime - aTime
    } else {
      return aTime - bTime
    }
  })

  const anyExpanded = filteredQuestions.some(question => expandedQuestions.has(getQuestionKey(question)))

  // Check which filters have applicable questions (but not all questions)
  const hasCorrect = allQuestions.some(q => q.isCorrect) && !allQuestions.every(q => q.isCorrect)
  const hasIncorrect = allQuestions.some(q => !q.isCorrect && !q.isUnanswered) && !allQuestions.every(q => !q.isCorrect && !q.isUnanswered)
  const hasUnanswered = allQuestions.some(q => q.isUnanswered) && !allQuestions.every(q => q.isUnanswered)
  const hasReading = allQuestions.some(q => q.moduleType === 'reading') && !allQuestions.every(q => q.moduleType === 'reading')
  const hasMath = allQuestions.some(q => q.moduleType === 'math') && !allQuestions.every(q => q.moduleType === 'math')

  const toggleFilter = (filter: string) => {
    setExpandedQuestions(new Set())
    if (filter === 'all') {
      setSelectedFilters(['all'])
      return
    }

    setSelectedFilters(prev => {
      let newFilters = prev.filter(f => f !== 'all')
      if (newFilters.includes(filter)) {
        newFilters = newFilters.filter(f => f !== filter)
      } else {
        // Remove conflicting filters
        const conflicts: Record<string, string[]> = {
          correct: ['incorrect', 'unanswered'],
          incorrect: ['correct', 'unanswered'],
          unanswered: ['correct', 'incorrect'],
          reading: ['math'],
          math: ['reading'],
        }
        newFilters = newFilters.filter(f => !(conflicts[filter] || []).includes(f))
        newFilters.push(filter)
      }
      return newFilters.length === 0 ? ['all'] : newFilters
    })
  }

  const toggleTimeSort = () => {
    setExpandedQuestions(new Set())
    setTimeSortOrder(prev => {
      if (prev === 'none') return 'desc'
      if (prev === 'desc') return 'asc'
      return 'none'
    })
  }

  const toggleExpandCollapseAll = () => {
    if (anyExpanded) {
      setExpandedQuestions(new Set())
    } else {
      setExpandedQuestions(new Set(filteredQuestions.map(getQuestionKey)))
    }
  }

  // Group questions by module
  const groupedQuestions = filteredQuestions.reduce((groups, question) => {
    const key = `${question.moduleType}-${question.moduleNumber}`
    if (!groups[key]) {
      groups[key] = {
        moduleType: question.moduleType,
        moduleNumber: question.moduleNumber,
        questions: []
      }
    }
    groups[key].questions.push(question)
    return groups
  }, {} as Record<string, { moduleType: string, moduleNumber: number, questions: typeof filteredQuestions }>)

  const sortedGroups = Object.values(groupedQuestions).sort((a, b) => {
    if (a.moduleType !== b.moduleType) {
      return a.moduleType === 'reading' ? -1 : 1
    }
    return a.moduleNumber - b.moduleNumber
  })

  const toggleExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
  }

  const requestVideo = async (questionId: string) => {
    // Check if already requested/unlocked
    if (userVideoRequests.includes(questionId)) {
      return
    }

    // Check if video exists (unlock for 10 gems) or doesn't exist (request for 10 gems)
    const videoUrl = questionVideos.get(questionId)
    const userId = getCurrentUserId()

    if (!userId) {
      console.error('[VIDEO REQUEST] No user ID found')
      return
    }

    // Always check gems balance - both unlock and request cost 10 gems
    if (gemsBalance < 10) {
      console.error('[VIDEO REQUEST] Insufficient gems:', gemsBalance)
      return
    }

    console.log('[VIDEO REQUEST] Attempting to unlock video for question:', questionId, 'User:', userId)

    if (videoUrl) {
      // Video exists - unlock for 10 gems
      const result = await unlockVideo(userId, questionId)
      console.log('[VIDEO REQUEST] Unlock result:', result)
      if (result.success) {
        setGemsBalance(result.remainingGems || 0)
        setUserVideoRequests(prev => [...prev, questionId])
      }
    } else {
      // Video doesn't exist - request for 10 gems (they get access when it's ready)
      const result = await unlockVideo(userId, questionId) // Use unlockVideo to deduct gems
      console.log('[VIDEO REQUEST] Request result:', result)
      if (result.success) {
        setGemsBalance(result.remainingGems || 0)
        setUserVideoRequests(prev => [...prev, questionId])
      }
    }
  }

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
          <p className="text-muted-foreground mb-4">
            {dbError || "We couldn't find any completed test data."}
          </p>
          {testIdParam && (
            <p className="text-sm text-muted-foreground mb-4">
              Looking for: Test ID {testIdParam}, Section: {sectionParam}
            </p>
          )}
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
        <div className="max-w-5xl mx-auto flex h-10 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <span>{headerTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-6">
  <div className="max-w-5xl mx-auto">
          <Card className="mb-8">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
            >
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <TabsList className="w-full justify-start sm:w-auto">
                  <TabsTrigger value="score" className="px-4">Score Overview</TabsTrigger>
                  <TabsTrigger value="leaderboard" className="px-4">
                    Leaderboard
                  </TabsTrigger>
                  <TabsTrigger value="progress" className="px-4">
                    Your Progress
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pb-4 relative">
                {isTempUser && (activeTab === 'leaderboard' || activeTab === 'progress') && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
                    <div className="text-center space-y-4 px-4 max-w-md">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-background/90 border border-border flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-muted-foreground"
                          >
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl mb-2">
                          {activeTab === 'leaderboard' ? 'Sign Up to View Leaderboard' : 'Sign Up to Track Progress'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {activeTab === 'leaderboard' 
                            ? 'Create a free account to compete with other students and see where you rank.'
                            : 'Create a free account to track your improvement over time and see your score history.'}
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowSignupModal(true)}
                        className="bg-gradient-to-r to-purple-600 hover:brightness-90 text-white"
                        style={{ backgroundImage: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' }}
                      >
                        Sign Up Free
                      </Button>
                    </div>
                  </div>
                )}
                <TabsContent value="score" className="mt-0 min-h-[480px]">
                  <div className="flex flex-col items-center justify-center gap-8">
                    <div className="relative h-60 w-60 sm:h-72 sm:w-72">
                      <svg className="h-full w-full rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                        {!isMathView && (
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="8"
                            strokeDasharray={`${animatedReadingDash} 251.2`}
                            strokeDashoffset="0"
                          />
                        )}
                        {!isRWView && (
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="8"
                            strokeDasharray={`${animatedMathDash} 251.2`}
                            strokeDashoffset="0"
                            transform="scale(1 -1) translate(0 -100)"
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          {isFullView ? (
                            <>
                              <div className="text-5xl font-bold">{animatedTotal}</div>
                              <div className="text-sm text-muted-foreground">Total Score</div>
                            </>
                          ) : isRWView ? (
                            <>
                              <div className="text-5xl font-bold">{animatedReading}
                                <span className="text-lg text-muted-foreground">/800</span>
                              </div>
                              <div className="text-sm text-muted-foreground">Reading &amp; Writing</div>
                            </>
                          ) : (
                            <>
                              <div className="text-5xl font-bold">{animatedMath}
                                <span className="text-lg text-muted-foreground">/800</span>
                              </div>
                              <div className="text-sm text-muted-foreground">Mathematics</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`grid w-full gap-6 ${isFullView ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                      {!isMathView && (
                      <div className="space-y-4">
                        {isFullView && (
                        <div className="text-center">
                          <div className="text-3xl font-bold">
                            {animatedReading}
                            <span className="text-lg text-muted-foreground">/800</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Reading &amp; Writing</p>
                        </div>
                        )}
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Module 1</span>
                              <span className="font-bold">{Math.round(animatedModuleScores[0])}/27</span>
                            </div>
                            <div className="flex h-2 overflow-hidden rounded-full">
                              <div style={{ width: `${(animatedProgressBars[0] / 27) * 100}%`, backgroundColor: 'var(--color-primary)' }} />
                              <div className="flex-1 bg-gray-200" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Module 2</span>
                              <span className="font-bold">{Math.round(animatedModuleScores[1])}/27</span>
                            </div>
                            <div className="flex h-2 overflow-hidden rounded-full">
                              <div style={{ width: `${(animatedProgressBars[1] / 27) * 100}%`, backgroundColor: 'var(--color-primary)' }} />
                              <div className="flex-1 bg-gray-200" />
                            </div>
                          </div>
                        </div>
                      </div>
                      )}
                      {!isRWView && (
                      <div className="space-y-4">
                        {isFullView && (
                        <div className="text-center">
                          <div className="text-3xl font-bold">
                            {animatedMath}
                            <span className="text-lg text-muted-foreground">/800</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Mathematics</p>
                        </div>
                        )}
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Module 3</span>
                              <span className="font-bold">{Math.round(animatedModuleScores[2])}/22</span>
                            </div>
                            <div className="flex h-2 overflow-hidden rounded-full">
                              <div style={{ width: `${(animatedProgressBars[2] / 22) * 100}%`, backgroundColor: 'var(--color-secondary)' }} />
                              <div className="flex-1 bg-gray-200" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Module 4</span>
                              <span className="font-bold">{Math.round(animatedModuleScores[3])}/22</span>
                            </div>
                            <div className="flex h-2 overflow-hidden rounded-full">
                              <div style={{ width: `${(animatedProgressBars[3] / 22) * 100}%`, backgroundColor: 'var(--color-secondary)' }} />
                              <div className="flex-1 bg-gray-200" />
                            </div>
                          </div>
                        </div>
                      </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="leaderboard" className="mt-0 min-h-[480px]">
                  <div className="relative">
                    
                    {showUserAtTop && currentUserEntry && (
                      <div className="absolute top-0 left-0 right-0 z-10 border-b bg-background/95 backdrop-blur">
                        <Table className="table-fixed">
                          {renderLeaderboardColgroup()}
                          <TableHeader className="sr-only">
                            <TableRow>
                              <TableHead style={getColumnStyle('rank')}>Rank</TableHead>
                              <TableHead style={getColumnStyle('name')}>Name</TableHead>
                              {isFullView && <TableHead style={getColumnStyle('totalScore')} className="text-right">Total</TableHead>}
                              {!isMathView && <TableHead style={getColumnStyle('readingScore')} className="text-right">Reading</TableHead>}
                              {!isRWView && <TableHead style={getColumnStyle('mathScore')} className="text-right">Math</TableHead>}
                              {!isMathView && <TableHead style={getColumnStyle('module')} className="text-right">1</TableHead>}
                              {!isMathView && <TableHead style={getColumnStyle('module')} className="text-right">2</TableHead>}
                              {!isRWView && <TableHead style={getColumnStyle('module')} className="text-right">3</TableHead>}
                              {!isRWView && <TableHead style={getColumnStyle('module')} className="text-right">4</TableHead>}
                              <TableHead style={getColumnStyle('time')} className="text-right">Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="border-primary/20 bg-primary/5">
                              <TableCell className="font-medium">
                                #{currentUserRank}
                              </TableCell>
                              <TableCell className="font-medium">{currentUserEntry.name}</TableCell>
                              {isFullView && <TableCell className="text-right">{currentUserEntry.score}</TableCell>}
                              {!isMathView && <TableCell className="text-right">{currentUserEntry.readingScore}</TableCell>}
                              {!isRWView && <TableCell className="text-right">{currentUserEntry.mathScore}</TableCell>}
                              {!isMathView && <TableCell className="text-right">{currentUserEntry.module1}</TableCell>}
                              {!isMathView && <TableCell className="text-right">{currentUserEntry.module2}</TableCell>}
                              {!isRWView && <TableCell className="text-right">{currentUserEntry.module3}</TableCell>}
                              {!isRWView && <TableCell className="text-right">{currentUserEntry.module4}</TableCell>}
                              <TableCell className="text-right">{formatTimeSpent(currentUserEntry.timeSpent)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    <div className="max-h-[480px] overflow-auto" onScroll={handleLeaderboardScroll}>
                      <Table className="table-fixed">
                        {renderLeaderboardColgroup()}
                        <TableHeader>
                          <TableRow>
                            <TableHead style={getColumnStyle('rank')}>
                              Rank
                            </TableHead>
                            <TableHead style={getColumnStyle('name')}>Name</TableHead>
                            {isFullView && (
                              <TableHead
                                style={getColumnStyle('totalScore')}
                                className="cursor-pointer text-right hover:bg-muted/50"
                                onClick={() => handleLeaderboardSort('score')}
                                aria-sort={
                                  leaderboardSort.column === 'score'
                                    ? leaderboardSort.direction === 'asc'
                                      ? 'ascending'
                                      : 'descending'
                                    : undefined
                                }
                              >
                                {renderSortableHeaderContent('Total', 'score')}
                              </TableHead>
                            )}
                            {!isMathView && (
                              <TableHead
                                style={getColumnStyle('readingScore')}
                                className="cursor-pointer text-right hover:bg-muted/50"
                                onClick={() => handleLeaderboardSort('readingScore')}
                                aria-sort={
                                  leaderboardSort.column === 'readingScore'
                                    ? leaderboardSort.direction === 'asc'
                                      ? 'ascending'
                                      : 'descending'
                                    : undefined
                                }
                              >
                                {renderSortableHeaderContent('Reading', 'readingScore')}
                              </TableHead>
                            )}
                            {!isRWView && (
                              <TableHead
                                style={getColumnStyle('mathScore')}
                                className="cursor-pointer text-right hover:bg-muted/50"
                                onClick={() => handleLeaderboardSort('mathScore')}
                                aria-sort={
                                  leaderboardSort.column === 'mathScore'
                                    ? leaderboardSort.direction === 'asc'
                                      ? 'ascending'
                                      : 'descending'
                                    : undefined
                                }
                              >
                                {renderSortableHeaderContent('Math', 'mathScore')}
                              </TableHead>
                            )}
                            {!isMathView && (
                              <TableHead
                                style={getColumnStyle('module')}
                                className="cursor-pointer text-right hover:bg-muted/50"
                                onClick={() => handleLeaderboardSort('module1')}
                                aria-sort={
                                  leaderboardSort.column === 'module1'
                                    ? leaderboardSort.direction === 'asc'
                                      ? 'ascending'
                                      : 'descending'
                                    : undefined
                                }
                              >
                                {renderSortableHeaderContent('1', 'module1')}
                              </TableHead>
                            )}
                            {!isMathView && (
                              <TableHead
                                style={getColumnStyle('module')}
                                className="cursor-pointer text-right hover:bg-muted/50"
                                onClick={() => handleLeaderboardSort('module2')}
                                aria-sort={
                                  leaderboardSort.column === 'module2'
                                    ? leaderboardSort.direction === 'asc'
                                      ? 'ascending'
                                      : 'descending'
                                    : undefined
                                }
                              >
                                {renderSortableHeaderContent('2', 'module2')}
                              </TableHead>
                            )}
                            {!isRWView && (
                              <TableHead
                                style={getColumnStyle('module')}
                                className="cursor-pointer text-right hover:bg-muted/50"
                                onClick={() => handleLeaderboardSort('module3')}
                                aria-sort={
                                  leaderboardSort.column === 'module3'
                                    ? leaderboardSort.direction === 'asc'
                                      ? 'ascending'
                                      : 'descending'
                                    : undefined
                                }
                              >
                                {renderSortableHeaderContent('3', 'module3')}
                              </TableHead>
                            )}
                            {!isRWView && (
                              <TableHead
                                style={getColumnStyle('module')}
                                className="cursor-pointer text-right hover:bg-muted/50"
                                onClick={() => handleLeaderboardSort('module4')}
                                aria-sort={
                                  leaderboardSort.column === 'module4'
                                    ? leaderboardSort.direction === 'asc'
                                      ? 'ascending'
                                      : 'descending'
                                    : undefined
                                }
                              >
                                {renderSortableHeaderContent('4', 'module4')}
                              </TableHead>
                            )}
                            <TableHead
                              style={getColumnStyle('time')}
                              className="cursor-pointer text-right hover:bg-muted/50"
                              onClick={() => handleLeaderboardSort('timeSpent')}
                              aria-sort={
                                leaderboardSort.column === 'timeSpent'
                                  ? leaderboardSort.direction === 'asc'
                                    ? 'ascending'
                                    : 'descending'
                                  : undefined
                              }
                            >
                              {renderSortableHeaderContent('Time', 'timeSpent')}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderboardData.map((entry) => (
                            <TableRow
                              key={entry.id}
                              className={entry.isCurrentUser ? 'border-primary/20 bg-primary/5' : ''}
                            >
                              <TableCell style={getColumnStyle('rank')}>
                                {entry.rank}
                              </TableCell>
                              <TableCell style={getColumnStyle('name')}>
                                {entry.name}
                                {entry.isCurrentUser && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    You
                                  </Badge>
                                )}
                              </TableCell>
                              {isFullView && <TableCell style={getColumnStyle('totalScore')} className="whitespace-nowrap text-right">{entry.score}</TableCell>}
                              {!isMathView && <TableCell style={getColumnStyle('readingScore')} className="whitespace-nowrap text-right">{entry.readingScore}</TableCell>}
                              {!isRWView && <TableCell style={getColumnStyle('mathScore')} className="whitespace-nowrap text-right">{entry.mathScore}</TableCell>}
                              {!isMathView && <TableCell style={getColumnStyle('module')} className="whitespace-nowrap text-right">{entry.module1}/27</TableCell>}
                              {!isMathView && <TableCell style={getColumnStyle('module')} className="whitespace-nowrap text-right">{entry.module2}/27</TableCell>}
                              {!isRWView && <TableCell style={getColumnStyle('module')} className="whitespace-nowrap text-right">{entry.module3}/22</TableCell>}
                              {!isRWView && <TableCell style={getColumnStyle('module')} className="whitespace-nowrap text-right">{entry.module4}/22</TableCell>}
                              <TableCell style={getColumnStyle('time')} className="whitespace-nowrap text-right">{formatTimeSpent(entry.timeSpent)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {showUserAtBottom && currentUserEntry && (
                      <div className="absolute bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur">
                        <Table className="table-fixed">
                          {renderLeaderboardColgroup()}
                          <TableHeader className="sr-only">
                            <TableRow>
                              <TableHead style={getColumnStyle('rank')}>Rank</TableHead>
                              <TableHead style={getColumnStyle('name')}>Name</TableHead>
                              {isFullView && <TableHead style={getColumnStyle('totalScore')} className="text-right">Total</TableHead>}
                              {!isMathView && <TableHead style={getColumnStyle('readingScore')} className="text-right">Reading</TableHead>}
                              {!isRWView && <TableHead style={getColumnStyle('mathScore')} className="text-right">Math</TableHead>}
                              {!isMathView && <TableHead style={getColumnStyle('module')} className="text-right">1</TableHead>}
                              {!isMathView && <TableHead style={getColumnStyle('module')} className="text-right">2</TableHead>}
                              {!isRWView && <TableHead style={getColumnStyle('module')} className="text-right">3</TableHead>}
                              {!isRWView && <TableHead style={getColumnStyle('module')} className="text-right">4</TableHead>}
                              <TableHead style={getColumnStyle('time')} className="text-right">Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="border-primary/20 bg-primary/5">
                              <TableCell className="font-medium">
                                #{currentUserRank}
                              </TableCell>
                              <TableCell className="font-medium">{currentUserEntry.name}</TableCell>
                              {isFullView && <TableCell className="text-right">{currentUserEntry.score}</TableCell>}
                              {!isMathView && <TableCell className="text-right">{currentUserEntry.readingScore}</TableCell>}
                              {!isRWView && <TableCell className="text-right">{currentUserEntry.mathScore}</TableCell>}
                              {!isMathView && <TableCell className="text-right">{currentUserEntry.module1}</TableCell>}
                              {!isMathView && <TableCell className="text-right">{currentUserEntry.module2}</TableCell>}
                              {!isRWView && <TableCell className="text-right">{currentUserEntry.module3}</TableCell>}
                              {!isRWView && <TableCell className="text-right">{currentUserEntry.module4}</TableCell>}
                              <TableCell className="text-right">{formatTimeSpent(currentUserEntry.timeSpent)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="progress" className="mt-0 max-h-[480px]">
                  <div className="space-y-4">
                    
                    {(isTempUser ? true : chartData.length > 0) ? (
                      <ChartContainer size="lg" className="w-full h-[520px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData} margin={{ top: 16, right: 24, bottom: 56, left: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.35)" />
                            <XAxis
                              type="number"
                              dataKey="index"
                              ticks={xTicks}
                              domain={xDomain}
                              height={40}
                              interval={0}
                              allowDecimals={false}
                              padding={{ left: 0, right: 0 }}
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => {
                                const point = chartData.find((entry) => entry.index === value)
                                return point ? point.label : ''
                              }}
                            />
                            <YAxis
                              tick={{ fontSize: 12 }}
                              width={56}
                              domain={SCORE_DOMAIN}
                              allowDecimals={false}
                              tickFormatter={(value) => value.toString()}
                            />
                            <Tooltip cursor={{ strokeDasharray: "3 3" }} content={renderTooltip} />
                            <Legend verticalAlign="bottom" align="center" content={renderLegend} />
                            <Area
                              type="monotone"
                              dataKey="reading"
                              name="Reading & Writing"
                              stroke={chartColors.reading.stroke}
                              fill={chartColors.reading.fill}
                              strokeWidth={2}
                              dot={{ r: 4, fill: chartColors.reading.stroke, strokeWidth: 0 }}
                              activeDot={{ r: 6 }}
                              stackId="scores"
                              connectNulls
                            />
                            <Area
                              type="monotone"
                              dataKey="math"
                              name="Math"
                              stroke={chartColors.math.stroke}
                              fill={chartColors.math.fill}
                              strokeWidth={2}
                              dot={{ r: 4, fill: chartColors.math.stroke, strokeWidth: 0 }}
                              activeDot={{ r: 6 }}
                              stackId="scores"
                              connectNulls
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <div className="rounded border border-dashed border-muted-foreground/20 px-4 py-10 text-center text-sm text-muted-foreground">
                        No practice attempts recorded yet. Complete a full-length test to populate your progress chart.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Question Review Section - shown for all views, filtered by section */}
          <div className="mt-8">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedFilters.includes('all') ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('all')}
                >
                  All
                </Button>
                {hasCorrect && (
                  <Button
                    variant={selectedFilters.includes('correct') ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFilter('correct')}
                    className={selectedFilters.includes('correct') ? "text-[var(--color-primary)] dark:text-[var(--color-dark-text)]" : ""}
                    style={selectedFilters.includes('correct') ? { backgroundColor: 'var(--color-light-highlight)' } : undefined}
                  >
                    Correct
                  </Button>
                )}
                {hasIncorrect && (
                  <Button
                    variant={selectedFilters.includes('incorrect') ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFilter('incorrect')}
                    className={selectedFilters.includes('incorrect') ? "text-[var(--color-secondary)] dark:text-[var(--color-dark-text)]" : ""}
                    style={selectedFilters.includes('incorrect') ? { backgroundColor: 'var(--color-secondary-muted)' } : undefined}
                  >
                    Incorrect
                  </Button>
                )}
                {hasUnanswered && (
                  <Button
                    variant={selectedFilters.includes('unanswered') ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFilter('unanswered')}
                    className={selectedFilters.includes('unanswered') ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" : ""}
                  >
                    Unanswered
                  </Button>
                )}
                {hasReading && (
                  <Button
                    variant={selectedFilters.includes('reading') ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFilter('reading')}
                  >
                    Reading & Writing
                  </Button>
                )}
                {hasMath && (
                  <Button
                    variant={selectedFilters.includes('math') ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFilter('math')}
                  >
                    Math
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleExpandCollapseAll}
                >
                  {anyExpanded ? 'Collapse' : 'Expand'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTimeSort}
                  className="gap-1"
                >
                  Time Spent
                  {timeSortOrder === 'desc' && <span className="text-xs">▼</span>}
                  {timeSortOrder === 'asc' && <span className="text-xs">▲</span>}
                </Button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-8">
              {sortedGroups.map(group => (
                <div key={`${group.moduleType}-${group.moduleNumber}`}>
                  <h3 className="text-xl font-semibold mb-4">
                    {group.moduleType === 'reading' ? 'Reading & Writing' : 'Mathematics'} - Module {group.moduleNumber}
                  </h3>
                  <div className="space-y-4">
                    {group.questions.map((question) => {
                      const questionKey = getQuestionKey(question)
                      const enableFormatting = question.moduleType === 'reading'
                      const contentColumns = question.contentColumns ?? []
                      const hasContentColumns = contentColumns.length > 0

                      return (
                        <Card key={questionKey} className="overflow-hidden">
                          <CardHeader
                            className="pb-3 cursor-pointer"
                            onClick={() => toggleExpanded(questionKey)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    question.isUnanswered ? 'text-gray-800 dark:text-gray-200' :
                                    question.isCorrect ? 'text-[var(--color-primary)] dark:text-[var(--color-dark-text)]' : 'text-[var(--color-secondary)] dark:text-[var(--color-dark-text)]'
                                  }`}
                                  style={
                                    question.isUnanswered ? undefined : question.isCorrect ? { backgroundColor: 'var(--color-light-highlight)' } : { backgroundColor: 'var(--color-secondary-muted)' }
                                  }
                                >
                                  {question.isUnanswered ? 'Unanswered' :
                                   question.isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                                <CardTitle className="text-lg">
                                  Question {question.questionNumber}
                                </CardTitle>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatTimeSpent(question.timeSpent || 0)}
                              </div>
                            </div>
                          </CardHeader>
                          {expandedQuestions.has(questionKey) && (
                            <CardContent className="relative">
                              {isTempUser && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
                                  <div className="text-center space-y-4 px-4 max-w-md">
                                    <div className="flex justify-center">
                                      <div className="w-16 h-16 rounded-full bg-background/90 border border-border flex items-center justify-center">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="32"
                                          height="32"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="text-muted-foreground"
                                        >
                                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                      </div>
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-lg mb-2">Sign Up to Review Questions</h3>
                                      <p className="text-sm text-muted-foreground">
                                        Create a free account to access detailed question review, explanations, and more.
                                      </p>
                                    </div>
                                    <Button
                                      onClick={() => setShowSignupModal(true)}
                                      className="bg-gradient-to-r to-purple-600 hover:brightness-90 text-white"
                                      style={{ backgroundImage: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' }}
                                    >
                                      Sign Up Free
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {/* Show full question content for all users, but blurred for temp users */}
                              <div className="space-y-4">
                                <div className="text-base mb-4">
                                  {question.content && question.content.length > 0 ? (
                                    <div data-content-index="main">
                                      <QuestionContentRenderer content={question.content} testNumber={1} enableFormatting={enableFormatting} />
                                    </div>
                                  ) : hasContentColumns ? (
                                    contentColumns.map((content, idx) =>
                                      content ? (
                                        <div key={`${questionKey}-content-${idx}`} data-content-index={idx}>
                                          <RenderedContent
                                            content={content ?? ""}
                                            testNumber={1}
                                            baseCharIndex={idx * 100}
                                            enableFormatting={enableFormatting}
                                          />
                                          {idx < contentColumns.length - 1 && <hr className="my-4" />}
                                        </div>
                                      ) : null
                                    )
                                  ) : (
                                    <div data-content-index="main">
                                      <RenderedContent
                                        content={String(question.questionText || '')}
                                        testNumber={1}
                                        baseCharIndex={1000}
                                        enableFormatting={enableFormatting}
                                      />
                                    </div>
                                  )}
                                </div>
                                {/* Question Options */}
                                {question.questionType === 'multiple-choice' && question.options && question.options.length > 0 && (
                                  <div className="space-y-2">
                                    {question.options.map((option, optIndex) => {
                                      const optionLetter = String.fromCharCode(65 + optIndex)
                                      const isUserChoice = question.userAnswer === optionLetter
                                      const correctAnswerIndex = question.correctAnswer.charCodeAt(0) - 65 // Convert A=0, B=1, etc.
                                      const isCorrectChoice = optIndex === correctAnswerIndex
                                      return (
                                        <div
                                          key={`${questionKey}-option-${optIndex}`}
                                          className={`p-3 rounded border ${
                                            isCorrectChoice ? 'border-[var(--color-primary)] dark:border-[var(--color-dark-highlight)]' :
                                            isUserChoice && !isCorrectChoice ? 'border-[var(--color-secondary)] dark:border-[var(--color-dark-highlight)]' : 'border-gray-200 dark:border-gray-600'
                                          }`}
                                          style={isCorrectChoice ? { backgroundColor: 'var(--color-light-highlight)' } : isUserChoice && !isCorrectChoice ? { backgroundColor: 'var(--color-secondary-muted)' } : undefined}
                                        >
                                        >
                                          <span className="font-medium">
                                            {optionLetter}.{'  '}
                                            <span className={
                                              isCorrectChoice ? 'text-[var(--color-primary)] dark:text-[var(--color-dark-text)]' :
                                              isUserChoice && !isCorrectChoice ? 'text-[var(--color-secondary)] dark:text-[var(--color-dark-text)]' : 'text-gray-700 dark:text-gray-300'
                                            }>
                                              <RenderedContent
                                                content={option}
                                                testNumber={1}
                                                enableFormatting={enableFormatting}
                                              />
                                            </span>
                                          </span>
                                          {isCorrectChoice && isUserChoice && <span className="ml-2 text-[var(--color-primary)] dark:text-[var(--color-dark-text)] text-sm">(Your Choice - Correct)</span>}
                                          {isCorrectChoice && !isUserChoice && <span className="ml-2 text-[var(--color-primary)] dark:text-[var(--color-dark-text)] text-sm">(Correct)</span>}
                                          {isUserChoice && !isCorrectChoice && <span className="ml-2 text-[var(--color-secondary)] dark:text-[var(--color-dark-text)] text-sm">(Your Choice - Incorrect)</span>}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                                {/* Free Response Answer */}
                                {question.questionType === 'free-response' && (
                                  <div className="space-y-2">
                                    <div className={`p-3 rounded border ${
                                      question.isCorrect ? 'border-[var(--color-primary)] dark:border-[var(--color-dark-highlight)]' : 'border-[var(--color-secondary)] dark:border-[var(--color-dark-highlight)]'
                                    }`} style={question.isCorrect ? { backgroundColor: 'var(--color-light-highlight)' } : { backgroundColor: 'var(--color-secondary-muted)' }}>
                                      <div className="font-medium mb-2">Your Answer:</div>
                                      <div className={
                                        question.isCorrect ? 'text-[var(--color-primary)] dark:text-[var(--color-dark-text)]' : 'text-[var(--color-secondary)] dark:text-[var(--color-dark-text)]'
                                      }>
                                        {question.userAnswer || 'No answer provided'}
                                      </div>
                                      {question.isCorrect && <span className="ml-2 text-[var(--color-primary)] dark:text-[var(--color-dark-text)] text-sm">(Correct)</span>}
                                    </div>
                                    <div className="p-3 rounded border border-[var(--color-primary)] dark:border-[var(--color-dark-highlight)]" style={{ backgroundColor: 'var(--color-light-highlight)' }}>
                                      <div className="font-medium mb-2">Correct Answer:</div>
                                      <div className="text-[var(--color-primary)] dark:text-[var(--color-dark-text)]">
                                        {question.correctAnswer}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <div className="flex justify-end">
                                  {(() => {
                                    // Check if user has already unlocked this video
                                    const hasUnlocked = userVideoRequests.includes(questionKey)
                                    const videoUrl = questionVideos.get(questionKey)
                                    
                                    if (hasUnlocked && videoUrl) {
                                      // User has unlocked video and it exists - show video player
                                      return (
                                        <div className="w-full">
                                          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded border">
                                            <p className="text-sm font-medium mb-2">Video Explanation</p>
                                            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                                              <video
                                                controls
                                                className="w-full h-full"
                                                src={videoUrl}
                                              >
                                                Your browser does not support the video tag.
                                              </video>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    } else if (hasUnlocked && !videoUrl) {
                                      // User has requested video but it's not ready yet
                                      return (
                                        <Button variant="outline" size="sm" disabled>
                                          Video explanation pending...
                                        </Button>
                                      )
                                    } else {
                                      // User hasn't unlocked/requested yet
                                      const videoExists = !!videoUrl // Check if videoUrl has a value
                                      
                                      return (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => isTempUser ? setShowSignupModal(true) : requestVideo(questionKey)}
                                          className="gap-2"
                                        >
                                          {isTempUser ? (
                                            <>
                                              <Lock className="h-4 w-4" />
                                              Sign up to unlock videos
                                            </>
                                          ) : videoExists ? (
                                            <>
                                              Unlock Video Explanation
                                              <span className="flex items-center gap-0.5">
                                                10<Gem className="h-3.5 w-3.5 fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              Request Video Explanation
                                              <span className="flex items-center gap-0.5">
                                                10<Gem className="h-3.5 w-3.5 fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
                                              </span>
                                            </>
                                          )}
                                        </Button>
                                      )
                                    }
                                  })()}
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      {showScrollTop && (
        <Button
          type="button"
          size="icon"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-8 right-8 z-40 h-12 w-12 rounded-full shadow-lg"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}

      {/* Signup Modal for Temp Users */}
      <SignupModal
        open={showSignupModal}
        onOpenChange={setShowSignupModal}
        tempUserId={getCurrentUserId()}
        onSuccess={handleSignupSuccess}
        title="Create an account to unlock all features"
        description="Sign up to access leaderboards, track your progress, and unlock video explanations with 50 free gems!"
      />
    </div>
  )
}
