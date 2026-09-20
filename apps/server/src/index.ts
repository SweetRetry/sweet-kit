import "dotenv/config"
import { serverEnv } from "./env.ts"
import { startObservability } from "./observability.ts"

/**
 * Server composition root：先起 telemetry（instrumentation 需要在被观测模块加载前就位），
 * 再装配 database、auth、logger 与 app，最后注册关停流程。
 * 装配归属见 [ADR 0007](../../../docs/adr/0007-runtime-assembly-and-app-ownership.md)。
 */
const observability = startObservability()

const [
  { serve },
  { createServerApp },
  { createLogger },
  { createAuth },
  { closeDatabase, createDatabase },
] = await Promise.all([
  import("@hono/node-server"),
  import("./create-app.ts"),
  import("@workspace/logger"),
  import("./auth.ts"),
  import("./database/client.ts"),
])

const logger = createLogger({ ...serverEnv.logger, service: "sweet-kit-server" })
const db = createDatabase(serverEnv.databaseUrl)
const auth = createAuth({
  baseURL: serverEnv.serverUrl,
  database: db,
  google: serverEnv.google,
  secret: serverEnv.authSecret,
  trustedOrigins: [serverEnv.webUrl],
})
const app = createServerApp({
  ai: serverEnv.ai,
  auth,
  logger,
  trustProxy: serverEnv.trustProxy,
  webUrl: serverEnv.webUrl,
})

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
