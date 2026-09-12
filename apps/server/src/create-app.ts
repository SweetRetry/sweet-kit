import { httpInstrumentationMiddleware } from "@hono/otel"
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { Scalar } from "@scalar/hono-api-reference"
import type { Logger } from "@workspace/logger"
import { getActiveTraceId } from "@workspace/observability"
import {
  createProblemDetails,
  ErrorCode,
  getErrorStatus,
  PROBLEM_MEDIA_TYPE,
} from "@workspace/request/contract"
import type { Context } from "hono"
import { cors } from "hono/cors"
import { requestId } from "hono/request-id"
import { type Env as HonoPinoEnv, pinoLogger } from "hono-pino"
import { rateLimiter } from "hono-rate-limiter"

import type { Auth } from "./auth.ts"

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

const ProblemDetailsSchema = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    detail: z.string(),
    code: z.enum(ErrorCode),
    traceId: z.string().length(32).optional(),
  })
  .openapi("ProblemDetails")

const problemContent = { [PROBLEM_MEDIA_TYPE]: { schema: ProblemDetailsSchema } }

function problemResponse<C extends ErrorCode>(c: Context, code: C, detail: string) {
  const status = getErrorStatus(code)
  const body = createProblemDetails(code, detail, { traceId: getActiveTraceId() })

  return c.json(body, status, { "Content-Type": PROBLEM_MEDIA_TYPE })
}

const internalErrorResponse = {
  content: problemContent,
  description: "Internal server error with trace correlation",
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
    401: {
      content: problemContent,
      description: "Authentication required",
    },
    500: internalErrorResponse,
  },
})

interface CreateServerAppOptions {
  auth: Auth
  logger: Logger
  webUrl: string
}

export function createServerApp(options: CreateServerAppOptions) {
  const app = new OpenAPIHono<HonoPinoEnv>()

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
    const traceId = getActiveTraceId()
    if (traceId) c.header("x-trace-id", traceId)
  })

  app.use(
    "/api/*",
    cors({
      origin: options.webUrl,
      credentials: true,
      exposeHeaders: ["x-request-id", "x-trace-id"],
    })
  )

  app.use(
    "/api/*",
    rateLimiter({
      windowMs: 60_000,
      limit: 100,
      keyGenerator: (c) =>
        c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "anonymous",
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

  app.onError((error, c) => {
    c.get("logger").error({ err: error }, "request.failed")
    return problemResponse(c, ErrorCode.INTERNAL_SERVER_ERROR, "Internal Server Error")
  })

  return app
}
