import { z } from "zod"

const values = z
  .object({
    DATABASE_URL: z.url(),
  })
  .parse(process.env)

export const databaseEnv = {
  databaseUrl: values.DATABASE_URL,
}
