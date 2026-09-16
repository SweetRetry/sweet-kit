import { Writable } from "node:stream"
import { describe, expect, it } from "vitest"

import { createLogger } from "../src/index.ts"

function createCapturedLogger() {
  const lines: string[] = []
  const destination = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      lines.push(chunk.toString())
      callback()
    },
  })

  const logger = createLogger({
    destination,
    environment: "test",
    level: "info",
    pretty: false,
    service: "probe",
  })

  const entries = () => lines.map((line) => JSON.parse(line) as Record<string, unknown>)

  return { entries, logger }
}

describe("日志脱敏", () => {
  it("顶层与嵌套的凭据字段一律替换", () => {
    const { entries, logger } = createCapturedLogger()

    logger.info(
      {
        apiKey: "top-level",
        body: { password: "body-secret" },
        headers: { authorization: "Bearer header-secret", "x-api-key": "nested-key" },
        job: { credential: "nested-credential" },
        payload: { accessToken: "nested-token" },
      },
      "probe"
    )

    expect(entries()[0]).toMatchObject({
      apiKey: "[Redacted]",
      body: { password: "[Redacted]" },
      headers: { authorization: "[Redacted]" },
      payload: { accessToken: "[Redacted]" },
    })
  })

  it("不误伤包含 token 字样的计数指标", () => {
    const { entries, logger } = createCapturedLogger()

    logger.info(
      {
        "gen_ai.usage.input_tokens": 1234,
        "llm.token_count.total": 1801,
        "tokenizer.model": "o200k_base",
      },
      "probe"
    )

    expect(entries()[0]).toMatchObject({
      "gen_ai.usage.input_tokens": 1234,
      "llm.token_count.total": 1801,
      "tokenizer.model": "o200k_base",
    })
  })

  it("每条日志都带上 service 与 environment 关联字段", () => {
    const { entries, logger } = createCapturedLogger()

    logger.info("probe")

    expect(entries()[0]).toMatchObject({ environment: "test", service: "probe" })
  })
})
