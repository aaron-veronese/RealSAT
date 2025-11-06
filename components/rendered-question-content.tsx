"use client"

import type React from "react"

import { useMemo } from "react"

interface RenderedQuestionContentProps {
  questionText: string
  contentColumns?: (string | null | undefined)[]
  questionNumber?: number
}

/**
 * Component to render question content with proper formatting:
 * - Removes inline question numbers (already displayed in header)
 * - Converts [math expressions] to inline LaTeX
 * - Detects and renders <TestID-Module-Question> as images
 * - Displays multiple content columns with line breaks
 */
export function RenderedQuestionContent({
  questionText,
  contentColumns,
  questionNumber,
}: RenderedQuestionContentProps) {
  const cleanedText = useMemo(() => {
    let text = String(questionText || "")
    // Remove patterns like "1." or "Question 1:" from the start
    text = text.replace(/^(?:Question\s+)?\d+[.:]\s*/i, "")
    return text
  }, [questionText])

  const renderContent = (content: string | null | undefined) => {
    const text = String(content || "")
    const parts: (string | React.ReactNode)[] = []
    let lastIndex = 0

    // Find all image patterns and math expressions
    const combined = /(<\d+-\d+-\d+>|\[[^\]]+\])/g
    let match

    while ((match = combined.exec(text)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      if (match[0].startsWith("<") && match[0].endsWith(">")) {
        // Image
        const imageId = match[0].slice(1, -1)
        parts.push(
          <div key={`img-${imageId}`} className="my-4 flex flex-col gap-2">
            <img
              src={`/public/images/${imageId}.png`}
              alt={`Diagram ${imageId}`}
              className="max-w-full h-auto border rounded"
              loading="lazy"
            />
            <p className="text-xs text-muted-foreground">
              Image: {imageId} (Upload to /public/images/, Supabase Storage, or AWS S3)
            </p>
          </div>,
        )
      } else if (match[0].startsWith("[") && match[0].endsWith("]")) {
        // Math expression
        const mathContent = match[0].slice(1, -1)
        parts.push(
          <span key={`math-${lastIndex}`} className="inline-math">
            {`\$$${mathContent}\$$`}
          </span>,
        )
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts
  }

  return (
    <div className="prose prose-sm max-w-none space-y-4">
      {/* Main question text with math and images */}
      <div className="leading-relaxed">{renderContent(cleanedText)}</div>

      {/* Content columns with line breaks */}
      {contentColumns && contentColumns.length > 0 && (
        <div className="space-y-3 my-6">
          {contentColumns
            .filter((col) => col) // Filter out null/undefined values
            .map((column, index) => (
              <div key={index}>
                <div className="leading-relaxed">{renderContent(column)}</div>
                {index < contentColumns.length - 1 && <hr className="my-3 border-gray-300" />}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
