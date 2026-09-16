import { getConnInfo } from "@hono/node-server/conninfo"
import { httpInstrumentationMiddleware } from "@hono/otel"
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { Scalar } from "@scalar/hono-api-reference"
import type { Logger } from "@workspace/logger"
import {
  createProblemDetails,
  ErrorCode,
  getErrorStatus,
  PROBLEM_MEDIA_TYPE,
} from "@workspace/request/contract"
import {
  getActiveSpanContext,
  TRACE_ID_PATTERN,
  TRACE_PARENT_HEADER,
  traceResponseHeaders,
} from "@workspace/tracing"
import type { Context } from "hono"
import { cors } from "hono/cors"
import { requestId } from "hono/request-id"
import { type Env as HonoPinoEnv, pinoLogger } from "hono-pino"
import { rateLimiter } from "hono-rate-limiter"

import { type AiProviderOptions, createAiModel, generateAssistantReply } from "./ai.ts"
import type { Auth } from "./auth.ts"

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 100

const HealthSchema = z
  .object({
    status: z.literal("ok"),
    service: z.literal("sweet-kit-server"),
  })
  .openapi("Health")

const UserSchema = z
  .object({
    id: z.string(),
    email: z.email(),
    name: z.string(),
  })
  .openapi("User")

const AssistantRequestSchema = z
  .object({
    prompt: z.string().min(1).max(2_000),
  })
  .openapi("AssistantRequest")

const AssistantReplySchema = z
  .object({
    text: z.string(),
  })
  .openapi("AssistantReply")

const ProblemDetailsSchema = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    detail: z.string(),
    code: z.enum(ErrorCode),
    traceId: z.string().regex(new RegExp(TRACE_ID_PATTERN)).optional(),
  })
  .openapi("ProblemDetails")

const problemContent = { [PROBLEM_MEDIA_TYPE]: { schema: ProblemDetailsSchema } }

const validationErrorResponse = {
  content: problemContent,
  description: "Request validation failed",
}

const unauthorizedResponse = {
  content: problemContent,
  description: "Authentication required",
}

const tooManyRequestsResponse = {
  content: problemContent,
  description: "Rate limit exceeded, see Retry-After",
}

const serviceUnavailableResponse = {
  content: problemContent,
  description: "Feature is not configured in this deployment",
}

const internalErrorResponse = {
  content: problemContent,
  description: "Internal server error with trace correlation",
}

function problemResponse<C extends ErrorCode>(c: Context, code: C, detail: string) {
  const status = getErrorStatus(code)
  const body = createProblemDetails(code, detail, { traceId: getActiveSpanContext()?.traceId })

  return c.json(body, status, { "Content-Type": PROBLEM_MEDIA_TYPE })
}

/**
 * 校验失败的统一出口。
 *
 * `@hono/zod-openapi` 在未提供 hook 时会把 ZodError 整体序列化进响应体，
 * 这里改成 problem details：detail 只带出错位置与原因，不带内部结构。
 */
function describeValidationFailure(result: { error: z.ZodError; target: string }): string {
  const [issue] = result.error.issues

  if (!issue) {
    return `${result.target} 未通过校验`
  }

  const location = issue.path.length > 0 ? `${issue.path.join(".")} ` : ""

  return `${result.target} 校验失败：${location}${issue.message}`
}

/**
 * 限流使用的客户端标识。
 *
 * `x-forwarded-for` 可被客户端伪造，因此只有部署在可信代理之后（`TRUST_PROXY=true`）
 * 才读取它，且取最右侧一项——它由可信代理追加，客户端伪造的前缀覆盖不到。
 */
function clientAddress(c: Context, trustProxy: boolean): string {
  if (trustProxy) {
    const forwarded = c.req
      .header("x-forwarded-for")
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .at(-1)

    if (forwarded) {
      return forwarded
    }
  }

  try {
    return getConnInfo(c).remote.address ?? "unknown"
  } catch {
    return "unknown"
  }
}

const healthRoute = createRoute({
  method: "get",
  path: "/api/health",
  tags: ["System"],
  summary: "Server health",
  responses: {
    200: {
      content: { "application/json": { schema: HealthSchema } },
      description: "Server health",
    },
    429: tooManyRequestsResponse,
    500: internalErrorResponse,
  },
})

const meRoute = createRoute({
  method: "get",
  path: "/api/me",
  tags: ["Account"],
  summary: "Current authenticated user",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: UserSchema } },
      description: "Current authenticated user",
    },
    401: unauthorizedResponse,
    429: tooManyRequestsResponse,
    500: internalErrorResponse,
  },
})

