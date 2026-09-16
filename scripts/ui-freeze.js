/**
 * 冻结 packages/ui/src/components 的实现（F1）：范围内的文件内容必须与基线逐字节一致。
 *
 * 基线是「上一次被显式接受的状态」，**不保证等于上游最新版本**。两个问题分开回答：
 * 本脚本答「我们改过它没有」（离线、确定性、进 CI）；上游是否已变由升级时的
 * `shadcn diff <component>` 回答（联网、手动）。范围与解冻流程见 `AGENTS.md` › 架构约定。
 *
 * 用法：
 *   node scripts/ui-freeze.js            检查，偏离时退出码 1
 *   node scripts/ui-freeze.js --update   显式接受当前状态并重写基线
 *
 * 输出：一致时打印 ✓ 与受检文件数；偏离时按 M/A/D 逐文件列出并给出处置方式。
 */

import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const MANIFEST = "packages/ui/frozen.manifest.json"

const MANIFEST_COMMENT =
  "F1 基线：scope 下的文件必须与基线逐字节一致。基线是上一次被显式接受的状态，不等价于上游最新版本；与上游的一致性由升级时的 shadcn diff 确认。改动须经 pnpm ui:freeze:update 显式接受，并单独提交说明是上游升级还是记录在案的增强。"

function readManifest() {
  try {
    return JSON.parse(readFileSync(join(repositoryRoot, MANIFEST), "utf8"))
  } catch (error) {
    console.error(`✗ 无法读取基线 ${MANIFEST}：${error.message}`)
    process.exit(1)
  }
}

/** 换行归一化，避免 CRLF 检出把冻结判定变成噪声。 */
function hashFile(relativePath) {
  const content = readFileSync(join(repositoryRoot, relativePath), "utf8")

  return createHash("sha256")
    .update(content.replace(/\r\n/g, "\n"), "utf8")
    .digest("hex")
}

function listScopeFiles(scope) {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z", "--", ...scope],
    { cwd: repositoryRoot, encoding: "utf8" }
  )

  return output
    .split("\0")
    .filter(Boolean)
    .filter((file) => !basename(file).startsWith("."))
    .sort()
}

function currentHashes(scope) {
  const hashes = new Map()

  for (const file of listScopeFiles(scope)) {
    // git ls-files --cached 仍会列出已从工作区删除的文件，删除交给 diff 报 D。
    if (!existsSync(join(repositoryRoot, file))) {
      continue
    }

    hashes.set(file, hashFile(file))
  }

  return hashes
}

function diffFiles(recorded, current) {
  const changes = []

  for (const [file, hash] of current) {
    const previous = recorded.get(file)

    if (previous === undefined) {
      changes.push({ status: "A", file })
    } else if (previous !== hash) {
      changes.push({ status: "M", file })
    }
  }

  for (const file of recorded.keys()) {
    if (!current.has(file)) {
      changes.push({ status: "D", file })
    }
  }

  return changes.sort((a, b) => a.file.localeCompare(b.file))
}

function writeManifest(hashes) {
  const files = {}

  for (const file of [...hashes.keys()].sort()) {
    files[file] = hashes.get(file)
  }

  const manifest = { $comment: MANIFEST_COMMENT, scope: readManifest().scope, files }

  writeFileSync(
    join(repositoryRoot, MANIFEST),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  )
}

function reportDrift(changes) {
  const scopeLabel = readManifest().scope.join("、")

  console.log(`✗ ${scopeLabel} 偏离冻结基线（F1）\n`)

  for (const change of changes) {
    console.log(`  ${change.status} ${change.file}`)
  }

  console.log()
  console.log("该范围是上游 shadcn/ui 实现，默认字节冻结。处置方式：")
  console.log("  · 误改        git checkout -- <file>")
  console.log("  · 上游升级    pnpm ui:freeze:update，提交信息写明「上游升级」")
  console.log("  · 比对上游    shadcn diff <component>（联网、手动，本脚本不联网）")
  console.log("  · 新增组件    shadcn add 后 pnpm ui:freeze:update，单独提交")
  console.log("  · 新形态     默认落点是 recipe（packages/ui/src/recipes 或应用内），")
  console.log("               不是改上游组件；确需改组件时，先确认该形态已被第二个应用独立需要。")

  process.exitCode = 1
}

function main() {
  const update = process.argv.includes("--update")
  const manifest = readManifest()
  const scope = manifest.scope

  if (!Array.isArray(scope) || scope.length === 0) {
    console.error(`✗ ${MANIFEST} 缺少 scope，无法确定冻结范围`)
    process.exit(1)
  }

  const current = currentHashes(scope)

  if (update) {
    const recorded = new Map(Object.entries(manifest.files ?? {}))
    const changes = diffFiles(recorded, current)

    if (changes.length === 0) {
      console.log(`✓ 基线已是最新（${current.size} 个文件）`)
      return
    }

    writeManifest(current)
    console.log(`✓ 已重写 ${MANIFEST}（${current.size} 个文件，${changes.length} 处变化）`)

    for (const change of changes) {
      console.log(`  ${change.status} ${change.file}`)
    }

    console.log("→ 本次解冻请单独提交，并在提交信息里说明是上游升级还是记录在案的增强。")
    return
  }

  const changes = diffFiles(new Map(Object.entries(manifest.files ?? {})), current)

  if (changes.length === 0) {
    console.log(`✓ ${scope.join("、")} 与冻结基线一致（${current.size} 个文件）`)
    return
  }

  reportDrift(changes)
}

main()
