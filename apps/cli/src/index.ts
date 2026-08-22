#!/usr/bin/env node

import { CLI_CLIENT_ID } from "@workspace/auth/constants"
import { cliEnv } from "@workspace/env/cli"
import { createRequestClient } from "@workspace/request/http"
import { createAuthClient } from "better-auth/client"
import { deviceAuthorizationClient } from "better-auth/client/plugins"
import { Command } from "commander"
import open from "open"

import { clearAccessToken, readAccessToken, writeAccessToken } from "./credentials.ts"
import { showTrace, type TraceCommandOptions } from "./trace.ts"

const serverUrl = cliEnv.serverUrl
const deviceGrant = "urn:ietf:params:oauth:grant-type:device_code" as const

const authClient = createAuthClient({
  baseURL: serverUrl,
  plugins: [deviceAuthorizationClient()],
})

const api = createRequestClient({
  baseUrl: `${serverUrl}/`,
  getAccessToken: readAccessToken,
})

async function login() {
  const response = await authClient.device.code({
    client_id: CLI_CLIENT_ID,
    scope: "openid profile email",
  })

  if (response.error || !response.data) {
    throw new Error(response.error?.error_description ?? "无法启动 device authorization")
  }

  const device = response.data
  console.log(`授权码：${device.user_code}`)
  console.log(`打开：${device.verification_uri}`)

  await open(device.verification_uri_complete ?? device.verification_uri)

  let intervalSeconds = device.interval
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000))

    const token = await authClient.device.token({
      client_id: CLI_CLIENT_ID,
      device_code: device.device_code,
      grant_type: deviceGrant,
    })

    if (token.data?.access_token) {
      await writeAccessToken(token.data.access_token)
      console.log("CLI 登录成功")
      return
    }

    const code = token.error?.error
    if (code === "authorization_pending") {
      continue
    }
    if (code === "slow_down") {
      intervalSeconds += 5
      continue
    }
    if (code === "access_denied") {
      throw new Error("授权请求被拒绝")
    }
    if (code === "expired_token") {
      throw new Error("授权码已过期，请重新登录")
    }

    throw new Error(token.error?.error_description ?? "CLI 登录失败")
  }
}

async function whoami() {
  if (!(await readAccessToken())) {
    throw new Error("尚未登录，请先运行 sweet login")
  }

  const user = await api.get("api/me").json<{ id: string; email: string; name: string }>()
  console.log(`${user.name} <${user.email}>`)
}

async function logout() {
  await clearAccessToken()
  console.log("本地凭据已清除")
}

async function main() {
  const program = new Command().name("sweet").description("Sweet Kit CLI").showHelpAfterError()

  program.command("login").description("通过 device authorization 登录").action(login)
  program.command("whoami").description("调用 Hono server 查询当前用户").action(whoami)
  program.command("logout").description("清除本地凭据").action(logout)
  program
    .command("trace")
    .description("按 traceId 读取本地 span tree")
    .argument("<trace-id>", "HTTP 响应或日志中的 traceId")
    .option("-f, --file <path>", "Agent trace JSONL 文件")
    .option("--json", "输出完整结构化 span 数据")
    .action((traceId: string, options: TraceCommandOptions) => showTrace(traceId, options))

  if (process.argv.length === 2) {
    program.help()
  }

  await program.parseAsync()
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
