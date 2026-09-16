import { traceLogFields } from "@workspace/tracing"
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
  environment: string
  level: string
  pretty: boolean
  service: string
}

export function createLogger(options: CreateLoggerOptions): Logger {
  const loggerOptions: LoggerOptions = {
    base: null,
    level: options.level,
    mixin: () => ({
      environment: options.environment,
      service: options.service,
      ...traceLogFields(),
    }),
    redact: {
      paths: redactedPaths,
      censor: "[Redacted]",
    },
    serializers: {
      err: pino.stdSerializers.err,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }

  if (!options.pretty) {
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
