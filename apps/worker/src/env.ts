import path from "node:path"
import { z } from "zod"

const values = z
  .object({
    DATABASE_URL: z.url(),
    JOB_CONCURRENCY: z.coerce.number().int().positive(),
    LOG_LEVEL: z.string().min(1),
    LOG_PRETTY: z.enum(["true", "false"]),
    NODE_ENV: z.enum(["development", "test", "production"]),
    OTEL_TRACES_EXPORTER: z.string().optional(),
    SWEET_KIT_WORKER_TRACE_FILE: z.string().min(1).optional(),
  })
  .parse(process.env)

export const workerEnv = {
  agentTraceFile:
    values.SWEET_KIT_WORKER_TRACE_FILE ??
    (values.NODE_ENV !== "production" && values.OTEL_TRACES_EXPORTER === undefined
      ? path.resolve("data/traces.jsonl")
      : undefined),
  concurrency: values.JOB_CONCURRENCY,
  databaseUrl: values.DATABASE_URL,
  logger: {
    environment: values.NODE_ENV,
    level: values.LOG_LEVEL,
    pretty: values.LOG_PRETTY === "true",
  },
}
