import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"
import { z } from "zod"

// drizzle-kit 默认只加载 `.env`，而本仓库的本地配置在 `.env.local`（与 server / worker 运行期一致）。
// dotenv 不覆盖已存在的变量，因此 CI 或显式传入的 DATABASE_URL 仍然生效。
config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local", quiet: true })

const databaseUrl = z.url().parse(process.env.DATABASE_URL)

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
})
