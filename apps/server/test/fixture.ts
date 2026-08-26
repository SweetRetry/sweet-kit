import { randomUUID } from "node:crypto"
import { createAuth } from "@workspace/auth/server"
import { createTestDatabase } from "@workspace/database/testing"
import { createLogger } from "@workspace/logger"
import { makeWorkerUtils } from "graphile-worker"

import { createServerApp } from "../src/create-app.ts"

const serverUrl = "http://localhost:43111"
const webUrl = "http://localhost:43110"

interface SignUpResult {
  token: string | null
  user: {
    email: string
    id: string
    name: string
  }
}

export async function createServerFixture() {
  const testDatabase = await createTestDatabase()
  const workerUtils = await makeWorkerUtils({
    connectionString: testDatabase.databaseUrl,
  })
  await workerUtils.migrate()
  await workerUtils.release()
  const auth = createAuth({
    baseURL: serverUrl,
    database: testDatabase.database,
    secret: "sweet-kit-integration-test-secret-at-least-32-characters",
    trustedOrigins: [webUrl],
    verificationUri: `${webUrl}/device`,
  })
  const app = createServerApp({
    auth,
    logger: createLogger({
      environment: "test",
      level: "silent",
      pretty: false,
      service: "sweet-kit-server-test",
    }),
    webUrl,
  })
  app.get("/__test/error", () => {
    throw new Error("integration test failure")
  })

  return {
    app,
    auth,
    database: testDatabase.database,
    databaseUrl: testDatabase.databaseUrl,
    close: testDatabase.close,
    reset: testDatabase.reset,
    async signUp(input?: { email?: string; name?: string; password?: string }) {
      const response = await app.request("/api/auth/sign-up/email", {
        body: JSON.stringify({
          email: input?.email ?? `user-${randomUUID()}@example.com`,
          name: input?.name ?? "Test User",
          password: input?.password ?? "integration-test-password",
        }),
        headers: {
          "content-type": "application/json",
          origin: webUrl,
        },
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`测试用户创建失败：${response.status} ${await response.text()}`)
      }

      const result = (await response.json()) as SignUpResult
      if (!result.token) throw new Error("测试用户创建后未返回 Bearer token")
      return { ...result, token: result.token }
    },
  }
}

export type ServerFixture = Awaited<ReturnType<typeof createServerFixture>>
