import { config } from "dotenv"
import { defineProject } from "vitest/config"

config({ path: new URL(".env", import.meta.url).pathname })

export default defineProject({
  test: {
    environment: "node",
    hookTimeout: 60_000,
    include: ["test/**/*.test.ts"],
    name: "server",
  },
})
