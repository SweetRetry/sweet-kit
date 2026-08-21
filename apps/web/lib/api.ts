import { webEnv } from "@workspace/env/web"
import { createRequestClient } from "@workspace/request/http"
import { queryOptions } from "@workspace/request/react"

const api = createRequestClient({ baseUrl: `${webEnv.serverUrl}/` })

interface Health {
  status: "ok"
  service: "sweet-kit-server"
}

export const healthQueryOptions = queryOptions({
  queryKey: ["server", "health"],
  queryFn: () => api.get("api/health").json<Health>(),
})
