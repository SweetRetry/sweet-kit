import { existsSync } from "node:fs"
import path from "node:path"
import { type AgentSpanRecord, readAgentTrace } from "@workspace/observability/agent-traces"

import { cliEnv } from "./env.ts"

export interface TraceCommandOptions {
  file?: string[]
  json?: boolean
}

function statusLabel(span: AgentSpanRecord): string {
  if (span.status.code === 2) return "ERROR"
  if (span.status.code === 1) return "OK"
  const httpStatus = span.attributes["http.response.status_code"]
  if (typeof httpStatus === "number" && httpStatus < 500) return "OK"
  return "UNSET"
}

function errorMessage(span: AgentSpanRecord): string | undefined {
  if (span.status.message) return span.status.message
  for (const event of span.events) {
    const message = event.attributes?.["exception.message"]
    if (typeof message === "string") return message
  }
  return undefined
}

function formatTree(spans: AgentSpanRecord[]): string {
  const byId = new Map(spans.map((span) => [span.spanId, span]))
  const children = new Map<string, AgentSpanRecord[]>()
  const roots: AgentSpanRecord[] = []

  for (const span of spans) {
    if (!span.parentSpanId || !byId.has(span.parentSpanId)) {
      roots.push(span)
      continue
    }
    const siblings = children.get(span.parentSpanId) ?? []
    siblings.push(span)
    children.set(span.parentSpanId, siblings)
  }

  const lines: string[] = []
  const append = (span: AgentSpanRecord, prefix: string, isLast: boolean) => {
    const connector = prefix ? (isLast ? "└─ " : "├─ ") : ""
    lines.push(
      `${prefix}${connector}${statusLabel(span)} ${span.name} ${span.durationMs.toFixed(2)}ms [${span.spanId}]`
    )
    const message = errorMessage(span)
    if (message) {
      lines.push(`${prefix}${prefix ? (isLast ? "   " : "│  ") : ""}   error: ${message}`)
    }

    const nested = children.get(span.spanId) ?? []
    nested.forEach((child, index) => {
      append(
        child,
        `${prefix}${prefix ? (isLast ? "   " : "│  ") : ""}`,
        index === nested.length - 1
      )
    })
  }

  roots.forEach((root, index) => {
    append(root, "", index === roots.length - 1)
  })
  return lines.join("\n")
}

export async function showTrace(traceId: string, options: TraceCommandOptions) {
  const filePaths =
    options.file && options.file.length > 0
      ? options.file.map((file) => path.resolve(file))
      : cliEnv.traceFiles

  const spans: AgentSpanRecord[] = []

  for (const filePath of filePaths) {
    // 默认列表覆盖 server 与 worker，缺其中一个（例如没跑过 worker）不算错误
    if (!existsSync(filePath)) continue
    spans.push(...(await readAgentTrace(filePath, traceId)))
  }

  spans.sort((left, right) => left.startTime.localeCompare(right.startTime))

  if (spans.length === 0) {
    throw new Error(`未在 ${filePaths.join(", ")} 找到 trace ${traceId}`)
  }

  if (options.json) {
    process.stdout.write(`${JSON.stringify({ traceId: traceId.toLowerCase(), spans }, null, 2)}\n`)
    return
  }

  process.stdout.write(
    `trace ${traceId.toLowerCase()} (${spans.length} spans)\n${formatTree(spans)}\n`
  )
}
