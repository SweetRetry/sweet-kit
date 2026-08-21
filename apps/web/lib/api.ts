import { createRequestClient } from "@workspace/request/http"
import { queryOptions } from "@workspace/request/react"

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3001"

const api = createRequestClient({ baseUrl: `${serverUrl}/` })

interface Health {
  status: "ok"
  service: "sweet-kit-server"
}

export const healthQueryOptions = queryOptions({
  queryKey: ["server", "health"],
  queryFn: () => api.get("api/health").json<Health>(),
})
