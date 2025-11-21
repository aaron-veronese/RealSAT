"use client"

import Image from "next/image"
import { parseContent } from "@/lib/content-renderer"
import React from "react"
import { InlineMath, BlockMath } from "react-katex"
import SATChart from "./SATChart"

interface RenderedContentProps {
  content: any
  testNumber?: number
  // highlights are global character offsets relative to the start of the whole content container
  highlights?: { start: number; end: number; text: string }[]
  baseCharIndex?: number
  enableFormatting?: boolean
}

export function RenderedContent({ 
  content, 
  testNumber = 1, 
  highlights = [], 
  baseCharIndex = 0,
  enableFormatting = false 
}: RenderedContentProps) {
  // Support either string content or structured objects (e.g., chart configs)
  // If content is a JSON string representing an object, parse it
  if (typeof content === "string" && content.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(content)
      content = parsed
    } catch {
      // ignore parse errors and treat as plain text
    }
  }

  if (typeof content === "object" && content !== null) {
    // If this looks like a chart object, render chart directly
    const chartObj = (content && (content.chartType || content?.type === "chart")) ? (content.chartType ? content : content.value ?? content) : null
    if (chartObj) {
      return <SATChart chart={chartObj} />
    }

    // If it's a React element, render it directly
    if (React.isValidElement(content)) {
      return <>{content}</>
    }

    // Fallback: stringify objects so the parser can render text
    content = String(content)
  }

  const parts = parseContent(String(content))

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "text") {
          // Only split on explicit \n markers for line breaks (not all newlines)
          const normalizedPartContent = String(part.content).replace(/\r\n/g, '\n')
          const lines = normalizedPartContent.split('\n')

          // Compute running offset within this block's parts to translate global highlights
          // We'll calculate the character offset for each line relative to the overall content by
          // adding baseCharIndex + cumulative chars from earlier parts in this block.
          return (
            <span key={index} className="text-base leading-relaxed whitespace-pre-wrap" data-part-index={index}>
              {lines.map((line, lineIdx) => {
                // Apply text formatting if enabled
                let processedLine: (string | JSX.Element)[] = [line]

                if (enableFormatting) {
                  processedLine = applyTextFormatting(line)
                }

                return (
                  <span key={lineIdx} data-line-index={lineIdx}>
                    {highlights.length > 0 
                      ? applyHighlightsGlobal(processedLine, highlights, baseCharIndex, parts, index, lineIdx)
                      : processedLine}
                    {lineIdx < lines.length - 1 && <br />}
                  </span>
                )
              })}
            </span>
          )
        }

        if (part.type === "latex") {
          const isBlock = part.content.includes("\\\\") || part.content.includes("\n")
          return isBlock ? (
            <div key={index} className="my-4">
              <BlockMath math={part.content} />
            </div>
          ) : (
            <InlineMath key={index} math={part.content} />
          )
        }

        if (part.type === "table") {
          return (
            <div key={index} className="my-4 overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    {part.headers?.map((header, i) => (
                      <th
                        key={i}
                        className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100"
                      >
                        {enableFormatting ? applyTextFormatting(header) : header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {part.rows?.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-900 dark:text-gray-100"
                        >
                          {enableFormatting ? applyTextFormatting(cell) : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        if (part.type === "image") {
          return (
            <div key={index} className="my-4 flex justify-center">
              <Image
                src={`/images/test${testNumber}/${part.content}.png`}
                alt="Question content"
                width={600}
                height={400}
                className="max-w-full w-auto h-auto max-h-[40vh]"
              />
            </div>
          )
        }

        // chart content is handled earlier when we receive an object

        return null
      })}
    </>
  )
}

// Apply bold (**text**), italic (*text*), underline (_text_) with support for nesting
export function applyTextFormatting(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = []
  let key = 0

  // Process underline first (outer layer)
  const underlineRegex = /_([^_]+)_/g
  let lastIndex = 0
  let match

  while ((match = underlineRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(...processInnerFormatting(text.slice(lastIndex, match.index), key))
    }

    // Process content inside underline for bold/italic
    const innerContent = processInnerFormatting(match[1], key)
    parts.push(<u key={key++}>{innerContent}</u>)

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(...processInnerFormatting(text.slice(lastIndex), key))
  }

  return parts.length > 0 ? parts : [text]
}

