import { createAuth } from "@workspace/auth/server"
import { createDatabase } from "@workspace/database/client"
import { serverEnv } from "@workspace/env/server"

export const db = createDatabase(serverEnv.databaseUrl)

export const auth = createAuth({
  baseURL: serverEnv.serverUrl,
  database: db,
  google: serverEnv.google,
  secret: serverEnv.authSecret,
  trustedOrigins: [serverEnv.webUrl],
  verificationUri: `${serverEnv.webUrl}/device`,
})
