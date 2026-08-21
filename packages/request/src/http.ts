import ky, { isHTTPError, type KyInstance } from "ky"

export type AccessTokenProvider = () => Promise<string | null> | string | null

export interface RequestClientOptions {
  baseUrl: string
  getAccessToken?: AccessTokenProvider
}

export class RequestError extends Error {
  readonly status: number | undefined
  readonly details: unknown

  constructor(message: string, options?: { status?: number; details?: unknown; cause?: unknown }) {
    super(message, { cause: options?.cause })
    this.name = "RequestError"
    this.status = options?.status
    this.details = options?.details
  }
}

async function toRequestError(error: Error): Promise<Error> {
  if (!isHTTPError(error)) {
    return new RequestError(error.message, { cause: error })
  }

  const details = await error.response
    .clone()
    .json()
    .catch(() => undefined)

  return new RequestError(`Request failed with status ${error.response.status}`, {
    status: error.response.status,
    details,
    cause: error,
  })
}

export function createRequestClient(options: RequestClientOptions): KyInstance {
  return ky.create({
    baseUrl: options.baseUrl,
    credentials: "include",
    retry: {
      limit: 2,
      methods: ["get", "head", "options"],
    },
    hooks: {
      beforeRequest: [
        async ({ request }) => {
          const accessToken = await options.getAccessToken?.()
          if (accessToken) {
            request.headers.set("authorization", `Bearer ${accessToken}`)
          }
        },
      ],
      beforeError: [({ error }) => toRequestError(error)],
    },
  })
}