// Process bold and italic formatting
function processInnerFormatting(text: string, startKey: number): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = []
  let key = startKey + 1000

  // Process bold first
  const boldRegex = /\*\*([^*]+)\*\*/g
  const segments: Array<{ start: number; end: number; type: 'bold' | 'italic'; content: string }> = []
  let match: RegExpExecArray | null

  while ((match = boldRegex.exec(text)) !== null) {
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'bold',
      content: match[1]
    })
  }

  // Process italic (but not if it's part of bold **)
  const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)/g
  while ((match = italicRegex.exec(text)) !== null) {
    // Check if this overlaps with a bold segment
    const overlaps = segments.some(s => 
      (match!.index >= s.start && match!.index < s.end) ||
      (match!.index + match![0].length > s.start && match!.index + match![0].length <= s.end)
    )
    if (!overlaps) {
      segments.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'italic',
        content: match[1]
      })
    }
  }

  // Sort segments by start position
  segments.sort((a, b) => a.start - b.start)

  // Build the result
  let lastIndex = 0
  for (const segment of segments) {
    // Add text before this segment
    if (segment.start > lastIndex) {
      parts.push(text.slice(lastIndex, segment.start))
    }

    // Add formatted segment
    if (segment.type === 'bold') {
      parts.push(<strong key={key++}>{segment.content}</strong>)
    } else {
      parts.push(<em key={key++}>{segment.content}</em>)
    }

    lastIndex = segment.end
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

// Highlight helpers
// Apply highlights that are expressed in global character offsets.
function applyHighlightsGlobal(
  content: (string | JSX.Element)[],
  highlights: { start: number; end: number; text: string }[],
  baseCharIndex: number,
  parts: any[],
  partIndex: number,
  lineIndex: number
): (string | JSX.Element)[] {
  // Compute the character offset at the start of this part (sum lengths of earlier parts)
  let partOffset = 0
  for (let i = 0; i < partIndex; i++) {
    const p = parts[i]
    if (p.type === 'text') {
      // normalize CRLF -> LF so lengths match browser selection normalization
      const pContent = String(p.content).replace(/\r\n/g, '\n')
      partOffset += pContent.length
    }
  }

  // Compute offset of this line within the part, using normalized content
  const partContent = String(parts[partIndex].content).replace(/\r\n/g, '\n')
  const lines = partContent.split('\n')
  let lineOffset = 0
  for (let i = 0; i < lineIndex; i++) {
    lineOffset += lines[i].length
    // account for the explicit newline between lines
    lineOffset += 1
  }

  const lineText = content.map(c => typeof c === 'string' ? c : c.props?.children || '').join('')
  const lineStartGlobal = baseCharIndex + partOffset + lineOffset
  const lineEndGlobal = lineStartGlobal + lineText.length

  // Find highlights that overlap this line
  const relevant = highlights.filter(h => h.end > lineStartGlobal && h.start < lineEndGlobal)
    .sort((a, b) => a.start - b.start)

  if (relevant.length === 0) return content

  const partsOut: (string | JSX.Element)[] = []
  let lastPos = lineStartGlobal
  let key = 1000

  for (const h of relevant) {
    const segStart = Math.max(h.start, lineStartGlobal)
    const segEnd = Math.min(h.end, lineEndGlobal)
    if (segStart > lastPos) {
      partsOut.push(lineText.slice(lastPos - lineStartGlobal, segStart - lineStartGlobal))
    }
    partsOut.push(
      <mark key={key++} className="highlight-mark">
        {lineText.slice(segStart - lineStartGlobal, segEnd - lineStartGlobal)}
      </mark>
    )
    lastPos = segEnd
  }

  if (lastPos < lineEndGlobal) {
    partsOut.push(lineText.slice(lastPos - lineStartGlobal))
  }

  return partsOut
}