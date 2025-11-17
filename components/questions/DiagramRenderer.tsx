"use client"

import React from "react"
import { QuestionContentBlock } from "@/lib/types"

interface Props {
  diagram: Extract<QuestionContentBlock, { type: "diagram" }>
}

const VIEW_WIDTH = 600
const VIEW_HEIGHT = 320
const PADDING = 24

function useColors() {
  // We will use currentColor via text color and custom CSS vars if needed
  return {
    axis: "currentColor",
    grid: "var(--tw-prose-invert, #2d2d2d)",
    text: "currentColor",
    bars: ["#a6a6a6", "#cfcfcf", "#000000", "#666666"]
  }
}

export default function DiagramRenderer({ diagram }: Props) {
  const colors = useColors()

  if (diagram.diagramType === "geometry") {
    const pts = diagram.points || {}
    const edges = diagram.edges || []

    const labels = Object.keys(pts)
    if (labels.length === 0) return null

    const xs = labels.map(l => pts[l].x)
    const ys = labels.map(l => pts[l].y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    const width = Math.max(1, maxX - minX)
    const height = Math.max(1, maxY - minY)

    const scaleX = (VIEW_WIDTH - 2 * PADDING) / width
    const scaleY = (VIEW_HEIGHT - 2 * PADDING) / height

    const transform = (x: number, y: number) => {
      const tx = PADDING + (x - minX) * scaleX
      const ty = VIEW_HEIGHT - PADDING - (y - minY) * scaleY
      return `${tx},${ty}`
    }

    return (
      <div className="w-full" style={{ color: undefined }}>
        {diagram.title && <div className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">{diagram.title}</div>}
        <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} width="100%" height="320" className="bg-transparent">
          {/* Grid */}
          <rect x={PADDING} y={PADDING} width={VIEW_WIDTH - 2 * PADDING} height={VIEW_HEIGHT - 2 * PADDING} fill="transparent" stroke="var(--grid-color, #e5e7eb)" strokeWidth={0} />

          {/* Edges */}
          {edges.map((e, i) => {
            const p1 = pts[e.from]
            const p2 = pts[e.to]
            if (!p1 || !p2) return null
            const [x1, y1] = transform(p1.x, p1.y).split(",").map(Number)
            const [x2, y2] = transform(p2.x, p2.y).split(",").map(Number)
            const midX = (x1 + x2) / 2
            const midY = (y1 + y2) / 2
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                {e.label && (
                  <text x={midX} y={midY - 6} fontSize={12} fill="currentColor" textAnchor="middle">{e.label}</text>
                )}
              </g>
            )
          })}

          {/* Points and labels */}
          {labels.map((label) => {
            const p = pts[label]
            const [x, y] = transform(p.x, p.y).split(",").map(Number)
            return (
              <g key={label}>
                <circle cx={x} cy={y} r={5} fill="white" stroke="currentColor" strokeWidth={2} />
                <text x={x + 8} y={y - 8} fontSize={12} fill="currentColor">{label}</text>
              </g>
            )
          })}

          {/* Right angle marker */}
          {diagram.rightAngle && pts[diagram.rightAngle] && (() => {
            const r = diagram.rightAngle!
            // Find two edges that connect to r to determine right angle
            const connected = edges.filter(e => e.from === r || e.to === r).map(e => e.from === r ? e.to : e.from)
            if (connected.length < 2) return null
            const p0 = pts[r]
            const p1 = pts[connected[0]]
            const p2 = pts[connected[1]]
            if (!p0 || !p1 || !p2) return null
            const [x0, y0] = transform(p0.x, p0.y).split(",").map(Number)
            const [x1, y1] = transform(p1.x, p1.y).split(",").map(Number)
            const [x2, y2] = transform(p2.x, p2.y).split(",").map(Number)
            // A simple right angle marker at distance of 14 px
            const dir1x = (x1 - x0)
            const dir1y = (y1 - y0)
            const len1 = Math.hypot(dir1x, dir1y)
            const nx1 = (dir1x / len1) * 14
            const ny1 = (dir1y / len1) * 14
            const dir2x = (x2 - x0)
            const dir2y = (y2 - y0)
            const len2 = Math.hypot(dir2x, dir2y)
            const nx2 = (dir2x / len2) * 14
            const ny2 = (dir2y / len2) * 14
            const ax = x0 + nx1
            const ay = y0 + ny1
            const bx = x0 + nx2
            const by = y0 + ny2
            return (
              <path d={`M ${ax} ${ay} L ${x0 + nx1 + nx2} ${y0 + ny1} L ${bx} ${by}`} stroke="currentColor" strokeWidth={2} fill="none" />
            )
          })()}
        </svg>
        {diagram.note && <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">{diagram.note}</div>}
      </div>
    )
  }

  if (diagram.diagramType === "image") {
    return (
      <div className="w-full">
        {diagram.title && <div className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">{diagram.title}</div>}
        {diagram.src && <img src={diagram.src} alt={diagram.title || 'diagram'} className="w-full object-contain" />}
        {diagram.note && <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">{diagram.note}</div>}
      </div>
    )
  }

  if (diagram.diagramType === "bar") {
    const categories = diagram.categories || []
    const series = diagram.series || []
    const numCategories = categories.length
    const numSeries = series.length || 1
    const maxVal = Math.max(...series.flatMap(s => s.values), 1)

    const chartWidth = VIEW_WIDTH - 2 * PADDING
    const chartHeight = VIEW_HEIGHT - 2 * PADDING
    const groupWidth = chartWidth / Math.max(1, numCategories)
    const barWidth = groupWidth / (numSeries + 1)

    const scaleY = (v: number) => (v / maxVal) * chartHeight

    return (
      <div className="w-full">
        {diagram.title && <div className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">{diagram.title}</div>}
        <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} width="100%" height="320">
          {/* Axes */}
          <line x1={PADDING} y1={VIEW_HEIGHT - PADDING} x2={VIEW_WIDTH - PADDING} y2={VIEW_HEIGHT - PADDING} stroke="currentColor" />
          <line x1={PADDING} y1={PADDING} x2={PADDING} y2={VIEW_HEIGHT - PADDING} stroke="currentColor" />

          {/* Bars */}
          {categories.map((cat, ci) => {
            const groupLeft = PADDING + ci * groupWidth
            return (
              <g key={ci}>
                {series.map((s, si) => {
                  const val = s.values[ci] ?? 0
                  const h = scaleY(val)
                  const x = groupLeft + si * barWidth + barWidth * 0.1
                  const y = VIEW_HEIGHT - PADDING - h
                  const fill = colors.bars[si % colors.bars.length]
                  return (
                    <rect key={si} x={x} y={y} width={barWidth * 0.8} height={h} fill={fill} />
                  )
                })}
                <text x={groupLeft + groupWidth / 2} y={VIEW_HEIGHT - PADDING + 16} fontSize={12} textAnchor="middle" fill="currentColor">{cat}</text>
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  if (diagram.diagramType === "scatter" || diagram.diagramType === "line" || diagram.diagramType === "functionPlot") {
    const data = diagram.data || []
    if (data.length === 0) return null
    const xs = data.map(d => d.x)
    const ys = data.map(d => d.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const width = Math.max(1, maxX - minX)
    const height = Math.max(1, maxY - minY)
    const scaleX = (VIEW_WIDTH - 2 * PADDING) / width
    const scaleY = (VIEW_HEIGHT - 2 * PADDING) / height
    const transform = (x: number, y: number) => {
      const tx = PADDING + (x - minX) * scaleX
      const ty = VIEW_HEIGHT - PADDING - (y - minY) * scaleY
      return `${tx},${ty}`
    }

    return (
      <div className="w-full">
        {diagram.title && <div className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">{diagram.title}</div>}
        <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} width="100%" height="320">
          {/* Axes */}
          <line x1={PADDING} y1={VIEW_HEIGHT - PADDING} x2={VIEW_WIDTH - PADDING} y2={VIEW_HEIGHT - PADDING} stroke="currentColor" />
          <line x1={PADDING} y1={PADDING} x2={PADDING} y2={VIEW_HEIGHT - PADDING} stroke="currentColor" />

          {/* Points/lines */}
          {diagram.diagramType === "line" || diagram.diagramType === "functionPlot" ? (
            <polyline fill="none" stroke="currentColor" strokeWidth={2} points={data.map(d => transform(d.x, d.y)).join(" ")} />
          ) : null}

          {diagram.diagramType === "scatter" ? (
            data.map((d, i) => {
              const [x, y] = transform(d.x, d.y).split(",").map(Number)
              return <circle key={i} cx={x} cy={y} r={4} fill="currentColor" />
            })
          ) : null}
        </svg>
      </div>
    )
  }

  // Unknown diagram type
  return null
}
