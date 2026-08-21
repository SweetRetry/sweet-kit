import { defineProject } from "vitest/config"

export default defineProject({
  test: {
    environment: "node",
    hookTimeout: 60_000,
    include: ["test/**/*.test.ts"],
    name: "server",
  },
})
