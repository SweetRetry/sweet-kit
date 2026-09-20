/**
 * API 错误契约：RFC 9457 Problem Details。
 *
 * 标准成员 `type` / `title` / `status` / `detail` 按 RFC 9457 语义使用；
 * `code` 与 `traceId` 是扩展成员（RFC 9457 §3.2 允许扩展）。
 * `code` 是客户端唯一判据，且与 `type` 的最后一段一一对应；
 * `traceId` 的取值与形状由 W3C Trace Context 决定，校验见 `@workspace/tracing`。
 */
import { isTraceId } from "@workspace/tracing"

/** RFC 9457 §3 的媒体类型 */
export const PROBLEM_MEDIA_TYPE = "application/problem+json"

/** `type` 是 problem 的主标识符，必须稳定、绝对；一旦发布不可更改 */
export const PROBLEM_TYPE_PREFIX = "https://sweet-kit.dev/problems/"

export const ErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

/** 本 API 会返回的 HTTP 状态码 */
export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 429 | 500 | 503

const errorStatusByCode = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
} as const satisfies Record<ErrorCode, ApiErrorStatus>

/** RFC 9457 §3.1.3：同类问题稳定，不随 occurrence 变化 */
const problemTitleByCode = {
  [ErrorCode.VALIDATION_ERROR]: "Validation Error",
  [ErrorCode.UNAUTHORIZED]: "Unauthorized",
  [ErrorCode.FORBIDDEN]: "Forbidden",
  [ErrorCode.NOT_FOUND]: "Not Found",
  [ErrorCode.CONFLICT]: "Conflict",
  [ErrorCode.TOO_MANY_REQUESTS]: "Too Many Requests",
  [ErrorCode.SERVICE_UNAVAILABLE]: "Service Unavailable",
  [ErrorCode.INTERNAL_SERVER_ERROR]: "Internal Server Error",
} as const satisfies Record<ErrorCode, string>

/** `type` 的最后一段，与 `code` 一一对应 */
const problemSlugByCode = {
  [ErrorCode.VALIDATION_ERROR]: "validation-error",
  [ErrorCode.UNAUTHORIZED]: "unauthorized",
  [ErrorCode.FORBIDDEN]: "forbidden",
  [ErrorCode.NOT_FOUND]: "not-found",
  [ErrorCode.CONFLICT]: "conflict",
  [ErrorCode.TOO_MANY_REQUESTS]: "too-many-requests",
  [ErrorCode.SERVICE_UNAVAILABLE]: "service-unavailable",
  [ErrorCode.INTERNAL_SERVER_ERROR]: "internal-server-error",
} as const satisfies Record<ErrorCode, string>

const errorCodes = new Set<string>(Object.values(ErrorCode))
const errorCodeBySlug = new Map<string, ErrorCode>(
  Object.entries(problemSlugByCode).map(([code, slug]) => [slug, code as ErrorCode])
)

export interface ProblemDetails<C extends ErrorCode = ErrorCode> {
  type: string
  title: string
  status: ApiErrorStatus
  detail: string
  /** 扩展成员：客户端稳定判据 */
  code: C
  /** 扩展成员：仅 INTERNAL_SERVER_ERROR 出现 */
  traceId?: string
}

export function getErrorStatus<C extends ErrorCode>(code: C): (typeof errorStatusByCode)[C] {
  return errorStatusByCode[code]
}

export function getProblemTitle<C extends ErrorCode>(code: C): (typeof problemTitleByCode)[C] {
  return problemTitleByCode[code]
}

export function getProblemType<C extends ErrorCode>(code: C): string {
  return `${PROBLEM_TYPE_PREFIX}${problemSlugByCode[code]}`
}

export function getErrorCodeFromProblemType(type: unknown): ErrorCode | undefined {
  if (typeof type !== "string" || !type.startsWith(PROBLEM_TYPE_PREFIX)) return undefined
  return errorCodeBySlug.get(type.slice(PROBLEM_TYPE_PREFIX.length))
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && errorCodes.has(value)
}

/** 由 `code` 唯一决定标准成员，调用方只提供 detail 与 traceId */
export function createProblemDetails<C extends ErrorCode>(
  code: C,
  detail: string,
  options?: { traceId?: string }
): ProblemDetails<C> {
  const traceId = code === ErrorCode.INTERNAL_SERVER_ERROR ? options?.traceId : undefined

  return {
    type: getProblemType(code),
    title: getProblemTitle(code),
    status: getErrorStatus(code),
    detail,
    code,
    ...(traceId ? { traceId } : {}),
  }
}

/** 判定一个响应体是否严格符合本项目的 problem contract */
export function isProblemDetails(value: unknown): value is ProblemDetails {
  if (typeof value !== "object" || value === null) return false

  const body = value as Record<string, unknown>

  if (!isErrorCode(body.code)) return false
  if (body.status !== getErrorStatus(body.code)) return false
  if (getErrorCodeFromProblemType(body.type) !== body.code) return false
  if (typeof body.title !== "string" || body.title.length === 0) return false
  if (typeof body.detail !== "string") return false

  return body.traceId === undefined || isTraceId(body.traceId)
}
