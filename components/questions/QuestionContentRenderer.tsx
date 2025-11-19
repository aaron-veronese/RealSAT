"use client"

import React from "react"
import { QuestionContentBlock } from "@/lib/types"
import { RenderedContent } from "@/components/rendered-content"
import DiagramRenderer from "./DiagramRenderer"
import SATChart from "@/components/SATChart"
import TableRenderer from "./TableRenderer"

interface Props {
  content: QuestionContentBlock[] | undefined
  testNumber?: number
  // highlights are global character offsets relative to the start of the whole content container
  highlights?: { start: number; end: number; text: string }[]
  baseCharIndex?: number
  enableFormatting?: boolean
}

export default function QuestionContentRenderer({ content, testNumber = 1, highlights = [], baseCharIndex = 0, enableFormatting = false }: Props) {
  if (!content || content.length === 0) return null

  // We compute a running character offset for each block so RenderedContent can map global ranges
  let cumulative = 0

  return (
    <div className="space-y-4">
      {content.map((block, idx) => {
        const key = `qc-${idx}`
        const partBase = baseCharIndex + cumulative

        if (block.type === "text") {
          // Normalize CRLF -> LF so lengths used for base offsets match renderer normalization
          const raw = String(block.value)
          const blockText = raw.replace(/\r\n/g, "\n")
          // Estimate the displayed text length by removing formatting markup so base indices match DOM text nodes
          const displayText = blockText
            .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
            .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1") // italic
            .replace(/_([^_]+)_/g, "$1") // underline
          const len = displayText.length
          const node = (
            <div key={key} data-content-index={idx} data-part-index={partBase}>
              <RenderedContent content={blockText} testNumber={testNumber} highlights={highlights} baseCharIndex={partBase} enableFormatting={enableFormatting} />
            </div>
          )
          cumulative += len
          return node
        }

        if (block.type === "diagram") {
          return (
            <div key={key} className="my-4">
              <DiagramRenderer diagram={block} />
            </div>
          )
        }

        // Legacy chart blocks: use SATChart
        if (block.type === "chart") {
          return (
            <div key={key} className="my-4">
              <SATChart chart={block.value} />
            </div>
          )
        }

        // Backwards-compat: support legacy chart blocks
        if ((block as any).type === "chart") {
          const chart = (block as any).value || block
          const diag = {
            type: "diagram",
            diagramType: chart.chartType || chart.chartType === 'bar' ? 'bar' : 'bar',
            title: chart.title,
            categories: chart.data ? chart.data.map((d: any) => d.category) : chart.categories,
            series: chart.series ? chart.series.map((s: string, idx: number) => ({ name: s, values: chart.data.map((d: any) => d[s]) })) : chart.series,
            yLabel: chart.yLabel || chart.yLabel
          }
          return (
            <div key={key} className="my-4">
              <DiagramRenderer diagram={diag as any} />
            </div>
          )
        }

        if (block.type === "table") {
          // Support legacy table formats where DB provides a single string value
          // with `|` columns and `||` row separators (no explicit columns/rows arrays).
          let columns: string[] | undefined = (block as any).columns
          let rows: string[][] | undefined = (block as any).rows

          if ((!columns || !rows) && (block as any).value && typeof (block as any).value === 'string') {
            const raw = (block as any).value as string
            // If the legacy format uses || to denote rows and | for columns, normalize to newline
            const normalized = raw.includes('||') && !raw.includes('\n') ? raw.replace(/\|\|/g, '\n') : raw
            const lines = normalized.split('\n').map(l => l.trim()).filter(l => l.length > 0)
            if (lines.length > 0) {
              columns = lines[0].split('|').map(c => c.trim())
              rows = lines.slice(1).map(line => line.split('|').map(cell => cell.trim()))
            } else {
              columns = []
              rows = []
            }
          }

          // Defensive fallback - if columns/rows still missing, render nothing
          if (!columns || !rows) return null

          return (
            <div key={key} className="my-4 overflow-x-auto">
              <TableRenderer columns={columns} rows={rows} />
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
