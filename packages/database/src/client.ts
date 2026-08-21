import BetterSqlite3 from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import * as schema from "./schema.js"

export function createDatabase(filename: string) {
  const sqlite = new BetterSqlite3(filename)
  sqlite.pragma("journal_mode = WAL")

  return drizzle(sqlite, { schema })
}

export type Database = ReturnType<typeof createDatabase>
