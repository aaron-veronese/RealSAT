import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"

export function TestHistoryTable() {
  const testHistory = [
    {
      id: "1",
      date: "May 15, 2023",
      totalScore: 1480,
      readingScore: 720,
      mathScore: 760,
      status: "Completed",
    },
    {
      id: "2",
      date: "April 28, 2023",
      totalScore: 1420,
      readingScore: 680,
      mathScore: 740,
      status: "Completed",
    },
    {
      id: "3",
      date: "April 10, 2023",
      totalScore: 1380,
      readingScore: 660,
      mathScore: 720,
      status: "Completed",
    },
    {
      id: "4",
      date: "March 22, 2023",
      totalScore: 1320,
      readingScore: 640,
      mathScore: 680,
      status: "Completed",
    },
    {
      id: "5",
      date: "March 5, 2023",
      totalScore: 1280,
      readingScore: 620,
      mathScore: 660,
      status: "Completed",
    },
  ]

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Total Score</TableHead>
            <TableHead className="hidden md:table-cell">Reading & Writing</TableHead>
            <TableHead className="hidden md:table-cell">Mathematics</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {testHistory.map((test) => (
            <TableRow key={test.id}>
              <TableCell className="font-medium">{test.date}</TableCell>
              <TableCell>{test.totalScore}</TableCell>
              <TableCell className="hidden md:table-cell">{test.readingScore}</TableCell>
              <TableCell className="hidden md:table-cell">{test.mathScore}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {test.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="sr-only">View details</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
