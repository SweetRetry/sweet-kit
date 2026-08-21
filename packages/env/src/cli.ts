import "dotenv/config"
import { homedir } from "node:os"
import path from "node:path"
import { z } from "zod"

const values = z
  .object({
    INIT_CWD: z.string().min(1).optional(),
    SWEET_KIT_CONFIG_DIR: z.string().min(1).optional(),
    SWEET_KIT_SERVER_URL: z.string().url().default("http://localhost:3001"),
    SWEET_KIT_TRACE_FILE: z.string().min(1).optional(),
    XDG_CONFIG_HOME: z.string().min(1).optional(),
  })
  .parse(process.env)

const initialCwd = values.INIT_CWD ?? process.cwd()

export const cliEnv = {
  configDir:
    values.SWEET_KIT_CONFIG_DIR ??
    path.join(values.XDG_CONFIG_HOME ?? path.join(homedir(), ".config"), "sweet-kit"),
  serverUrl: values.SWEET_KIT_SERVER_URL,
  traceFile: path.resolve(
    values.SWEET_KIT_TRACE_FILE ?? path.join(initialCwd, "apps/server/data/traces.jsonl")
  ),
}
