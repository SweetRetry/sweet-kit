import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { scanContent } from "./scan.js"

const repositoryRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)))

function listSourceFiles() {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: repositoryRoot, encoding: "utf8" }
  )

  return output
    .split("\0")
    .filter(Boolean)
    .filter((f) => /\.(ts|tsx|js|jsx|mts|mjs)$/.test(f))
    .filter((f) => !f.includes("node_modules") && !f.includes("/dist/") && !f.includes("rules/zod-v4/"))
}

function main() {
  const files = listSourceFiles()
  const allFindings = []

  for (const file of files) {
    const content = readFileSync(join(repositoryRoot, file), "utf8")
    allFindings.push(...scanContent(content, file))
  }

  if (allFindings.length === 0) {
    console.log("✓ No deprecated Zod v3 patterns found")
    return
  }

  console.log(`Found ${allFindings.length} deprecated Zod v3 pattern(s):\n`)

  for (const finding of allFindings) {
    const location = `${finding.file}:${finding.line}:${finding.column}`
    const suggestion = finding.fix ? ` → ${finding.fix}` : ""
    console.log(`  ${location}`)
    console.log(`    ${finding.message}${suggestion}`)
    console.log()
  }

  process.exitCode = 1
}

main()
