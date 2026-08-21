import "dotenv/config"
import path from "node:path"
import { z } from "zod"

import { databaseEnv } from "./database.js"

const developmentSecret = "sweet-kit-development-secret-change-me"
const values = z
  .object({
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    BETTER_AUTH_URL: z.string().url().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    OTEL_TRACES_EXPORTER: z.string().optional(),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
    SERVER_URL: z.string().url().optional(),
    SWEET_KIT_TRACE_FILE: z.string().min(1).optional(),
    WEB_URL: z.string().url().default("http://localhost:3000"),
  })
  .parse(process.env)

if (values.NODE_ENV === "production" && !values.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is required in production")
}

export const serverEnv = {
  agentTraceFile:
    values.SWEET_KIT_TRACE_FILE ??
    (values.NODE_ENV !== "production" && values.OTEL_TRACES_EXPORTER === undefined
      ? path.resolve("data/traces.jsonl")
      : undefined),
  authSecret: values.BETTER_AUTH_SECRET ?? developmentSecret,
  databaseUrl: databaseEnv.databaseUrl,
  port: values.PORT,
  serverUrl: values.SERVER_URL ?? values.BETTER_AUTH_URL ?? "http://localhost:3001",
  webUrl: values.WEB_URL,
}
