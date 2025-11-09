"use client"

import Image from "next/image"
import { parseContent } from "@/lib/content-renderer"
import { InlineMath, BlockMath } from "react-katex"

interface RenderedContentProps {
  content: string
  testNumber?: number
  highlights?: {partIndex: number, lineIndex: number, start: number, end: number, text: string}[]
  basePartIndex?: number
}

export function RenderedContent({ content, testNumber = 1, highlights = [], basePartIndex = 0 }: RenderedContentProps) {
  const parts = parseContent(content)

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "text") {
          const lines = part.content.split(/\r?\n/)
          const textParts = lines.map((line, i) => (
            <span key={i} data-line-index={i}>
              {applyHighlights(line, highlights, basePartIndex + index, i)}
            </span>
          ))
          return (
            <span key={index} className="text-base leading-relaxed whitespace-pre-line" data-part-index={index}>
              {textParts}
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
                        {header}
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
                          {cell}
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

// ----- Highlight helpers -----
function applyHighlights(text: string, highlights: {partIndex: number, lineIndex: number, start: number, end: number, text: string}[], partIndex: number, lineIndex: number) {
  const relevant = highlights.filter(h => h.partIndex === partIndex && h.lineIndex === lineIndex).sort((a, b) => a.start - b.start)
  if (relevant.length === 0) return text

  const parts: (string | JSX.Element)[] = []
  let lastEnd = 0
  let key = 0

  for (const h of relevant) {
    if (h.start > lastEnd) {
      parts.push(text.slice(lastEnd, h.start))
    }
    parts.push(
      <mark key={key++} className="bg-sky-500/100 dark:bg-orange-400/100">
        {text.slice(h.start, h.end)}
      </mark>
    )
    lastEnd = h.end
  }
  if (lastEnd < text.length) {
    parts.push(text.slice(lastEnd))
  }
  return parts.map((part, idx) => typeof part === 'string' ? <span key={idx}>{part}</span> : part)
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
