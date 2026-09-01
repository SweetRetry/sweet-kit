const DEPRECATED_PATTERNS = [
  {
    pattern: /z\.string\(\)\.(email|url|uuid|ip|emoji|nanoid|cuid|cuid2|ulid|base64|datetime|date|time)\(/g,
    fix: (_match, method) => {
      const mapping = {
        email: "z.email(",
        url: "z.url(",
        uuid: "z.uuid(",
        ip: "z.ipv4( / z.ipv6(",
        emoji: "z.emoji(",
        nanoid: "z.nanoid(",
        cuid: "z.cuid(",
        cuid2: "z.cuid2(",
        ulid: "z.ulid(",
        base64: "z.base64(",
        datetime: "z.iso.datetime(",
        date: "z.iso.date(",
        time: "z.iso.time(",
      }
      return mapping[method] ?? _match
    },
    message: (method) => `z.string().${method}() → use standalone z.${method}() or z.iso.${method}()`,
  },
  {
    pattern: /z\.nativeEnum\(/g,
    fix: () => "z.enum(",
    message: () => "z.nativeEnum() → z.enum() now accepts TS enums directly",
  },
  {
    pattern: /z\.o(string|number|boolean)\(\)/g,
    fix: (_match, type) => `z.${type}().optional()`,
    message: (type) => `z.o${type}() → z.${type}().optional()`,
  },
  {
    pattern: /\.deepPartial\(\)/g,
    fix: () => null,
    message: () => ".deepPartial() method was removed; use the top-level z.deepPartial(schema)",
  },
  {
    pattern: /z\.function\(\)\s*\.args\(/g,
    fix: () => null,
    message: () => "z.function().args() → z.function({ input: [...], output: ... })",
  },
]

export function scanContent(content, filePath = "inline.ts") {
  const lines = content.split("\n")
  const findings = []

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]

    for (const rule of DEPRECATED_PATTERNS) {
      rule.pattern.lastIndex = 0
      let match
      while ((match = rule.pattern.exec(line)) !== null) {
        findings.push({
          file: filePath,
          line: lineIndex + 1,
          column: match.index + 1,
          matched: match[0],
          message: rule.message(match[1]),
          fix: rule.fix(match[0], match[1]),
        })
      }
    }
  }

  return findings
}

export { DEPRECATED_PATTERNS }
