"use client"

import Image from "next/image"
import { parseContent } from "@/lib/content-renderer"
import { InlineMath, BlockMath } from "react-katex"

interface RenderedContentProps {
  content: string
  testNumber?: number
  highlights?: {partIndex: number, lineIndex: number, start: number, end: number, text: string}[]
  basePartIndex?: number
  enableFormatting?: boolean
}

export function RenderedContent({ 
  content, 
  testNumber = 1, 
  highlights = [], 
  basePartIndex = 0,
  enableFormatting = false 
}: RenderedContentProps) {
  const parts = parseContent(content)

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "text") {
          // Only split on explicit \n markers for line breaks (not all newlines)
          const lines = part.content.split('\\n')
          
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
                      ? applyHighlights(processedLine, highlights, basePartIndex + index, lineIdx)
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

        return null
      })}
    </>
  )
}

// Apply bold (**text**), italic (*text*), underline (_text_) with support for nesting
function applyTextFormatting(text: string): (string | JSX.Element)[] {
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
function applyHighlights(
  content: (string | JSX.Element)[], 
  highlights: {partIndex: number, lineIndex: number, start: number, end: number, text: string}[], 
  partIndex: number, 
  lineIndex: number
): (string | JSX.Element)[] {
  const relevant = highlights.filter(h => h.partIndex === partIndex && h.lineIndex === lineIndex)
    .sort((a, b) => a.start - b.start)
  
  if (relevant.length === 0) return content

  // Flatten content to string for highlighting
  const text = content.map(c => typeof c === 'string' ? c : c.props?.children || '').join('')
  
  const parts: (string | JSX.Element)[] = []
  let lastEnd = 0
  let key = 1000

  for (const h of relevant) {
    if (h.start > lastEnd) {
      parts.push(text.slice(lastEnd, h.start))
    }
    parts.push(
      <mark key={key++} className="bg-sky-500/30 dark:bg-orange-400/30">
        {text.slice(h.start, h.end)}
      </mark>
    )
    lastEnd = h.end
  }
  
  if (lastEnd < text.length) {
    parts.push(text.slice(lastEnd))
  }

  return parts
}