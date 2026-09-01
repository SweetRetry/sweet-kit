import { queryOptions } from "@tanstack/react-query"
import { createRequestClient } from "@workspace/request/http"

import { webEnv } from "./env"

const api = createRequestClient({ baseUrl: `${webEnv.serverUrl}/` })

interface Health {
  status: "ok"
  service: "sweet-kit-server"
}

export const healthQueryOptions = queryOptions({
  queryKey: ["server", "health"],
  queryFn: () => api.get("api/health").json<Health>(),
})
