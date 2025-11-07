"use client"

import Image from "next/image"
import { parseContent } from "@/lib/content-renderer"
import type { ContentPart } from "@/lib/content-renderer"
import { InlineMath, BlockMath } from "react-katex"

interface RenderedContentProps {
  content: string
  testNumber?: number
}

export function RenderedContent({ content, testNumber = 1 }: RenderedContentProps) {
  const parts = parseContent(content)

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "text") {
          // Split by newline characters and render as separate lines
          const lines = part.content.split(/\r?\n/)
          return (
            <span key={index} className="text-base leading-relaxed whitespace-pre-line">
              {lines.map((line, i) => (
                <span key={i}>
                  {renderWithBr(line)}
                  {i < lines.length - 1 && <br />}
                </span>
              ))}
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
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    {part.headers?.map((header, i) => (
                      <th
                        key={i}
                        className="border border-gray-300 px-4 py-2 text-left font-semibold"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {part.rows?.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {row.map((cell, j) => (
                        <td key={j} className="border border-gray-300 px-4 py-2">
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
            <div key={index} className="my-4">
              <Image
                src={`/images/test${testNumber}/${part.content}.png`}
                alt="Question content"
                width={600}
                height={400}
                className="max-w-full h-auto"
              />
            </div>
          )
        }

        return null
      })}
    </>
  )
}

/**
 * Helper: render <br/> tags inside text safely.
 * This allows you to include <br/> literally in content strings.
 */
function renderWithBr(text: string) {
  const segments = text.split(/<br\s*\/?>/i)
  return segments.map((seg, i) => (
    <span key={i}>
      {seg}
      {i < segments.length - 1 && <br />}
    </span>
  ))
}
