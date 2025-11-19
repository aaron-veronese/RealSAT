"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Building2, Users, GraduationCap, BookOpen, Plus } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { supabase } from "@/lib/supabase/client"

type Classroom = {
  id: string
  name: string
  section?: string
  students: string[]
  teachers: string[]
  assigned_tests?: number[]
  student_count: number
  teacher_count: number
}

type User = {
  id: string
  name?: string
  username: string
  email: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'OWNER' | 'TUTOR'
}

export default function SchoolDashboardPage() {
  const [activeTab, setActiveTab] = useState<'classrooms' | 'users' | 'tests'>('classrooms')
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // TODO: Get school_id from current admin user
      const schoolId = '00000000-0000-0000-0000-000000000001'

      // Load classrooms
      const { data: classroomData, error: classroomError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('school_id', schoolId)

      if (classroomError) throw classroomError

      const classroomsWithCounts = (classroomData || []).map(c => ({
        id: c.id,
        name: c.name,
        section: c.section,
        students: c.students || [],
        teachers: c.teachers || [],
        assigned_tests: c.assigned_tests || [],
        student_count: (c.students || []).length,
        teacher_count: (c.teachers || []).length,
      }))

      setClassrooms(classroomsWithCounts)

      // Load users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, username, email, role')
        .eq('school_id', schoolId)

      if (userError) throw userError

      setUsers(userData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return { className: 'text-purple-700 dark:text-purple-300', style: { backgroundColor: 'rgb(245 158 11 / 0.08)' } }
      case 'ADMIN':
        return { className: 'text-[var(--color-primary)] dark:text-[var(--color-dark-text)]', style: { backgroundColor: 'var(--color-light-highlight)' } }
      case 'TEACHER':
        return { className: 'text-green-700 dark:text-green-300', style: { backgroundColor: 'rgb(220 252 231 / 0.8)' } }
      case 'TUTOR':
        return { className: 'text-indigo-700 dark:text-indigo-300', style: { backgroundColor: 'rgb(236 239 255 / 1)' } }
      case 'STUDENT':
        return { className: 'text-gray-700 dark:text-gray-300', style: { backgroundColor: 'rgb(243 244 246 / 1)' } }
      default:
        return { className: 'text-gray-700 dark:text-gray-300', style: { backgroundColor: 'rgb(243 244 246 / 1)' } }
    }
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
            <Building2 className="h-5 w-5" />
            <span>School Administration</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">School Management</h1>
            <p className="text-muted-foreground">Manage classrooms, users, and test assignments</p>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-5 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Classrooms</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classrooms.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tutors</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'TUTOR').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'TEACHER').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'STUDENT').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeTab === 'classrooms' ? 'default' : 'outline'}
              onClick={() => setActiveTab('classrooms')}
            >
              Classrooms
            </Button>
            <Button
              variant={activeTab === 'users' ? 'default' : 'outline'}
              onClick={() => setActiveTab('users')}
            >
              Users
            </Button>
            <Button
              variant={activeTab === 'tests' ? 'default' : 'outline'}
              onClick={() => setActiveTab('tests')}
            >
              Test Assignments
            </Button>
          </div>

          {/* Classrooms Tab */}
          {activeTab === 'classrooms' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Classrooms</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Classroom
                </Button>
              </CardHeader>
              <CardContent>
                {classrooms.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead className="text-center">Teachers</TableHead>
                        <TableHead className="text-center">Students</TableHead>
                        <TableHead className="text-center">Assigned Tests</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classrooms.map(classroom => (
                        <TableRow key={classroom.id}>
                          <TableCell className="font-medium">{classroom.name}</TableCell>
                          <TableCell>{classroom.section || '—'}</TableCell>
                          <TableCell className="text-center">{classroom.teacher_count}</TableCell>
                          <TableCell className="text-center">{classroom.student_count}</TableCell>
                          <TableCell className="text-center">
                            {classroom.assigned_tests?.length || 0}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="outline" size="sm">Edit</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No classrooms yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Create your first classroom to get started
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Classroom
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Users</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Teacher
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tutor
                  </Button>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {users.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <Input placeholder="Search users..." />
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map(user => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name || '—'}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {(() => { const r = getRoleBadgeColor(user.role); return (
                                <Badge className={r.className} style={r.style}>
                                  {user.role}
                                </Badge>
                              ) })()}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button variant="outline" size="sm">Edit</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No users yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Add teachers and students to get started
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Test Assignments Tab */}
          {activeTab === 'tests' && (
            <Card>
              <CardHeader>
                <CardTitle>Test Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-20">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Test assignment coming soon</h3>
                  <p className="text-muted-foreground text-center">
                    Assign practice tests to specific classrooms
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
