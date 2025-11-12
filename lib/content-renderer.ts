export type ContentPart = {
  type: "text" | "latex" | "image" | "table"
  content: string
  headers?: string[]
  rows?: string[][]
}

export function parseContent(text: string): ContentPart[] {
  const parts: ContentPart[] = []
  let remaining = text

  while (remaining.length > 0) {
    // Check for image pattern @@image-id@@
    const imageMatch = remaining.match(/^@@([^@]+)@@/)
    if (imageMatch) {
      parts.push({ type: "image", content: imageMatch[1] })
      remaining = remaining.slice(imageMatch[0].length)
      continue
    }

    // Check for table pattern (lines with | or ||)
    const tableMatch = remaining.match(/^((?:[^\n]*\|[^\n]*\n?)+)/)
    if (tableMatch) {
      const tableText = tableMatch[1].trim()
      const normalizedText = tableText.includes('||') && !tableText.includes('\n')
        ? tableText.replace(/\|\|/g, '\n')
        : tableText
      const lines = normalizedText.split('\n').map((line) => line.trim()).filter((l) => l.length > 0)
      
      if (lines.length > 0) {
        // First line with || is header, otherwise first line is header
        const hasHeaderDelimiter = lines[0].includes('||')
        let headers: string[] = []
        let dataLines: string[] = []

        if (hasHeaderDelimiter) {
          headers = lines[0].split('||').map(h => h.trim())
          dataLines = lines.slice(1)
        } else {
          headers = lines[0].split('|').map(h => h.trim())
          dataLines = lines.slice(1)
        }

        const rows = dataLines.map(line => {
          // Check if this line uses || for row separation
          if (line.includes('||')) {
            return line.split('||').map(cell => cell.trim())
          }
          return line.split('|').map(cell => cell.trim())
        })

        parts.push({ type: "table", content: tableText, headers, rows })
      }
      
      remaining = remaining.slice(tableMatch[0].length)
      continue
    }

    // Check for LaTeX pattern $$...$$
    const latexMatch = remaining.match(/^\$\$([^$]+)\$\$/)
    if (latexMatch) {
      parts.push({ type: "latex", content: latexMatch[1] })
      remaining = remaining.slice(latexMatch[0].length)
      continue
    }

    // Find next special pattern
    const nextSpecialIndex = Math.min(
      ...[
        remaining.indexOf('@@'),
        remaining.indexOf('$$'),
        remaining.search(/^[^\n]*\|/m)
      ].filter(i => i !== -1)
    )

    if (nextSpecialIndex === -1 || nextSpecialIndex === Infinity) {
      // No more special patterns, rest is text
      parts.push({ type: "text", content: remaining })
      break
    }

    // Add text before next special pattern
    if (nextSpecialIndex > 0) {
      parts.push({ type: "text", content: remaining.slice(0, nextSpecialIndex) })
      remaining = remaining.slice(nextSpecialIndex)
    }
  }

  return parts
}