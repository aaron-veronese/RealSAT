"use client"

import Image from "next/image"
import { useEffect } from "react"
import { parseContent } from "@/lib/content-renderer"

interface RenderedContentProps {
  content: string
}

export function RenderedContent({ content }: RenderedContentProps) {
  const parts = parseContent(content)

  useEffect(() => {
    // Trigger MathJax to render any new math expressions
    if (window.MathJax) {
      window.MathJax.typesetPromise?.()
    }
  }, [parts])

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "text") {
          return (
            <span key={index} className="text-base leading-relaxed inline">
              {part.value}
            </span>
          )
        }

        if (part.type === "image") {
          return (
            <div key={index} className="my-4 flex justify-center">
              <div className="relative max-w-lg">
                <Image
                  src={`/question-data/images/test1/${part.value}.png`}
                  alt={`Diagram ${part.value}`}
                  width={600}
                  height={400}
                  className="rounded-md border"
                  unoptimized
                />
              </div>
            </div>
          )
        }

        if (part.type === "math") {
          return (
            <span
              key={index}
              className="inline mx-0.5 text-base leading-relaxed align-middle"
              dangerouslySetInnerHTML={{
                __html: `\\(${part.value}\\)`,
              }}
            />
          )
        }

        return null
      })}
    </>
  )
}