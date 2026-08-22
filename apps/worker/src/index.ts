import "dotenv/config"
import { workerEnv } from "@workspace/env/worker"
import { startObservability } from "@workspace/observability"

const observability = startObservability({
  serviceName: "sweet-kit-worker",
  ...(workerEnv.agentTraceFile ? { localTraceFile: workerEnv.agentTraceFile } : {}),
})

const [{ createTaskList }, { createLogger }, { run }] = await Promise.all([
  import("@workspace/jobs"),
  import("@workspace/logger"),
  import("graphile-worker"),
])

const logger = createLogger({ service: "sweet-kit-worker" })
const runner = await run({
  concurrency: workerEnv.concurrency,
  connectionString: workerEnv.databaseUrl,
  noHandleSignals: true,
  taskList: createTaskList({ logger }),
})

logger.info({ concurrency: workerEnv.concurrency }, "worker.started")

let shuttingDown = false

async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, "worker.stopping")
  await runner.stop()
  await observability.shutdown()
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    shutdown(signal).catch((error: unknown) => {
      logger.error({ err: error }, "worker.shutdown.failed")
      process.exitCode = 1
    })
  })
}
