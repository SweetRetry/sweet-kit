import { createAuth } from "./auth.ts"
import { createDatabase } from "./database/client.ts"
import { serverEnv } from "./env.ts"

/**
 * Better Auth CLI 的配置入口（`pnpm --filter server auth:generate --config src/auth-config.ts`），
 * 只为 schema 生成而存在，进程运行时由 `src/index.ts` 装配。
 */
export const db = createDatabase(serverEnv.databaseUrl)

export const auth = createAuth({
  baseURL: serverEnv.serverUrl,
  database: db,
  google: serverEnv.google,
  secret: serverEnv.authSecret,
  trustedOrigins: [serverEnv.webUrl],
  verificationUri: `${serverEnv.webUrl}/device`,
})
