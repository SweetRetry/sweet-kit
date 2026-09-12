import ky, { isHTTPError, type KyInstance } from "ky"
import { type ErrorCode, isProblemDetails, isTraceId } from "./contract.ts"

export {
  type ApiErrorStatus,
  ErrorCode,
  type ErrorCode as ErrorCodeValue,
  type ProblemDetails,
} from "./contract.ts"

export type AccessTokenProvider = () => Promise<string | null> | string | null

export interface RequestClientOptions {
  baseUrl: string
  getAccessToken?: AccessTokenProvider
}

export class RequestError extends Error {
  readonly status: number | undefined
  readonly code: ErrorCode | undefined
  readonly traceId: string | undefined
  readonly details: unknown

  constructor(
    message: string,
    options?: {
      status?: number
      code?: ErrorCode
      traceId?: string
      details?: unknown
      cause?: unknown
    }
  ) {
    super(message, { cause: options?.cause })
    this.name = "RequestError"
    this.status = options?.status
    this.code = options?.code
    this.traceId = options?.traceId
    this.details = options?.details
  }
}

function toRequestError(error: Error): Error {
  if (!isHTTPError(error)) {
    return new RequestError(error.message, { cause: error })
  }

  const body: unknown = error.data

  const parsedProblem = isProblemDetails(body) ? body : undefined
  const problem =
    parsedProblem && parsedProblem.status === error.response.status ? parsedProblem : undefined
  const responseTraceId = error.response.headers.get("x-trace-id")
  const traceId = problem?.traceId ?? (isTraceId(responseTraceId) ? responseTraceId : undefined)

  return new RequestError(
    problem?.detail ?? `Request failed with status ${error.response.status}`,
    {
      status: error.response.status,
      code: problem?.code,
      traceId,
      details: body,
      cause: error,
    }
  )
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
