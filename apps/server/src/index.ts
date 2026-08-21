import { startObservability } from "@workspace/observability"

import { env } from "./env.js"

const observability = startObservability({
  serviceName: "sweet-kit-server",
  ...(env.agentTraceFile ? { localTraceFile: env.agentTraceFile } : {}),
})

const [{ serve }, { app, logger }] = await Promise.all([
  import("@hono/node-server"),
  import("./app.js"),
])

const server = serve({
  fetch: app.fetch,
  port: env.port,
})

logger.info(
  {
    port: env.port,
    url: env.serverUrl,
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
