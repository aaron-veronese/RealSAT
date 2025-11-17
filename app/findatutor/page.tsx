"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getTempUserId } from '@/lib/temp-user'
import { supabase } from '@/lib/supabase/client'
import { SignupModal } from '@/components/signup-modal'

export default function FindATutorPage() {
  const [tutors, setTutors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTutor, setSelectedTutor] = useState<any | null>(null)
  const [showSignup, setShowSignup] = useState(false)

  useEffect(() => {
    loadTutors()
  }, [])

  const loadTutors = async () => {
    setLoading(true)
    try {
      // 1. Get tutors
      const { data: tutorData, error: tutorError } = await supabase
        .from('users')
        .select('id, name, username, email, role, school_id')
        .eq('role', 'TUTOR')

      if (tutorError) throw tutorError

      const tutors = tutorData || []

      // For each tutor, fetch school branding and count of student users who submitted test results in last month
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      const enhanced = await Promise.all(tutors.map(async (tutor) => {
        let school = null
        let studentCount = 0
        let hourlyRate: number | null = null
        let specialty: string | null = null

        if (tutor.school_id) {
          const { data: schoolData } = await supabase
            .from('schools')
            .select('id, name, branding')
            .eq('id', tutor.school_id)
            .single()

          school = schoolData || null

          if (school && school.branding) {
              hourlyRate = school.branding.hourlyRate || null
              specialty = school.branding.specialty || null
          }

          // Fetch student IDs for this school
          const { data: students } = await supabase
            .from('users')
            .select('id')
            .eq('school_id', tutor.school_id)
            .eq('role', 'STUDENT')

          const studentIds = (students || []).map((s: any) => s.id)

          if (studentIds.length > 0) {
            const { data: results } = await supabase
              .from('test_results')
              .select('user_id')
              .in('user_id', studentIds)
              .eq('test_status', 'COMPLETE')
              .gte('completed_at', oneMonthAgo.toISOString())

            if (results) {
              const uniqueUserIds = new Set(results.map((r: any) => r.user_id))
              studentCount = uniqueUserIds.size
            }
          }
        }

        return {
          ...tutor,
          school,
          hourlyRate,
          studentCount,
          specialty
        }
      }))

      setTutors(enhanced)
    } catch (error) {
      console.error('Error loading tutors:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRequestSession = async (tutor: any) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = (userData as any)?.user
      if (!user) {
        // Not authenticated; launch signup flow
        setShowSignup(true)
        return
      }

      // User is authenticated — create a tutor_request record if table exists
      try {
        const { error } = await supabase.from('tutor_requests').insert({
          user_id: user.id,
          tutor_id: tutor.id,
          school_id: tutor.school?.id || null,
          message: `Requesting a session with ${tutor.name || tutor.username}`,
          status: 'PENDING',
        })

        if (error) {
          console.warn('Failed to create tutor_request; table may be missing', error)
        } else {
          // In a real flow, we'd show a success toast and notify the tutor
          alert('Session request sent!')
        }
      } catch (err) {
        console.error('Error creating tutor_request', err)
        alert('Request sent (demo only)')
      }
    } catch (err) {
      console.error('Auth check failed', err)
      setShowSignup(true)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Find a Tutor</h1>
      <p className="text-muted-foreground mb-6">Browse tutors and request a session</p>

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <div>Loading...</div>
        ) : tutors.length === 0 ? (
          <div>No tutors found</div>
        ) : tutors.map(t => (
          <Card key={t.id}>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  {t.school?.branding?.portrait ? (
                    <AvatarImage src={t.school.branding.portrait} alt={t.name || t.username} />
                  ) : (
                    <AvatarFallback>{(t.name || t.username || 'T').charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="font-medium">{t.name || t.username}</div>
                  <div className="text-xs text-muted-foreground">{t.school?.name || 'Independent'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{t.hourlyRate ? `$${t.hourlyRate}/hr` : '—'}</div>
                <div className="text-xs text-muted-foreground">{(t.specialty || '—') === 'MATH' ? 'Math' : (t.specialty || '—') === 'READING' ? 'Reading' : 'All'}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">Students (last 30d)</div>
                <div className="font-medium">{t.studentCount}</div>
              </div>

              <div className="mt-4">
                <Button onClick={() => onRequestSession(t)}>Request Session</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail modal */}
      {selectedTutor && (
        <Dialog open={true} onOpenChange={() => setSelectedTutor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedTutor.name || selectedTutor.username}</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <div className="mb-4">{selectedTutor.school?.branding?.bio || 'Tutoring profile'}</div>
              <div className="mb-4">Specialty: {(selectedTutor.specialty || '—') === 'MATH' ? 'Math' : (selectedTutor.specialty || '—') === 'READING' ? 'Reading' : 'All'}</div>
              <div className="mb-4">Availability: —</div>
              <div className="mb-4">Hourly Rate: {selectedTutor.hourlyRate ? `$${selectedTutor.hourlyRate}/hr` : '—'}</div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTutor(null)}>Cancel</Button>
              <Button onClick={async () => {
                // Process request (if signed in); otherwise show signup
                await onRequestSession(selectedTutor)
                setSelectedTutor(null)
              }}>Request Session</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <SignupModal
        open={showSignup}
        onOpenChange={(open) => setShowSignup(open)}
        tempUserId={getTempUserId()}
      />
    </div>
  )
}
