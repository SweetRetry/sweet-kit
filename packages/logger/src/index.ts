import { isSpanContextValid, trace } from "@opentelemetry/api"
import { loggerEnv } from "@workspace/env/logger"
import pino, { type Logger, type LoggerOptions } from "pino"

const redactedPaths = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "body.password",
  "body.token",
  "body.accessToken",
  "body.refreshToken",
  "headers.authorization",
  "headers.cookie",
  "req.headers.authorization",
  "req.headers.cookie",
  "request.headers.authorization",
  "request.headers.cookie",
]

export interface CreateLoggerOptions {
  service: string
  level?: string
  pretty?: boolean
}

export function createLogger(options: CreateLoggerOptions): Logger {
  const pretty = options.pretty ?? loggerEnv.pretty
  const loggerOptions: LoggerOptions = {
    base: null,
    level: options.level ?? loggerEnv.level,
    mixin: () => {
      const spanContext = trace.getActiveSpan()?.spanContext()
      return {
        environment: loggerEnv.environment,
        service: options.service,
        ...(spanContext && isSpanContextValid(spanContext)
          ? {
              traceId: spanContext.traceId,
              spanId: spanContext.spanId,
              traceFlags: spanContext.traceFlags.toString(16).padStart(2, "0"),
            }
          : {}),
      }
    },
    redact: {
      paths: redactedPaths,
      censor: "[Redacted]",
    },
    serializers: {
      err: pino.stdSerializers.err,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }

  if (!pretty) {
    return pino(loggerOptions)
  }

  return pino({
    ...loggerOptions,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        singleLine: true,
        translateTime: "SYS:standard",
      },
    },
  })
}

export type { Logger }