const assistantRoute = createRoute({
  method: "post",
  path: "/api/assistant/reply",
  tags: ["Assistant"],
  summary: "Generate a reply through the configured AI provider",
  description:
    "需要登录；上游凭据由部署环境提供（OPENAI_API_KEY）。未配置时返回 503，provider 调用会参与 trace 关联。",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: AssistantRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: AssistantReplySchema } },
      description: "Generated reply",
    },
    400: validationErrorResponse,
    401: unauthorizedResponse,
    429: tooManyRequestsResponse,
    500: internalErrorResponse,
    503: serviceUnavailableResponse,
  },
})

interface CreateServerAppOptions {
  ai?: AiProviderOptions
  auth: Auth
  logger: Logger
  trustProxy: boolean
  webUrl: string
}

export function createServerApp(options: CreateServerAppOptions) {
  const app = new OpenAPIHono<HonoPinoEnv>({
    defaultHook: (result, c) => {
      if (result.success) return

      return problemResponse(
        c,
        ErrorCode.VALIDATION_ERROR,
        describeValidationFailure({ error: result.error, target: result.target })
      )
    },
  })

  const aiModel = options.ai ? createAiModel(options.ai) : undefined

  app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
  })

  app.use(
    "*",
    httpInstrumentationMiddleware({
      serviceName: "sweet-kit-server",
      serviceVersion: "0.0.1",
    })
  )
  app.use("*", requestId())
  app.use(
    "*",
    pinoLogger({
      pino: options.logger,
      http: {
        onResBindings: (c) => ({
          res: {
            status: c.res.status,
          },
          ...(c.error ? { err: c.error } : {}),
        }),
        onResLevel: (c) => {
          if (c.res.status >= 500) return "error"
          if (c.res.status >= 400) return "warn"
          return "info"
        },
      },
    })
  )
  app.use("*", async (c, next) => {
    await next()
    for (const [name, value] of Object.entries(traceResponseHeaders())) c.header(name, value)
  })

  app.use(
    "/api/*",
    cors({
      origin: options.webUrl,
      credentials: true,
      exposeHeaders: ["x-request-id", TRACE_PARENT_HEADER],
    })
  )

  app.use(
    "/api/*",
    /**
     * 默认 store 是进程内 MemoryStore：多实例部署时限流按实例计算，
     * 需要跨实例一致时换成共享 store（如 Redis）。
     */
    rateLimiter({
      windowMs: RATE_LIMIT_WINDOW_MS,
      limit: RATE_LIMIT_MAX,
      keyGenerator: (c) => clientAddress(c, options.trustProxy),
      handler: (c) => {
        c.header("Retry-After", String(RATE_LIMIT_WINDOW_MS / 1_000))

        return problemResponse(c, ErrorCode.TOO_MANY_REQUESTS, "请求过于频繁，请稍后重试")
      },
    })
  )

  app.all("/api/auth/*", (c) => options.auth.handler(c.req.raw))

  app.openapi(healthRoute, (c) => c.json({ status: "ok", service: "sweet-kit-server" }, 200))

  app.openapi(meRoute, async (c) => {
    const session = await options.auth.api.getSession({ headers: c.req.raw.headers })

    if (!session) {
      return problemResponse(c, ErrorCode.UNAUTHORIZED, "Authentication required")
    }

    return c.json(
      {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      200
    )
  })

  app.openapi(assistantRoute, async (c) => {
    const session = await options.auth.api.getSession({ headers: c.req.raw.headers })

    if (!session) {
      return problemResponse(c, ErrorCode.UNAUTHORIZED, "Authentication required")
    }

    if (!aiModel) {
      return problemResponse(
        c,
        ErrorCode.SERVICE_UNAVAILABLE,
        "此部署未配置 AI provider：需要 OPENAI_API_KEY"
      )
    }

    const { prompt } = c.req.valid("json")
    const text = await generateAssistantReply(aiModel, prompt)

    return c.json({ text }, 200)
  })

  app.doc31("/openapi.json", {
    openapi: "3.1.0",
    info: {
      title: "Sweet Kit API",
      version: "0.1.0",
    },
  })

  app.get(
    "/docs",
    Scalar({
      pageTitle: "Sweet Kit API",
      url: "/openapi.json",
    })
  )

  app.notFound((c) =>
    problemResponse(c, ErrorCode.NOT_FOUND, `未找到 ${c.req.method} ${c.req.path}`)
  )

  app.onError((error, c) => {
    c.get("logger").error({ err: error }, "request.failed")
    return problemResponse(c, ErrorCode.INTERNAL_SERVER_ERROR, "Internal Server Error")
  })

  return app
}
