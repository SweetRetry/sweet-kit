import { createAuth } from "./auth.ts"
import { createDatabase } from "./database/client.ts"
import { serverEnv } from "./env.ts"

export const db = createDatabase(serverEnv.databaseUrl)

export const auth = createAuth({
  baseURL: serverEnv.serverUrl,
  database: db,
  google: serverEnv.google,
  secret: serverEnv.authSecret,
  trustedOrigins: [serverEnv.webUrl],
  verificationUri: `${serverEnv.webUrl}/device`,
})
