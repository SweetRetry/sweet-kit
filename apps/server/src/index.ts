import "dotenv/config"
import { startObservability } from "@workspace/observability"

import { serverEnv } from "./env.ts"

const observability = startObservability({
  serviceName: "sweet-kit-server",
  ...(serverEnv.agentTraceFile ? { localTraceFile: serverEnv.agentTraceFile } : {}),
})

const [{ serve }, { app, logger }, { db }, { closeDatabase }] = await Promise.all([
  import("@hono/node-server"),
  import("./app.js"),
  import("./auth-config.js"),
  import("./database/client.js"),
])

const server = serve({
  fetch: app.fetch,
  port: serverEnv.port,
})

logger.info(
  {
    port: serverEnv.port,
    url: serverEnv.serverUrl,
    ...(observability.localTraceFile ? { agentTraceFile: observability.localTraceFile } : {}),
  },
  "server.started"
)

let shuttingDown = false

async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, "server.stopping")

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
  await closeDatabase(db)
  await observability.shutdown()
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    shutdown(signal).catch((error: unknown) => {
      logger.error({ err: error }, "server.shutdown.failed")
      process.exitCode = 1
    })
  })
}
