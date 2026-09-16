import { homedir } from "node:os"
import path from "node:path"
import { z } from "zod"

const values = z
  .object({
    INIT_CWD: z.string().min(1).optional(),
    SWEET_KIT_CONFIG_DIR: z.string().min(1).optional(),
    SWEET_KIT_SERVER_URL: z.url(),
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
  /**
   * 默认为 server 与 worker 各自写入的 trace 文件：两个进程默认不共享出口，
   * 一次查询同时读两份才能在同一个 span tree 里看到 HTTP request 与它触发的 job。
   */
  traceFiles: values.SWEET_KIT_TRACE_FILE
    ? [path.resolve(values.SWEET_KIT_TRACE_FILE)]
    : [
        path.join(initialCwd, "apps/server/data/traces.jsonl"),
        path.join(initialCwd, "apps/worker/data/traces.jsonl"),
      ],
}
