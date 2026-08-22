import { serverEnv } from "@workspace/env/server"
import { createLogger } from "@workspace/logger"

import { auth } from "./auth.ts"
import { createServerApp } from "./create-app.ts"

const logger = createLogger({ service: "sweet-kit-server" })
const app = createServerApp({
  auth,
  logger,
  webUrl: serverEnv.webUrl,
})

export { app, logger }
