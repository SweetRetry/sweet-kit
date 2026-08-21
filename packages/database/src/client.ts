import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema.js"

export function createDatabase(connectionString: string) {
  const pool = new Pool({ connectionString })
  return drizzle(pool, { schema })
}

export type Database = ReturnType<typeof createDatabase>

export async function closeDatabase(database: Database): Promise<void> {
  await database.$client.end()
}
