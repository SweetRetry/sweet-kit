import "dotenv/config"
import { z } from "zod"

const values = z
  .object({
    DATABASE_URL: z.string().url().default("postgresql://sweet:sweet@localhost:5432/sweet_kit"),
  })
  .parse(process.env)

export const databaseEnv = {
  databaseUrl: values.DATABASE_URL,
}
