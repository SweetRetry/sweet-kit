import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { ExportResultCode } from "@opentelemetry/core"
import type { ReadableSpan } from "@opentelemetry/sdk-trace-base"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { type AgentSpanRecord, AgentTraceFileExporter } from "../src/agent-traces.ts"

const traceId = "4bf92f3577b34da6a3ce929d0e0e4736"
const spanId = "00f067aa0ba902b7"

let workDir: string

function fakeSpan(attributes: Record<string, unknown>): ReadableSpan {
  return {
    attributes,
    duration: [0, 1_000_000],
    endTime: [1, 0],
    events: [
      {
        attributes: { "exception.message": "boom", "auth.token": "leaked" },
        name: "exception",
        time: [1, 0],
      },
    ],
    instrumentationScope: { name: "probe" },
    kind: 1,
    name: "probe",
    parentSpanContext: undefined,
    resource: { attributes: { "service.name": "sweet-kit-server" } },
    spanContext: () => ({ spanId, traceFlags: 1, traceId }),
    startTime: [1, 0],
    status: { code: 1 },
  } as unknown as ReadableSpan
}

async function exportSpans(spans: ReadableSpan[]): Promise<string> {
  const filePath = path.join(workDir, "traces.jsonl")
  const exporter = new AgentTraceFileExporter(filePath)

  await new Promise<void>((resolve, reject) => {
    exporter.export(spans, (result) => {
      if (result.code === ExportResultCode.SUCCESS) {
        resolve()
        return
      }
      reject(result.error ?? new Error("export failed"))
    })
  })

  return filePath
}

/** exporter 是纯写入方，落盘格式即 JSONL 一行一个 span；测试直接按行解析断言语义 */
async function readSpans(filePath: string): Promise<AgentSpanRecord[]> {
  const raw = await readFile(filePath, "utf8")
  return raw
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as AgentSpanRecord)
}

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), "sweet-kit-observability-"))
})

afterAll(async () => {
  await rm(workDir, { force: true, recursive: true })
})

describe("agent span 投影的脱敏", () => {
  it("凭据类 key 一律替换，计数类 token 指标保持原值", async () => {
    const filePath = await exportSpans([
      fakeSpan({
        "db.password": "hunter2",
        "gen_ai.request.model": "gpt-4o",
        "gen_ai.usage.input_tokens": 1234,
        "gen_ai.usage.output_tokens": 567,
        "http.request.header.authorization": "Bearer secret",
        "llm.token_count.total": 1801,
        "session.token": "session-secret",
        "tokenizer.model": "o200k_base",
        total_tokens: 1801,
        "user.api_key": "sk-live",
      }),
    ])

    const [span] = await readSpans(filePath)

    expect(span?.attributes).toMatchObject({
      "db.password": "[Redacted]",
      "gen_ai.request.model": "gpt-4o",
      "gen_ai.usage.input_tokens": 1234,
      "gen_ai.usage.output_tokens": 567,
      "http.request.header.authorization": "[Redacted]",
      "llm.token_count.total": 1801,
      "session.token": "[Redacted]",
      "tokenizer.model": "o200k_base",
      total_tokens: 1801,
      "user.api_key": "[Redacted]",
    })
  })

  it("剔除 URL query，url.query 整值脱敏，event 属性同样处理", async () => {
    const filePath = await exportSpans([
      fakeSpan({
        "http.url": "https://api.example.com/v1/chat?api_key=leak#frag",
        "url.query": "api_key=leak",
      }),
    ])

    const [span] = await readSpans(filePath)

    expect(span?.attributes["http.url"]).toBe("https://api.example.com/v1/chat")
    expect(span?.attributes["url.query"]).toBe("[Redacted]")
    expect(span?.events[0]?.attributes).toMatchObject({
      "auth.token": "[Redacted]",
      "exception.message": "boom",
    })
  })

  it("只投影 resource 的 service 归属字段", async () => {
    const filePath = await exportSpans([fakeSpan({})])

    const [span] = await readSpans(filePath)

    expect(span?.resource).toEqual({ "service.name": "sweet-kit-server" })
  })
})

describe("agent span 落盘", () => {
  it("每个 span 一行，保留各自的名字与时间", async () => {
    const filePath = await exportSpans([
      { ...fakeSpan({}), name: "second", startTime: [2, 0] } as unknown as ReadableSpan,
      { ...fakeSpan({}), name: "first", startTime: [1, 0] } as unknown as ReadableSpan,
    ])
    const spans = await readSpans(filePath)

    expect(spans.map((span) => span.name)).toEqual(["second", "first"])
    expect(spans.map((span) => span.traceId)).toEqual([traceId, traceId])
  })
})
