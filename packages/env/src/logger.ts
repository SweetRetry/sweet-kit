import { z } from "zod"

const values = z
  .object({
    LOG_LEVEL: z.string().min(1),
    LOG_PRETTY: z.enum(["true", "false"]),
    NODE_ENV: z.enum(["development", "test", "production"]),
  })
  .parse(process.env)

export const loggerEnv = {
  environment: values.NODE_ENV,
  level: values.LOG_LEVEL,
  pretty: values.LOG_PRETTY === "true",
}
