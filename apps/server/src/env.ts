import path from "node:path"

const developmentSecret = "sweet-kit-development-secret-change-me"

export const env = {
  agentTraceFile:
    process.env.SWEET_KIT_TRACE_FILE ??
    (process.env.NODE_ENV !== "production" && process.env.OTEL_TRACES_EXPORTER === undefined
      ? path.resolve("data/traces.jsonl")
      : undefined),
  authSecret: process.env.BETTER_AUTH_SECRET ?? developmentSecret,
  databasePath: path.resolve(process.env.DATABASE_PATH ?? "data/auth.sqlite"),
  port: Number(process.env.PORT ?? 3001),
  serverUrl: process.env.SERVER_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  webUrl: process.env.WEB_URL ?? "http://localhost:3000",
}

if (process.env.NODE_ENV === "production" && env.authSecret === developmentSecret) {
  throw new Error("BETTER_AUTH_SECRET is required in production")
}
