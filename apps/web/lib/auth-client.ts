import { webEnv } from "@workspace/env/web"
import { deviceAuthorizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: webEnv.serverUrl,
  plugins: [deviceAuthorizationClient()],
})
