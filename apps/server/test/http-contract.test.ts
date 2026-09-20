import { randomUUID } from "node:crypto"
import { Writable } from "node:stream"
import { createLogger } from "@workspace/logger"
import { PROBLEM_MEDIA_TYPE } from "@workspace/request/contract"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { type Auth, createAuth } from "../src/auth.ts"
import { createServerApp } from "../src/create-app.ts"
import { closeDatabase, createDatabase, type Database } from "../src/database/client.ts"

/**
 * 应用响应测试：验证路由与中间件的错误出口符合 `rules/api-contract.md`。
 *
 * 需要 PostgreSQL（`DATABASE_URL`）与已执行的 migration；未提供时跳过，
 * 由 CI 的 integration environment 提供，不在测试内启动 container runtime。
 */
const databaseUrl = process.env.DATABASE_URL
const baseUrl = "http://localhost:43111"
const webUrl = "http://localhost:43110"

let db: Database
let auth: Auth
let app: ReturnType<typeof createServerApp>

function createApp(database: Database, options?: { ai?: boolean }) {
  return createServerApp({
    ai: options?.ai ? { apiKey: "test-key", modelId: "gpt-4o" } : undefined,
    auth: createAuth({
      baseURL: baseUrl,
      database,
      secret: "integration-test-secret-at-least-32-characters",
      trustedOrigins: [webUrl],
    }),
    logger: createLogger({
      destination: new Writable({ write: (_chunk, _encoding, callback) => callback() }),
      environment: "test",
      level: "info",
      pretty: false,
      service: "sweet-kit-server-test",
    }),
    trustProxy: false,
    webUrl,
  })
}

async function problem(response: Response) {
  // Hono 默认追加 charset；problem 响应显式声明媒体类型，因此只断言前缀
  expect(response.headers.get("content-type")).toContain(PROBLEM_MEDIA_TYPE)

  return (await response.json()) as { code: string; detail: string; status: number; type: string }
}

describe.skipIf(!databaseUrl)("HTTP 错误出口", () => {
  beforeAll(() => {
    db = createDatabase(databaseUrl ?? "")
    auth = createAuth({
      baseURL: baseUrl,
      database: db,
      secret: "integration-test-secret-at-least-32-characters",
      trustedOrigins: [webUrl],
    })
    app = createApp(db)
  })

  afterAll(async () => {
    await closeDatabase(db)
  })

  it("未匹配路由返回 404 problem details", async () => {
    const response = await app.request(`${baseUrl}/api/does-not-exist`)
    const body = await problem(response)

    expect(response.status).toBe(404)
    expect(body).toMatchObject({ code: "NOT_FOUND", status: 404 })
    expect(body.type.endsWith("/not-found")).toBe(true)
    expect(body.detail).toContain("/api/does-not-exist")
  })

  it("请求体校验失败返回 400 problem details，不带 Zod 内部结构", async () => {
    const response = await app.request(`${baseUrl}/api/assistant/reply`, {
      body: JSON.stringify({ prompt: "" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const body = await problem(response)

    expect(response.status).toBe(400)
    expect(body).toMatchObject({ code: "VALIDATION_ERROR", status: 400 })
    expect(body.detail).toContain("prompt")
    expect(body).not.toHaveProperty("error")
  })

  it("缺少凭据返回 401，不泄漏部署配置", async () => {
    const response = await problem(await app.request(`${baseUrl}/api/me`))

    expect(response).toMatchObject({ code: "UNAUTHORIZED", status: 401 })
  })

  it("未配置 AI provider 时登录用户得到 503", async () => {
    const cookie = await signUp()

    const anonymous = await app.request(`${baseUrl}/api/assistant/reply`, {
      body: JSON.stringify({ prompt: "hello" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    expect(anonymous.status).toBe(401)

    const response = await app.request(`${baseUrl}/api/assistant/reply`, {
      body: JSON.stringify({ prompt: "hello" }),
      headers: { "content-type": "application/json", cookie },
      method: "POST",
    })
    const body = await problem(response)

    expect(response.status).toBe(503)
    expect(body).toMatchObject({ code: "SERVICE_UNAVAILABLE", status: 503 })
  })

  it("已认证时 /api/me 返回当前用户", async () => {
    const email = `contract-${randomUUID()}@example.com`
    const cookie = await signUp(email)
    const response = await app.request(`${baseUrl}/api/me`, { headers: { cookie } })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ email })
  })

  it("超过窗口阈值返回 429 problem details，并带 Retry-After", async () => {
    const localDb = createDatabase(databaseUrl ?? "")
    const localApp = createApp(localDb)

    try {
      for (let index = 0; index < 100; index += 1) {
        const response = await localApp.request(`${baseUrl}/api/health`)
        expect(response.status).toBe(200)
      }

      const limited = await localApp.request(`${baseUrl}/api/health`)
      const body = await problem(limited)

      expect(limited.status).toBe(429)
      expect(body).toMatchObject({ code: "TOO_MANY_REQUESTS", status: 429 })
      expect(limited.headers.get("retry-after")).toBe("60")
    } finally {
      await closeDatabase(localDb)
    }
  })

  it("OpenAPI 为每个错误状态声明 problem 媒体类型", async () => {
    const document = (await (await app.request(`${baseUrl}/openapi.json`)).json()) as {
      paths: Record<string, Record<string, { responses: Record<string, unknown> }>>
    }

    for (const [path, operations] of Object.entries(document.paths)) {
      for (const [method, operation] of Object.entries(operations)) {
        for (const [status, response] of Object.entries(operation.responses)) {
          if (Number(status) < 400) continue

          const content = (response as { content?: Record<string, unknown> }).content ?? {}

          expect(Object.keys(content), `${method.toUpperCase()} ${path} ${status}`).toContain(
            PROBLEM_MEDIA_TYPE
          )
        }
      }
    }
  })
})

async function signUp(email = `contract-${randomUUID()}@example.com`): Promise<string> {
  const result = await auth.api.signUpEmail({
    body: { email, name: "Contract", password: "contract-password" },
    returnHeaders: true,
  })
  const cookie = result.headers.get("set-cookie")

  if (!cookie) {
    throw new Error("sign-up 未返回 session cookie")
  }

  return cookie
}
