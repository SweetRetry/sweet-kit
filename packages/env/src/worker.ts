import "dotenv/config"
import path from "node:path"
import { z } from "zod"

import { databaseEnv } from "./database.js"

const values = z
  .object({
    JOB_CONCURRENCY: z.coerce.number().int().positive().default(5),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
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
  databaseUrl: databaseEnv.databaseUrl,
}
