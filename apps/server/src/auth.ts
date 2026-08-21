import { mkdirSync } from "node:fs"
import path from "node:path"
import { createAuth } from "@workspace/auth/server"
import { createDatabase } from "@workspace/database/client"

import { env } from "./env.js"

mkdirSync(path.dirname(env.databasePath), { recursive: true })

export const db = createDatabase(env.databasePath)

export const auth = createAuth({
  baseURL: env.serverUrl,
  database: db,
  secret: env.authSecret,
  trustedOrigins: [env.webUrl],
  verificationUri: `${env.webUrl}/device`,
})
