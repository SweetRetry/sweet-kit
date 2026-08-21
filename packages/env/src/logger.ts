import "dotenv/config"
import { z } from "zod"

const values = z
  .object({
    LOG_LEVEL: z.string().min(1).default("info"),
    LOG_PRETTY: z.enum(["true", "false"]).default("false"),
    NODE_ENV: z.string().min(1).default("development"),
  })
  .parse(process.env)

export const loggerEnv = {
  environment: values.NODE_ENV,
  level: values.LOG_LEVEL,
  pretty: values.LOG_PRETTY === "true",
}
