export const CLI_CLIENT_ID = "sweet-kit-cli"

export const ErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 500

const errorStatusByCode = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
} as const satisfies Record<ErrorCode, ApiErrorStatus>

const errorCodes = new Set<string>(Object.values(ErrorCode))
const traceIdPattern = /^[0-9a-f]{32}$/i

export interface ApiErrorBody<C extends ErrorCode = ErrorCode> {
  code: C
  message: string
  traceId?: string
}

export function getErrorStatus<C extends ErrorCode>(code: C): (typeof errorStatusByCode)[C] {
  return errorStatusByCode[code]
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && errorCodes.has(value)
}

export function isTraceId(value: unknown): value is string {
  return typeof value === "string" && traceIdPattern.test(value)
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null) return false

  const body = value as Record<string, unknown>
  return (
    isErrorCode(body.code) &&
    typeof body.message === "string" &&
    (body.traceId === undefined || isTraceId(body.traceId))
  )
}
