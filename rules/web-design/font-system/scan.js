const ALLOWED_TEXT_CLASSES = [
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
  "text-4xl",
  "text-5xl",
  "text-6xl",
  "text-7xl",
  "text-8xl",
  "text-9xl",
]

const ARBITRARY_FONT_SIZE_PATTERN = /text-\[[\d.]+(?:px|rem|em)\]/g

export function scanContent(content, filePath = "inline.tsx") {
  const lines = content.split("\n")
  const findings = []

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    ARBITRARY_FONT_SIZE_PATTERN.lastIndex = 0

    let match
    while ((match = ARBITRARY_FONT_SIZE_PATTERN.exec(line)) !== null) {
      findings.push({
        file: filePath,
        line: lineIndex + 1,
        column: match.index + 1,
        matched: match[0],
        message: `Arbitrary font size "${match[0]}" → use standard Tailwind text utility (text-xs ~ text-9xl)`,
        suggestion: suggestReplacement(match[0]),
      })
    }
  }

  return findings
}

function suggestReplacement(arbitrary) {
  const sizeMatch = arbitrary.match(/text-\[([\d.]+)(px|rem|em)\]/)
  if (!sizeMatch) return null

  const value = parseFloat(sizeMatch[1])
  const unit = sizeMatch[2]

  const px = unit === "px" ? value : value * 16

  const scale = [
    { name: "text-xs", px: 12 },
    { name: "text-sm", px: 14 },
    { name: "text-base", px: 16 },
    { name: "text-lg", px: 18 },
    { name: "text-xl", px: 20 },
    { name: "text-2xl", px: 24 },
    { name: "text-3xl", px: 30 },
    { name: "text-4xl", px: 36 },
    { name: "text-5xl", px: 48 },
    { name: "text-6xl", px: 60 },
    { name: "text-7xl", px: 72 },
    { name: "text-8xl", px: 96 },
    { name: "text-9xl", px: 128 },
  ]

  if (px < 12) {
    return "text-xs (minimum allowed: 12px)"
  }

  let closest = scale[0]
  let minDiff = Math.abs(px - scale[0].px)

  for (const entry of scale) {
    const diff = Math.abs(px - entry.px)
    if (diff < minDiff) {
      minDiff = diff
      closest = entry
    }
  }

  return closest.name
}

export { ALLOWED_TEXT_CLASSES }
