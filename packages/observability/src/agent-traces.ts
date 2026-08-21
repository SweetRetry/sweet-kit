import { createReadStream } from "node:fs"
import { appendFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { createInterface } from "node:readline"
import type { Attributes, AttributeValue, HrTime } from "@opentelemetry/api"
import { ExportResultCode } from "@opentelemetry/core"
import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base"

const sensitiveKey = /authorization|cookie|password|secret|token/i
const urlKey = /^(http\.url|url\.full)$/

export interface AgentTraceEvent {
  name: string
  time: string
  attributes?: Attributes
}

export interface AgentSpanRecord {
  schemaVersion: 1
  traceId: string
  spanId: string
  parentSpanId?: string
  name: string
  kind: number
  startTime: string
  durationMs: number
  status: {
    code: number
    message?: string
  }
  attributes: Attributes
  events: AgentTraceEvent[]
  resource: Attributes
  scope: {
    name: string
    version?: string
  }
}

function hrTimeToDate(value: HrTime): string {
  return new Date(value[0] * 1_000 + value[1] / 1_000_000).toISOString()
}

function hrTimeToMilliseconds(value: HrTime): number {
  return value[0] * 1_000 + value[1] / 1_000_000
}

function removeUrlQuery(value: string): string {
  try {
    const url = new URL(value)
    url.search = ""
    url.hash = ""
    return url.toString()
  } catch {
    return value.split("?", 1)[0] ?? value
  }
}

function sanitizeAttribute(key: string, value: AttributeValue): AttributeValue {
  if (sensitiveKey.test(key)) {
    return "[Redacted]"
  }
  if (urlKey.test(key) && typeof value === "string") {
    return removeUrlQuery(value)
  }
  return value
}

function sanitizeAttributes(attributes: Attributes = {}): Attributes {
  return Object.fromEntries(
    Object.entries(attributes).flatMap(([key, value]) =>
      value === undefined ? [] : [[key, sanitizeAttribute(key, value)]]
    )
  )
}

function selectResourceAttributes(attributes: Attributes): Attributes {
  const keys = ["service.name", "service.version", "deployment.environment.name"]
  return Object.fromEntries(
    keys.flatMap((key) => {
      const value = attributes[key]
      return value === undefined ? [] : [[key, value]]
    })
  )
}

function toAgentSpan(span: ReadableSpan): AgentSpanRecord {
  const context = span.spanContext()

  return {
    schemaVersion: 1,
    traceId: context.traceId,
    spanId: context.spanId,
    ...(span.parentSpanContext ? { parentSpanId: span.parentSpanContext.spanId } : {}),
    name: span.name,
    kind: span.kind,
    startTime: hrTimeToDate(span.startTime),
    durationMs: hrTimeToMilliseconds(span.duration),
    status: {
      code: span.status.code,
      ...(span.status.message ? { message: span.status.message } : {}),
    },
    attributes: sanitizeAttributes(span.attributes),
    events: span.events.map((event) => ({
      name: event.name,
      time: hrTimeToDate(event.time),
      ...(event.attributes ? { attributes: sanitizeAttributes(event.attributes) } : {}),
    })),
    resource: selectResourceAttributes(span.resource.attributes),
    scope: {
      name: span.instrumentationScope.name,
      ...(span.instrumentationScope.version ? { version: span.instrumentationScope.version } : {}),
    },
  }
}

export class AgentTraceFileExporter implements SpanExporter {
  readonly filePath: string
  private pendingWrite: Promise<void>

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath)
    this.pendingWrite = mkdir(path.dirname(this.filePath), { recursive: true }).then(
      () => undefined
    )
  }

  export(
    spans: ReadableSpan[],
    resultCallback: (result: { code: ExportResultCode; error?: Error }) => void
  ) {
    const content = `${spans.map((span) => JSON.stringify(toAgentSpan(span))).join("\n")}\n`
    this.pendingWrite = this.pendingWrite.then(() => appendFile(this.filePath, content, "utf8"))
    this.pendingWrite.then(
      () => resultCallback({ code: ExportResultCode.SUCCESS }),
      (error: unknown) =>
        resultCallback({
          code: ExportResultCode.FAILED,
          error: error instanceof Error ? error : new Error(String(error)),
        })
    )
  }

  forceFlush(): Promise<void> {
    return this.pendingWrite
  }

  shutdown(): Promise<void> {
    return this.pendingWrite
  }
}

function isAgentSpanRecord(value: unknown): value is AgentSpanRecord {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return (
    record.schemaVersion === 1 &&
    typeof record.traceId === "string" &&
    typeof record.spanId === "string" &&
    typeof record.name === "string"
  )
}

export async function readAgentTrace(
  filePath: string,
  traceId: string
): Promise<AgentSpanRecord[]> {
  if (!/^[0-9a-f]{32}$/i.test(traceId)) {
    throw new Error("traceId 必须是 32 位十六进制字符串")
  }

  const input = createReadStream(filePath, { encoding: "utf8" })
  const lines = createInterface({ input, crlfDelay: Number.POSITIVE_INFINITY })
  const spans: AgentSpanRecord[] = []

  for await (const line of lines) {
    if (!line.includes(traceId)) continue
    try {
      const record: unknown = JSON.parse(line)
      if (isAgentSpanRecord(record) && record.traceId === traceId) {
        spans.push(record)
      }
    } catch {}
  }

  return spans.sort((left, right) => left.startTime.localeCompare(right.startTime))
}
