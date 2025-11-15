"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Users, TrendingUp, BarChart3 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { supabase } from "@/lib/supabase/client"

type ClassroomData = {
  id: string
  name: string
  section?: string
  students: string[]
  student_count: number
  avg_score?: number
}

type StudentResult = {
  user_id: string
  name: string
  total_score: number
  reading_score: number
  math_score: number
  test_count: number
  last_test_date: string
}

export default function TeacherDashboardPage() {
  const router = useRouter()
  const [classrooms, setClassrooms] = useState<ClassroomData[]>([])
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [studentResults, setStudentResults] = useState<StudentResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadClassrooms()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      loadStudentResults(selectedClass)
    }
  }, [selectedClass])

  const loadClassrooms = async () => {
    setIsLoading(true)
    try {
      // TODO: Get current teacher's ID from auth
      const teacherId = '00000000-0000-0000-0000-000000000001'

      // Query classrooms where teacher is in the teachers array
      const { data: classroomData, error } = await supabase
        .from('classrooms')
        .select('*')
        .contains('teachers', [teacherId])

      if (error) throw error

      const classroomsWithCounts = (classroomData || []).map(classroom => ({
        id: classroom.id,
        name: classroom.name,
        section: classroom.section,
        students: classroom.students || [],
        student_count: (classroom.students || []).length,
      }))

      setClassrooms(classroomsWithCounts)
      
      // Auto-select first classroom
      if (classroomsWithCounts.length > 0) {
        setSelectedClass(classroomsWithCounts[0].id)
      }
    } catch (error) {
      console.error('Error loading classrooms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStudentResults = async (classroomId: string) => {
    try {
      const classroom = classrooms.find(c => c.id === classroomId)
      if (!classroom || classroom.students.length === 0) {
        setStudentResults([])
        return
      }

      // Get test results for all students in this classroom
      const { data: results, error: resultsError } = await supabase
        .from('test_results')
        .select('user_id, total_score, reading_score, math_score, completed_at')
        .in('user_id', classroom.students)
        .eq('test_status', 'COMPLETE')
        .order('completed_at', { ascending: false })

      if (resultsError) throw resultsError

      // Get student names (only name field, not email)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, username')
        .in('id', classroom.students)

      if (usersError) throw usersError

      // Create a map of user_id to name
      const userMap = new Map(
        users?.map(u => [u.id, u.name || u.username || 'Unknown']) || []
      )

      // Aggregate results by student
      const studentMap = new Map<string, {
        user_id: string
        name: string
        total_scores: number[]
        reading_scores: number[]
        math_scores: number[]
        last_test_date: string
      }>()

      results?.forEach(result => {
        if (!studentMap.has(result.user_id)) {
          studentMap.set(result.user_id, {
            user_id: result.user_id,
            name: userMap.get(result.user_id) || 'Unknown',
            total_scores: [],
            reading_scores: [],
            math_scores: [],
            last_test_date: result.completed_at || ''
          })
        }

        const student = studentMap.get(result.user_id)!
        if (result.total_score) student.total_scores.push(result.total_score)
        if (result.reading_score) student.reading_scores.push(result.reading_score)
        if (result.math_score) student.math_scores.push(result.math_score)
        
        // Keep the most recent date
        if (result.completed_at && result.completed_at > student.last_test_date) {
          student.last_test_date = result.completed_at
        }
      })

      // Calculate averages
      const studentResults: StudentResult[] = Array.from(studentMap.values()).map(student => ({
        user_id: student.user_id,
        name: student.name,
        total_score: student.total_scores.length > 0 
          ? Math.round(student.total_scores.reduce((a, b) => a + b, 0) / student.total_scores.length)
          : 0,
        reading_score: student.reading_scores.length > 0
          ? Math.round(student.reading_scores.reduce((a, b) => a + b, 0) / student.reading_scores.length)
          : 0,
        math_score: student.math_scores.length > 0
          ? Math.round(student.math_scores.reduce((a, b) => a + b, 0) / student.math_scores.length)
          : 0,
        test_count: student.total_scores.length,
        last_test_date: student.last_test_date
      }))

      // Sort by total score descending
      studentResults.sort((a, b) => b.total_score - a.total_score)

      setStudentResults(studentResults)
    } catch (error) {
      console.error('Error loading student results:', error)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 1400) return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
    if (score >= 1200) return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
    if (score >= 1000) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
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
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold">
            <GraduationCap className="h-5 w-5" />
            <span>Teacher Dashboard</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
            <p className="text-muted-foreground">Track student progress and performance</p>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classrooms.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {classrooms.reduce((sum, c) => sum + c.student_count, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentResults.reduce((sum, s) => sum + s.test_count, 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Class Score</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {studentResults.length > 0 
                    ? Math.round(studentResults.reduce((sum, s) => sum + s.total_score, 0) / studentResults.length)
                    : '—'
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Class Selector */}
          <div className="mb-4">
            <div className="flex gap-2 flex-wrap">
              {classrooms.map(classroom => (
                <Button
                  key={classroom.id}
                  variant={selectedClass === classroom.id ? "default" : "outline"}
                  onClick={() => setSelectedClass(classroom.id)}
                >
                  {classroom.name} {classroom.section && `(${classroom.section})`}
                  <Badge variant="secondary" className="ml-2">{classroom.student_count}</Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Student Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedClass ? classrooms.find(c => c.id === selectedClass)?.name : 'Select a class'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentResults.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-center">Tests Taken</TableHead>
                      <TableHead className="text-center">Avg Total</TableHead>
                      <TableHead className="text-center">Avg Reading</TableHead>
                      <TableHead className="text-center">Avg Math</TableHead>
                      <TableHead className="text-center">Last Test</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentResults.map(student => (
                      <TableRow key={student.user_id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-center">{student.test_count}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={getScoreBadgeColor(student.total_score)}>
                            {student.total_score}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{student.reading_score || '—'}</TableCell>
                        <TableCell className="text-center">{student.math_score || '—'}</TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {formatDate(student.last_test_date)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No student data</h3>
                  <p className="text-muted-foreground text-center">
                    {selectedClass ? 'Students haven\'t taken any tests yet' : 'Select a class to view results'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
