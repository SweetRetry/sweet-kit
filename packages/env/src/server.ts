import path from "node:path"
import { z } from "zod"

import { databaseEnv } from "./database.ts"

const values = z
  .object({
    BETTER_AUTH_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    OTEL_TRACES_EXPORTER: z.string().optional(),
    PORT: z.coerce.number().int().min(1).max(65_535),
    SERVER_URL: z.url(),
    SWEET_KIT_TRACE_FILE: z.string().min(1).optional(),
    WEB_URL: z.url(),
  })
  .parse(process.env)

export const serverEnv = {
  agentTraceFile:
    values.SWEET_KIT_TRACE_FILE ??
    (values.NODE_ENV !== "production" && values.OTEL_TRACES_EXPORTER === undefined
      ? path.resolve("data/traces.jsonl")
      : undefined),
  authSecret: values.BETTER_AUTH_SECRET,
  databaseUrl: databaseEnv.databaseUrl,
  google:
    values.GOOGLE_CLIENT_ID && values.GOOGLE_CLIENT_SECRET
      ? { clientId: values.GOOGLE_CLIENT_ID, clientSecret: values.GOOGLE_CLIENT_SECRET }
      : undefined,
  port: values.PORT,
  serverUrl: values.SERVER_URL,
  webUrl: values.WEB_URL,
}
