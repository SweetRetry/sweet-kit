import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const SELF = "scripts/ui-guardrails.js"

const CHECKS = [
  {
    rule: "ui-animation",
    pattern: /\btransition-all\b/g,
    message: "transition-all 会连带过渡未计划的属性",
    suggestion: "显式声明属性，如 transition-[transform,opacity]",
  },
  {
    rule: "ui-animation",
    pattern: /\btransition\s*:\s*all\b/g,
    message: "transition: all 会连带过渡未计划的属性",
    suggestion: "显式声明属性，如 transition: transform, opacity",
  },
  {
    rule: "z-index",
    pattern: /(?<![\w-])-?z-\[[^\]]+\]/g,
    message: "z-index 使用任意值，脱离语义阶梯",
    suggestion: "改用 -z-10 / z-0 / z-10 / z-20 / z-30 / z-40 / z-50",
  },
  {
    rule: "ui-radius",
    pattern: /(?<![\w-])rounded(?:-[a-z]+)?-\[[^\]]+\]/g,
    message: "圆角使用任意值，脱离圆角阶梯",
    suggestion: "改用 rounded-xs/sm/md/lg/xl/2xl/3xl/full，或先加 Token",
  },
  {
    rule: "ui-layout-and-loading",
    pattern:
      /(?<![\w-])-?(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-\[[^\]]+\]/g,
    message: "间距或内边距使用任意值，脱离 8px 网格",
    suggestion: "改用 8px 阶梯，或确认它属于行高托底/光学微调值域",
  },
]

function listSourceFiles() {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: repositoryRoot, encoding: "utf8" }
  )

  return output
    .split("\0")
    .filter(Boolean)
    .filter((file) => /\.(tsx|jsx|ts|css)$/.test(file))
    .filter(
      (file) =>
        !file.includes("node_modules") &&
        !file.includes("/dist/") &&
        !file.startsWith("packages/ui/") &&
        file !== SELF
    )
}

function scanContent(content, file) {
  const findings = []

  for (const check of CHECKS) {
    const lines = content.split("\n")

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index]
      check.pattern.lastIndex = 0
      let match = check.pattern.exec(line)

      while (match !== null) {
        findings.push({
          file,
          line: index + 1,
          column: match.index + 1,
          rule: check.rule,
          match: match[0],
          message: check.message,
          suggestion: check.suggestion,
        })
        match = check.pattern.exec(line)
      }
    }
  }

  return findings
}

function main() {
  const allFindings = []

  for (const file of listSourceFiles()) {
    const content = readFileSync(join(repositoryRoot, file), "utf8")
    allFindings.push(...scanContent(content, file))
  }

  if (allFindings.length === 0) {
    console.log("✓ No arbitrary UI values found")
    return
  }

  console.log(`Found ${allFindings.length} UI guardrail violation(s):\n`)

  for (const finding of allFindings) {
    console.log(`  ${finding.file}:${finding.line}:${finding.column}`)
    console.log(`    [${finding.rule}] ${finding.match} — ${finding.message}`)
    console.log(`    → ${finding.suggestion}`)
    console.log()
  }

  process.exitCode = 1
}

main()
