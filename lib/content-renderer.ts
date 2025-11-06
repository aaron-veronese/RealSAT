export type ContentPart = {
  type: "text" | "latex" | "image" | "table"
  content: string
  headers?: string[]
  rows?: string[][]
}

export function parseContent(text: string): ContentPart[] {
  // Check for images first: @@imageId@@
  const imageRegex = /@@([^@]+)@@/g
  let match
  const parts: ContentPart[] = []
  let lastIndex = 0

  while ((match = imageRegex.exec(text)) !== null) {
    // Add text before image
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index)
      parts.push(...parseTextAndLatex(textBefore))
    }

    // Add image
    parts.push({ type: "image", content: match[1] })
    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex)
    parts.push(...parseTextAndLatex(remaining))
  }

  // If no images were found, just parse text/latex
  if (parts.length === 0) {
    return parseTextAndLatex(text)
  }

  return parts
}

function convertFractionsToLatex(latex: string): string {
  // First pass: Handle fractions with parentheses on both sides
  let result = latex.replace(
    /\(([^)]+)\)\/\(([^)]+)\)/g,
    '\\frac{$1}{$2}'
  )
  
  // Second pass: Handle fractions with parentheses in numerator only
  result = result.replace(
    /\(([^)]+)\)\/([a-zA-Z0-9]+)/g,
    '\\frac{$1}{$2}'
  )
  
  // Third pass: Handle fractions with parentheses in denominator only
  result = result.replace(
    /([a-zA-Z0-9]+)\/\(([^)]+)\)/g,
    '\\frac{$1}{$2}'
  )
  
  // Fourth pass: Handle simple variable/number fractions
  // Match letter(s)/digit(s) or digit(s)/digit(s), stopping before operators or more letters
  result = result.replace(
    /([a-zA-Z]+[0-9]*|[0-9]+)\/([0-9]+)(?=[+\-,)\s]|$)/g,
    '\\frac{$1}{$2}'
  )
  
  // Fifth pass: Handle single letter / single letter
  result = result.replace(
    /([a-zA-Z])\/([a-zA-Z])(?![a-zA-Z0-9])/g,
    '\\frac{$1}{$2}'
  )
  
  return result
}

function convertInequalitySymbols(latex: string): string {
  return latex
    .replace(/<=/g, '\\leq ')
    .replace(/>=/g, '\\geq ')
}

function parseTextAndLatex(text: string): ContentPart[] {
  const parts: ContentPart[] = []
  
  // Check if the entire text is a table (starts with header|data pattern)
  if (text.includes('|') && !text.includes('@@')) {
    // Split by pattern: space followed by digit (handles numbers with commas)
    const lines = text.split(/\s+(?=[\d])/)
    
    // First part is headers
    const headers = lines[0].split('|').map(h => h.trim())
    
    // Rest are data rows
    const rows = lines.slice(1).map(line => 
      line.split('|').map(cell => cell.trim())
    )
    
    parts.push({ type: "table", content: text, headers, rows })
    return parts
  }

  // Parse LaTeX: $$content$$
  const latexRegex = /\$\$([^\$]+)\$\$/g
  let lastIndex = 0
  let match

  while ((match = latexRegex.exec(text)) !== null) {
    // Add text before LaTeX
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index)
      if (textBefore) parts.push({ type: "text", content: textBefore })
    }

    // Process the LaTeX content (match[1] is the content between $$)
    let latexContent = match[1]
    latexContent = convertInequalitySymbols(latexContent)
    latexContent = convertFractionsToLatex(latexContent)
    
    parts.push({ type: "latex", content: latexContent })
    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex)
    if (remaining) parts.push({ type: "text", content: remaining })
  }

  return parts
}