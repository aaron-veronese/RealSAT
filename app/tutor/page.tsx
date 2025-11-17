"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Sliders } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { supabase } from "@/lib/supabase/client"

export default function TutorDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [branding, setBranding] = useState<any>({})
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with real tutorId via auth; for now using placeholder School ID
      const tutorSchoolId = '00000000-0000-0000-0000-000000000001'

      // Query students linked to the tutor's school
      const { data: usersData, error } = await supabase
        .from('users')
        .select('id, name, username, email, role, school_id')
        .eq('school_id', tutorSchoolId)

      if (error) throw error

      setStudents(usersData || [])
      setSelectedSchoolId(tutorSchoolId)
    } catch (error) {
      console.error('Error loading tutor dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load branding for selected school id
  useEffect(() => {
    const loadBranding = async () => {
      if (!selectedSchoolId) return
      try {
        const { data } = await supabase.from('schools').select('branding').eq('id', selectedSchoolId).single()
        setBranding(data?.branding || {})
      } catch (err) {
        console.error('Error loading branding for tutor dashboard', err)
      }
    }
    loadBranding()
  }, [selectedSchoolId])

  const saveBranding = async (b: any) => {
    try {
      localStorage.setItem('school_branding', JSON.stringify(b))
      setBranding(b)
      if (selectedSchoolId) {
        const { error } = await supabase.from('schools').update({ branding: b }).eq('id', selectedSchoolId)
        if (error) console.warn('Failed to persist brand to DB', error)
      }
    } catch (err) {
      console.error('Error saving branding', err)
    }
  }

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold mb-2">Loading tutor dashboard…</div>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold">
            <Sliders className="h-5 w-5" />
            <span>Tutor Dashboard</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">My Students</h1>
            <p className="text-muted-foreground">Manage students assigned to your tutoring practice</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Availability</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Schedule</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
              </CardContent>
            </Card>
          </div>

          {/* Branding editor for the tutor's school */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium">Reading Color</label>
                  <input type="color" value={branding.readingColor || '#1E90FF'} onChange={(e) => saveBranding({ ...branding, readingColor: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Math Color</label>
                  <input type="color" value={branding.mathColor || '#FF7A18'} onChange={(e) => saveBranding({ ...branding, mathColor: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Tertiary Color</label>
                  <input type="color" value={branding.tertiaryColor || '#0EA5E9'} onChange={(e) => saveBranding({ ...branding, tertiaryColor: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent>
              {students.length > 0 ? (
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
                    {students.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name || '—'}</TableCell>
                        <TableCell>{s.username}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>{s.role}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No students yet</h3>
                  <p className="text-muted-foreground text-center mb-4">Add students to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
