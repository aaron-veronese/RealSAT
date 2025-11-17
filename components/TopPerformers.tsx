"use client"

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { Trophy, TrendingUp, Users } from 'lucide-react'

type TopEntry = {
  user_id?: string
  username?: string
  school?: string | null
  total_score?: number | null
  reading_score?: number | null
  math_score?: number | null
  total_time?: number | null
}

export function TopPerformers() {
  const [topThisWeek, setTopThisWeek] = useState<TopEntry | null>(null)
  const [mostImprovedStudent, setMostImprovedStudent] = useState<TopEntry | null>(null)
  const [mostImprovedSchool, setMostImprovedSchool] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const now = new Date()
        const oneWeekAgo = new Date(now)
        oneWeekAgo.setDate(now.getDate() - 7)

        // 1. Top Student This Week
        const { data: weekResults, error: weekError } = await supabase
          .from('test_results')
          .select('user_id, total_score, reading_score, math_score, total_time, completed_at, users (username, school_id), schools (name)')
          .gte('completed_at', oneWeekAgo.toISOString())
          .eq('test_status', 'COMPLETE')
          .order('total_score', { ascending: false })
          .limit(1)

        if (weekError) {
          console.warn('TopPerformers: week error', weekError)
        } else if (weekResults && weekResults.length > 0) {
          const r: any = weekResults[0]
          if (mounted) setTopThisWeek({
            user_id: r.user_id,
            username: r.users?.username || 'Unknown',
            school: r.schools?.name || null,
            total_score: r.total_score,
            reading_score: r.reading_score,
            math_score: r.math_score,
            total_time: r.total_time,
          })
        }

        // 2. Most improved student (last 3 months)
        const threeMonthsAgo = new Date(now)
        threeMonthsAgo.setMonth(now.getMonth() - 3)

        const { data: last3Results, error: last3Err } = await supabase
          .from('test_results')
          .select('user_id, total_score, completed_at, users (username, school_id)')
          .gte('completed_at', threeMonthsAgo.toISOString())
          .eq('test_status', 'COMPLETE')

        if (last3Err) {
          console.warn('TopPerformers: last3 err', last3Err)
        } else {
          // compute per-user improvement
          const byUser = new Map<string, number[]>()
          for (const r of last3Results || []) {
            if (!r.user_id) continue
            const arr = byUser.get(r.user_id) || []
            if (r.total_score !== null && r.total_score !== undefined) arr.push(r.total_score)
            byUser.set(r.user_id, arr)
          }

          // For each user, compute improvement as avg of top2 minus avg of lowest2
          const improvements: { user_id: string; improvement: number; avgTop2: number; avgLow2: number }[] = []
          for (const [uid, scores] of byUser) {
            if (scores.length < 2) continue // need 2 scores for a valid comparison
            const sorted = scores.slice().sort((a, b) => a - b)
            const low2 = sorted.slice(0, 2)
            const top2 = sorted.slice(-2)
            const avgLow = low2.reduce((a, b) => a + b, 0) / low2.length
            const avgTop = top2.reduce((a, b) => a + b, 0) / top2.length
            improvements.push({ user_id: uid, improvement: avgTop - avgLow, avgTop2: Math.round(avgTop), avgLow2: Math.round(avgLow) })
          }

          improvements.sort((a, b) => b.improvement - a.improvement)
          const best = improvements[0]
          if (best) {
            // get the user's latest info
            const { data: userRows } = await supabase
              .from('users')
              .select('id, username, school_id')
              .eq('id', best.user_id)
              .limit(1)

            if (userRows && userRows.length > 0) {
              const u = userRows[0]
              // get school name
              const { data: schoolRow } = await supabase
                .from('schools')
                .select('id, name')
                .eq('id', u.school_id)
                .limit(1)

              if (mounted) setMostImprovedStudent({
                user_id: u.id,
                username: u.username,
                school: schoolRow && schoolRow.length > 0 ? schoolRow[0].name : null,
                total_score: best.avgTop2,
              })
            }
          }

          // 3. Most improved school (aggregate student improvements by school)
          const studentImprovementsBySchool = new Map<string, number[]>()
          for (const imp of improvements) {
            // get the user's school
            // NOTE: this will need async resolution; to keep simple, we requery user once
            const { data: usersDb } = await supabase.from('users').select('id, school_id').eq('id', imp.user_id)
            if (!usersDb || usersDb.length === 0) continue
            const sId = usersDb[0].school_id
            if (!sId) continue
            const arr = studentImprovementsBySchool.get(sId) || []
            arr.push(imp.improvement)
            studentImprovementsBySchool.set(sId, arr)
          }

          const ranks: { school_id: string; avgImprovement: number }[] = []
          for (const [sId, arr] of studentImprovementsBySchool) {
            const avg = arr.reduce((a, b) => a + b, 0) / arr.length
            ranks.push({ school_id: sId, avgImprovement: avg })
          }
          ranks.sort((a, b) => b.avgImprovement - a.avgImprovement)
          const topSchool = ranks[0]
          if (topSchool) {
            const { data: sData } = await supabase.from('schools').select('id, name').eq('id', topSchool.school_id).limit(1)
            if (sData && sData.length > 0) {
              if (mounted) setMostImprovedSchool({ school: sData[0].name, improvement: Math.round(topSchool.avgImprovement) })
            }
          }
        }

      } catch (err) {
        console.error('TopPerformers load error', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <CardTitle className="text-sm">Top Score This Week</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading…</div>
          ) : topThisWeek ? (
            <div>
              <div className="font-semibold text-lg">{topThisWeek.username} <span className="text-muted-foreground">{topThisWeek.school ? `• ${topThisWeek.school}` : ''}</span></div>
              <div className="text-4xl font-bold">{topThisWeek.total_score}</div>
              <div className="text-sm text-muted-foreground">Reading: {topThisWeek.reading_score} • Math: {topThisWeek.math_score} • Time: {topThisWeek.total_time ? `${Math.round((topThisWeek.total_time || 0)/60)}m` : '—'}</div>
            </div>
          ) : (
            <div>No top results this week</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <CardTitle className="text-sm">Most Improved (3 months)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading…</div>
          ) : mostImprovedStudent ? (
            <div>
              <div className="font-semibold">{mostImprovedStudent.username} <span className="text-muted-foreground">{mostImprovedStudent.school ? `• ${mostImprovedStudent.school}` : ''}</span></div>
              <div className="text-2xl font-bold">{mostImprovedStudent.total_score}</div>
              <div className="text-sm text-muted-foreground">Average of top 2 recent tests</div>
            </div>
          ) : (
            <div>No improved students found</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-500" />
            <CardTitle className="text-sm">Most Improved School (3 months)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading…</div>
          ) : mostImprovedSchool ? (
            <div>
              <div className="font-semibold">{mostImprovedSchool.school}</div>
              <div className="text-2xl font-bold">+{mostImprovedSchool.improvement}</div>
            </div>
          ) : (
            <div>No school improvements found</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
