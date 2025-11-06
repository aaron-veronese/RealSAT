import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Calendar } from "lucide-react"

interface LeaderboardTableProps {
  testInstance?: string
  highlightUserId?: string
}

export function LeaderboardTable({ testInstance, highlightUserId }: LeaderboardTableProps) {
  const leaderboardData = [
    {
      rank: 1,
      userId: "user-123",
      username: "SATMaster99",
      score: 1600,
      readingScore: 800,
      mathScore: 800,
      tests: 15,
      testDate: "May 18, 2023",
      testId: "SAT-2023-05-18-001",
    },
    {
      rank: 2,
      userId: "user-456",
      username: "MathWhiz2023",
      score: 1580,
      readingScore: 780,
      mathScore: 800,
      tests: 12,
      testDate: "May 17, 2023",
      testId: "SAT-2023-05-17-003",
    },
    {
      rank: 3,
      userId: "user-789",
      username: "CollegeBound24",
      score: 1560,
      readingScore: 760,
      mathScore: 800,
      tests: 20,
      testDate: "May 18, 2023",
      testId: "SAT-2023-05-18-002",
    },
    {
      rank: 4,
      userId: "user-101",
      username: "TestPrepper",
      score: 1540,
      readingScore: 760,
      mathScore: 780,
      tests: 18,
      testDate: "May 16, 2023",
      testId: "SAT-2023-05-16-001",
    },
    {
      rank: 5,
      userId: "user-102",
      username: "IvyLeaguer",
      score: 1520,
      readingScore: 740,
      mathScore: 780,
      tests: 10,
      testDate: "May 15, 2023",
      testId: "SAT-2023-05-15-002",
    },
    {
      rank: 6,
      userId: "user-103",
      username: "StudyHard365",
      score: 1500,
      readingScore: 740,
      mathScore: 760,
      tests: 25,
      testDate: "May 14, 2023",
      testId: "SAT-2023-05-14-001",
    },
    {
      rank: 7,
      userId: "user-104",
      username: "FutureEngineer",
      score: 1490,
      readingScore: 710,
      mathScore: 780,
      tests: 14,
      testDate: "May 13, 2023",
      testId: "SAT-2023-05-13-003",
    },
    {
      rank: 8,
      userId: "current-user",
      username: "SATChampion",
      score: 1480,
      readingScore: 720,
      mathScore: 760,
      tests: 16,
      testDate: "May 18, 2023",
      testId: "SAT-2023-05-18-003",
    },
    {
      rank: 9,
      userId: "user-105",
      username: "AcademicStar",
      score: 1470,
      readingScore: 730,
      mathScore: 740,
      tests: 22,
      testDate: "May 12, 2023",
      testId: "SAT-2023-05-12-001",
    },
    {
      rank: 10,
      userId: "user-106",
      username: "ScholarshipHunter",
      score: 1460,
      readingScore: 720,
      mathScore: 740,
      tests: 19,
      testDate: "May 11, 2023",
      testId: "SAT-2023-05-11-002",
    },
  ]

  // Filter by test instance if provided
  const filteredData = testInstance ? leaderboardData.filter((entry) => entry.testId === testInstance) : leaderboardData

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Rank</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Total Score</TableHead>
            <TableHead className="hidden md:table-cell">Reading & Writing</TableHead>
            <TableHead className="hidden md:table-cell">Mathematics</TableHead>
            <TableHead className="hidden md:table-cell">Test Date</TableHead>
            <TableHead className="hidden lg:table-cell">Test ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((entry) => (
            <TableRow key={entry.rank} className={highlightUserId === entry.userId ? "bg-primary/5" : ""}>
              <TableCell>
                {entry.rank <= 3 ? (
                  <div className="flex items-center">
                    <Trophy
                      className={`h-5 w-5 mr-1 ${
                        entry.rank === 1 ? "text-yellow-500" : entry.rank === 2 ? "text-gray-400" : "text-amber-700"
                      }`}
                    />
                    <span className="font-bold">{entry.rank}</span>
                  </div>
                ) : (
                  <span>{entry.rank}</span>
                )}
              </TableCell>
              <TableCell className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${entry.username.charAt(0)}`} />
                  <AvatarFallback>{entry.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{entry.username}</span>
                {entry.userId === highlightUserId && <Badge className="ml-2">You</Badge>}
              </TableCell>
              <TableCell className="font-medium">{entry.score}</TableCell>
              <TableCell className="hidden md:table-cell">{entry.readingScore}</TableCell>
              <TableCell className="hidden md:table-cell">{entry.mathScore}</TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{entry.testDate}</span>
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{entry.testId}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
