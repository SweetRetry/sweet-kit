import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { CLI_CLIENT_ID } from "@workspace/auth/constants"
import { deviceCode } from "@workspace/database/schema"
import { createTaskList, enqueueSystemPing } from "@workspace/jobs"
import { createLogger } from "@workspace/logger"
import { type Observability, startObservability } from "@workspace/observability"
import { ErrorCode } from "@workspace/request/contract"
import { sql } from "drizzle-orm"
import { runOnce } from "graphile-worker"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { createServerFixture, type ServerFixture } from "./fixture.js"

const webUrl = "http://localhost:3000"
const healthTraceId = "11111111111111111111111111111111"
const errorTraceId = "33333333333333333333333333333333"

let fixture: ServerFixture
let observability: Observability
let traceDirectory: string

beforeAll(async () => {
  traceDirectory = mkdtempSync(path.join(tmpdir(), "sweet-kit-traces-"))
  observability = startObservability({
    localTraceFile: path.join(traceDirectory, "traces.jsonl"),
    serviceName: "sweet-kit-server-test",
  })
  fixture = await createServerFixture()
})

afterEach(async () => {
  await fixture.reset()
})

afterAll(async () => {
  if (fixture) await fixture.close()
  await observability.shutdown()
  rmSync(traceDirectory, { force: true, recursive: true })
})

describe("Hono server", () => {
  it("返回 health、request ID 和可关联的 trace ID", async () => {
    const response = await fixture.app.request("/api/health", {
      headers: {
        traceparent: `00-${healthTraceId}-2222222222222222-01`,
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      service: "sweet-kit-server",
      status: "ok",
    })
    expect(response.headers.get("x-request-id")).toBeTruthy()
    expect(response.headers.get("x-trace-id")).toBe(healthTraceId)
  })

  it("在未处理异常的 header 和 body 返回 traceId", async () => {
    const response = await fixture.app.request("/__test/error", {
      headers: {
        traceparent: `00-${errorTraceId}-4444444444444444-01`,
      },
    })

    expect(response.status).toBe(500)
    expect(response.headers.get("x-trace-id")).toBe(errorTraceId)
    await expect(response.json()).resolves.toEqual({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Internal Server Error",
      traceId: errorTraceId,
    })
  })

  it("发布包含 Bearer auth 的 OpenAPI 3.1 文档", async () => {
    const response = await fixture.app.request("/openapi.json")
    const document = (await response.json()) as {
      components?: {
        schemas?: {
          Error?: { properties?: { code?: { enum?: string[] } } }
        }
        securitySchemes?: Record<string, unknown>
      }
      openapi: string
      paths: Record<string, unknown>
    }

    expect(response.status).toBe(200)
    expect(document.openapi).toBe("3.1.0")
    expect(document.paths).toHaveProperty("/api/health")
    expect(document.paths).toHaveProperty("/api/me")
    expect(document.components?.securitySchemes).toHaveProperty("bearerAuth")
    expect(document.components?.schemas?.Error?.properties?.code?.enum).toEqual(
      Object.values(ErrorCode)
    )
  })

  it("拒绝未认证的当前用户请求", async () => {
    const response = await fixture.app.request("/api/me")

    expect(response.status).toBe(401)
    expect(response.headers.get("x-trace-id")).toMatch(/^[0-9a-f]{32}$/)
    await expect(response.json()).resolves.toEqual({
      code: ErrorCode.UNAUTHORIZED,
      message: "Authentication required",
    })
  })

  it("使用 Better Auth Bearer token 读取当前用户", async () => {
    const account = await fixture.signUp({
      email: "bearer@example.com",
      name: "Bearer User",
    })

    const response = await fixture.app.request("/api/me", {
      headers: { authorization: `Bearer ${account.token}` },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      email: account.user.email,
      id: account.user.id,
      name: account.user.name,
    })
  })

  it("通过 device authorization 创建 CLI 登录请求", async () => {
    const response = await fixture.app.request("/api/auth/device/code", {
      body: JSON.stringify({
        client_id: CLI_CLIENT_ID,
        scope: "openid profile email",
      }),
      headers: {
        "content-type": "application/json",
        origin: webUrl,
      },
      method: "POST",
    })
    const result = (await response.json()) as {
      device_code: string
      user_code: string
      verification_uri: string
    }

    expect(response.status).toBe(200)
    expect(result.device_code).toBeTruthy()
    expect(result.user_code).toBeTruthy()
    expect(result.verification_uri).toBe(`${webUrl}/device`)

    const rows = await fixture.database.select().from(deviceCode)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.clientId).toBe(CLI_CLIENT_ID)
  })

  it("在 PostgreSQL 中入队并执行 Graphile Worker task", async () => {
    await fixture.database.execute(enqueueSystemPing({ message: "integration test" }))
    const before = await fixture.database.execute<{ count: number }>(
      sql`select count(*)::integer as count from graphile_worker.jobs`
    )

    expect(before.rows[0]?.count).toBe(1)

    await runOnce(
      { connectionString: fixture.databaseUrl },
      createTaskList({
        logger: createLogger({ level: "silent", service: "sweet-kit-worker-test" }),
      })
    )

    const after = await fixture.database.execute<{ count: number }>(
      sql`select count(*)::integer as count from graphile_worker.jobs`
    )
    expect(after.rows[0]?.count).toBe(0)
  })
})
