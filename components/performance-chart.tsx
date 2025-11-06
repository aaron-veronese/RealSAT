"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendItem } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

export function PerformanceChart() {
  const data = [
    {
      category: "Vocabulary",
      correct: 85,
      incorrect: 15,
    },
    {
      category: "Grammar",
      correct: 78,
      incorrect: 22,
    },
    {
      category: "Reading Comp.",
      correct: 72,
      incorrect: 28,
    },
    {
      category: "Algebra",
      correct: 92,
      incorrect: 8,
    },
    {
      category: "Geometry",
      correct: 65,
      incorrect: 35,
    },
    {
      category: "Functions",
      correct: 88,
      incorrect: 12,
    },
    {
      category: "Statistics",
      correct: 80,
      incorrect: 20,
    },
  ]

  return (
    <ChartContainer className="h-[300px]">
      <ChartLegend className="mb-4">
        <ChartLegendItem name="Correct" color="#16a34a" />
        <ChartLegendItem name="Incorrect" color="#dc2626" />
      </ChartLegend>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="bg-background border-border"
                labelClassName="text-foreground"
                valueClassName="text-foreground"
              />
            }
          />
          <Bar dataKey="correct" fill="#16a34a" stackId="a" />
          <Bar dataKey="incorrect" fill="#dc2626" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
