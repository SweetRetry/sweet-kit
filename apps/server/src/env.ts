import path from "node:path"
import { z } from "zod"

/** AI provider 未显式指定模型时的默认值；取值由 `OPENAI_MODEL` 覆盖 */
const DEFAULT_AI_MODEL_ID = "gpt-4o"

const values = z
  .object({
    BETTER_AUTH_SECRET: z.string().min(32),
    DATABASE_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    LOG_LEVEL: z.string().min(1),
    LOG_PRETTY: z.enum(["true", "false"]),
    NODE_ENV: z.enum(["development", "test", "production"]),
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENAI_MODEL: z.string().min(1).optional(),
    OTEL_TRACES_EXPORTER: z.string().optional(),
    PORT: z.coerce.number().int().min(1).max(65_535),
    SERVER_URL: z.url(),
    SWEET_KIT_TRACE_FILE: z.string().min(1).optional(),
    TRUST_PROXY: z.enum(["true", "false"]).default("false"),
    WEB_URL: z.url(),
  })
  .parse(process.env)

export const serverEnv = {
  agentTraceFile:
    values.SWEET_KIT_TRACE_FILE ??
    (values.NODE_ENV !== "production" && values.OTEL_TRACES_EXPORTER === undefined
      ? path.resolve("data/traces.jsonl")
      : undefined),
  ai: values.OPENAI_API_KEY
    ? {
        apiKey: values.OPENAI_API_KEY,
        modelId: values.OPENAI_MODEL ?? DEFAULT_AI_MODEL_ID,
      }
    : undefined,
  authSecret: values.BETTER_AUTH_SECRET,
  databaseUrl: values.DATABASE_URL,
  google:
    values.GOOGLE_CLIENT_ID && values.GOOGLE_CLIENT_SECRET
      ? { clientId: values.GOOGLE_CLIENT_ID, clientSecret: values.GOOGLE_CLIENT_SECRET }
      : undefined,
  logger: {
    environment: values.NODE_ENV,
    level: values.LOG_LEVEL,
    pretty: values.LOG_PRETTY === "true",
  },
  port: values.PORT,
  serverUrl: values.SERVER_URL,
  /**
   * 是否信任 `x-forwarded-for`。默认关闭：只在确实部署在可信代理之后时启用，
   * 否则客户端可自行伪造该 header 绕过基于 IP 的限流。
   */
  trustProxy: values.TRUST_PROXY === "true",
  webUrl: values.WEB_URL,
}
