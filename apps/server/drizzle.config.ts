import { defineConfig } from "drizzle-kit"
import { z } from "zod"

const databaseUrl = z.url().parse(process.env.DATABASE_URL)

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
})
