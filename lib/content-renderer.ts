/**
 * Content renderer utilities for processing question content
 * Handles image detection, LaTeX math conversion, and text formatting
 */

/**
 * Detects image tags like <89-1-12> and returns the filename
 */
export function extractImageId(text: string): string | null {
  const match = text.match(/<(\d+-\d+-\d+(?:-\d+)?)>/)
  return match ? match[1] : null
}

/**
 * Detects and extracts all LaTeX expressions in square brackets [...]
 */
export function extractLatexExpressions(text: string): { plain: string; latex: RegExp } {
  return {
    plain: text,
    latex: /\[([^\]]+)\]/g,
  }
}

/**
 * Parse content to render images and LaTeX
 * Returns JSX-compatible format indicators
 * Updated to handle content that contains ONLY an image reference
 */
export function parseContent(content: string): Array<{
  type: "text" | "image" | "math"
  value: string
}> {
  const parts: Array<{ type: "text" | "image" | "math"; value: string }> = []
  let lastIndex = 0

  // Check for image tags first
  const imageRegex = /<(\d+-\d+-\d+(?:-\d+)?)>/g
  let imageMatch

  while ((imageMatch = imageRegex.exec(content)) !== null) {
    // Add text before image (only if non-empty)
    if (imageMatch.index > lastIndex) {
      const textBefore = content.substring(lastIndex, imageMatch.index).trim()
      if (textBefore) {
        parts.push({
          type: "text",
          value: textBefore,
        })
      }
    }

    // Add image
    parts.push({
      type: "image",
      value: imageMatch[1],
    })

    lastIndex = imageRegex.lastIndex
  }

  // Add remaining text and process for LaTeX
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex).trim()

    if (remainingText) {
      const mathRegex = /\[([^\]]+)\]/g
      let mathMatch
      let textLastIndex = 0

      while ((mathMatch = mathRegex.exec(remainingText)) !== null) {
        // Add text before math
        if (mathMatch.index > textLastIndex) {
          const textBeforeMath = remainingText.substring(textLastIndex, mathMatch.index).trim()
          if (textBeforeMath) {
            parts.push({
              type: "text",
              value: textBeforeMath,
            })
          }
        }

        // Add math
        parts.push({
          type: "math",
          value: mathMatch[1],
        })

        textLastIndex = mathRegex.lastIndex
      }

      // Add remaining text
      if (textLastIndex < remainingText.length) {
        const finalText = remainingText.substring(textLastIndex).trim()
        if (finalText) {
          parts.push({
            type: "text",
            value: finalText,
          })
        }
      }
    }
  }

  return parts.length > 0 ? parts : [{ type: "text", value: content }]
}
