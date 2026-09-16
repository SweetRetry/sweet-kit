import "dotenv/config"
import { workerEnv } from "./env.ts"
import { startObservability } from "./observability.ts"

const observability = startObservability()

const [{ createTaskList }, { createLogger }, { run }] = await Promise.all([
  import("./jobs.ts"),
  import("@workspace/logger"),
  import("graphile-worker"),
])

const logger = createLogger({ ...workerEnv.logger, service: "sweet-kit-worker" })
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
