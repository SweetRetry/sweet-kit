import { createLogger } from "@workspace/logger"

import { auth } from "./auth.ts"
import { createServerApp } from "./create-app.ts"
import { serverEnv } from "./env.ts"

const logger = createLogger({ ...serverEnv.logger, service: "sweet-kit-server" })
const app = createServerApp({
  auth,
  logger,
  webUrl: serverEnv.webUrl,
})

export { app, logger }
