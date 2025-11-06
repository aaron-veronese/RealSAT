import { DashboardHeader } from "@/components/dashboard-header"
import { LeaderboardTable } from "@/components/leaderboard-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LeaderboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground">See how you compare to other test-takers</p>
        </div>

        <Tabs defaultValue="all-time">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="all-time">All Time</TabsTrigger>
              <TabsTrigger value="this-month">This Month</TabsTrigger>
              <TabsTrigger value="this-week">This Week</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all-time" className="mt-6">
            <LeaderboardTable />
          </TabsContent>
          <TabsContent value="this-month" className="mt-6">
            <LeaderboardTable />
          </TabsContent>
          <TabsContent value="this-week" className="mt-6">
            <LeaderboardTable />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
