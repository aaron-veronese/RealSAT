"use client";

import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  ResponsiveContainer,
} from "recharts";

interface SATChartProps {
  chart: any; // the JSONB chart object from Supabase
}

export default function SATChart({ chart }: SATChartProps) {
  const { chartType, data, series, title, xLabel, yLabel } = chart;

  // Try to read branding colors from CSS variables, fallback to defaults
  const readingColor = typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-reading') || '#1E90FF' : '#1E90FF'
  const mathColor = typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-math') || '#FF7A18' : '#FF7A18'
  const tertiaryColor = typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-tertiary') || '#0EA5E9' : '#0EA5E9'
  const axisColor = typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-dark-text') || '#222' : '#222'
  const gridColor = typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-dark-bg') || '#ccc' : '#ccc'
  const legendTextColor = axisColor
  const isDark =
    typeof window !== 'undefined' &&
    (document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  const titleClass = isDark
    ? "text-lg font-medium mb-2 text-white"
    : "text-lg font-medium mb-2";

  if (chartType === "bar") {
    return (
      <div className="w-full flex flex-col items-center my-4">
        {title && <div className={titleClass}>{title}</div>}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="category"
              label={{
                value: xLabel,
                offset: -5,
                position: "insideBottom",
                fill: axisColor,
              }}
              stroke={axisColor}
              tick={{ fill: axisColor }}
            />
            <YAxis
              label={{
                value: yLabel,
                angle: -90,
                position: "insideLeft",
                fill: axisColor,
              }}
              stroke={axisColor}
              tick={{ fill: axisColor }}
            />
            <Tooltip
              contentStyle={{
                background: isDark ? "#222" : "#fff",
                color: axisColor,
                border: `1px solid ${gridColor}`,
              }}
              labelStyle={{ color: axisColor }}
            />
            <Legend
              wrapperStyle={{ color: legendTextColor }}
              iconSize={16}
            />
            {series.map((key: string, idx: number) => (
              <Bar
                key={key}
                dataKey={key}
                fill={[readingColor, mathColor, tertiaryColor][idx] || tertiaryColor}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Add line/scatter/pie/dual-axis support here as needed
  return null;
}
