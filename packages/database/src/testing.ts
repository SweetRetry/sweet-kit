import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { PostgreSqlContainer } from "@testcontainers/postgresql"
import { sql } from "drizzle-orm"
import { migrate } from "drizzle-orm/node-postgres/migrator"

import { closeDatabase, createDatabase } from "./client.js"

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url))

function useActiveDockerContext() {
  if (!process.env.DOCKER_HOST) {
    try {
      process.env.DOCKER_HOST = execFileSync(
        "docker",
        ["context", "inspect", "--format", "{{.Endpoints.docker.Host}}"],
        { encoding: "utf8" }
      ).trim()
    } catch {}
  }

  if (
    process.env.DOCKER_HOST?.startsWith("unix://") &&
    !process.env.TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE
  ) {
    process.env.TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = "/var/run/docker.sock"
  }
}

export async function createTestDatabase() {
  useActiveDockerContext()
  const container = await new PostgreSqlContainer("postgres:17-alpine").start()
  const databaseUrl = container.getConnectionUri()
  const database = createDatabase(databaseUrl)

  try {
    await migrate(database, { migrationsFolder })
  } catch (error) {
    await closeDatabase(database)
    await container.stop()
    throw error
  }

  return {
    database,
    databaseUrl,
    async reset() {
      await database.execute(
        sql`truncate table "account", "device_code", "session", "user", "verification" cascade`
      )
    },
    async close() {
      await closeDatabase(database)
      await container.stop()
    },
  }
}

export type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>
