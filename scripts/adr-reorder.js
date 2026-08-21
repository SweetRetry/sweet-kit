import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ADR_FILE_PATTERN = /^(\d{4})-([a-z0-9][a-z0-9-]*)\.md$/
const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)))
const adrDirectory = join(repositoryRoot, "adr")

function printUsage() {
  console.log(`Usage: pnpm adr:reorder [--check]

Reassign ADR filenames and references to contiguous four-digit numbers.

Options:
  --check  Report numbering gaps without changing files
  --help   Show this help`)
}

function parseArguments() {
  const arguments_ = process.argv.slice(2)
  const unknownArgument = arguments_.find(
    (argument) => argument !== "--check" && argument !== "--help"
  )

  if (unknownArgument) {
    throw new Error(`Unknown argument: ${unknownArgument}`)
  }

  return {
    check: arguments_.includes("--check"),
    help: arguments_.includes("--help"),
  }
}

function readAdrEntries() {
  return readdirSync(adrDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const match = ADR_FILE_PATTERN.exec(entry.name)
      if (!match) return undefined

      return {
        name: entry.name,
        number: match[1],
        numericNumber: Number(match[1]),
        slug: match[2],
      }
    })
    .filter((entry) => entry !== undefined)
    .sort(
      (left, right) =>
        left.numericNumber - right.numericNumber || left.name.localeCompare(right.name, "en")
    )
}

function createMoves(entries) {
  if (entries.length > 9_999) {
    throw new Error("ADR count exceeds the four-digit numbering range")
  }

  return entries
    .map((entry, index) => {
      const newNumber = String(index + 1).padStart(4, "0")
      return {
        oldName: entry.name,
        oldNumber: entry.number,
        newName: `${newNumber}-${entry.slug}.md`,
        newNumber,
      }
    })
    .filter((move) => move.oldName !== move.newName)
}

function validateHeaders(entries) {
  for (const entry of entries) {
    const content = readFileSync(join(adrDirectory, entry.name), "utf8")
    const headerNumber = /^# ADR (\d{4})(?:\b|：|:)/.exec(content)?.[1]

    if (headerNumber !== entry.number) {
      throw new Error(`${entry.name} must start with an ADR ${entry.number} heading`)
    }
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function rewriteReferences(content, moves) {
  const moveByOldName = new Map(moves.map((move) => [move.oldName, move]))
  const moveByOldNumber = new Map(moves.map((move) => [move.oldNumber, move]))

  let rewritten = content.replace(
    /\[(\d{4})\]\(([^)\n]*\/)?(\d{4}-[^)\n/]+\.md)([^)\n]*)\)/g,
    (match, label, prefix = "", filename, suffix = "") => {
      const move = moveByOldName.get(filename)
      if (!move) return match

      const newLabel = label === move.oldNumber ? move.newNumber : label
      return `[${newLabel}](${prefix}${move.newName}${suffix})`
    }
  )

  const filenamePattern = new RegExp(
    moves
      .map((move) => escapeRegExp(move.oldName))
      .sort((left, right) => right.length - left.length)
      .join("|"),
    "g"
  )
  rewritten = rewritten.replace(filenamePattern, (filename) => moveByOldName.get(filename).newName)

  const numberPattern = new RegExp(
    `\\bADR (${moves.map((move) => move.oldNumber).join("|")})\\b`,
    "g"
  )
  return rewritten.replace(
    numberPattern,
    (_match, number) => `ADR ${moveByOldNumber.get(number).newNumber}`
  )
}

function renameAdrFiles(moves) {
  const oldNames = new Set(moves.map((move) => move.oldName))
  const stagedMoves = moves.map((move, index) => ({
    ...move,
    tempName: `.adr-reorder-${process.pid}-${index}.tmp`,
  }))

  for (const move of stagedMoves) {
    const targetPath = join(adrDirectory, move.newName)
    if (existsSync(targetPath) && !oldNames.has(move.newName)) {
      throw new Error(`Cannot overwrite existing file: ${move.newName}`)
    }
  }

  try {
    for (const move of stagedMoves) {
      renameSync(join(adrDirectory, move.oldName), join(adrDirectory, move.tempName))
    }

    for (const move of stagedMoves) {
      renameSync(join(adrDirectory, move.tempName), join(adrDirectory, move.newName))
    }
  } catch (error) {
    for (const move of stagedMoves) {
      const targetPath = join(adrDirectory, move.newName)
      const tempPath = join(adrDirectory, move.tempName)
      if (existsSync(targetPath) && !existsSync(tempPath)) renameSync(targetPath, tempPath)
    }

    for (const move of stagedMoves) {
      const tempPath = join(adrDirectory, move.tempName)
      if (existsSync(tempPath)) renameSync(tempPath, join(adrDirectory, move.oldName))
    }

    throw error
  }
}

function listRepositoryFiles() {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: repositoryRoot, encoding: "utf8" }
  )

  return output
    .split("\0")
    .filter(Boolean)
    .filter((relativePath) => {
      const absolutePath = join(repositoryRoot, relativePath)
      return existsSync(absolutePath) && statSync(absolutePath).isFile()
    })
}

function updateRepositoryReferences(moves) {
  let updatedFiles = 0

  for (const relativePath of listRepositoryFiles()) {
    const absolutePath = join(repositoryRoot, relativePath)
    const buffer = readFileSync(absolutePath)
    if (buffer.includes(0)) continue

    const content = buffer.toString("utf8")
    const rewritten = rewriteReferences(content, moves)
    if (rewritten === content) continue

    writeFileSync(absolutePath, rewritten)
    updatedFiles += 1
  }

  return updatedFiles
}

function main() {
  const options = parseArguments()
  if (options.help) {
    printUsage()
    return
  }

  const entries = readAdrEntries()
  validateHeaders(entries)
  const moves = createMoves(entries)

  if (moves.length === 0) {
    console.log("ADR numbering is already contiguous")
    return
  }

  for (const move of moves) console.log(`${move.oldName} -> ${move.newName}`)

  if (options.check) {
    process.exitCode = 1
    return
  }

  renameAdrFiles(moves)
  const updatedFiles = updateRepositoryReferences(moves)
  console.log(`Reordered ${moves.length} ADR files and updated ${updatedFiles} referenced files`)
}

main()
