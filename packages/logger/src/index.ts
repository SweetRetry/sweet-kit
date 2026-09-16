import { traceLogFields } from "@workspace/tracing"
import pino, { type DestinationStream, type Logger, type LoggerOptions } from "pino"

/**
 * 凭据类字段名。`*` 只匹配一级，因此逐层展开：
 * 只写顶层路径会漏掉 `payload.accessToken`、`job.credential` 这类嵌套形状。
 */
const sensitiveKeys = [
  "accessToken",
  "apiKey",
  "authorization",
  "cookie",
  "credential",
  "idToken",
  "password",
  "privateKey",
  "refreshToken",
  "secret",
  "token",
]

const redactedPaths = [
  ...sensitiveKeys,
  ...sensitiveKeys.map((key) => `*.${key}`),
  ...sensitiveKeys.map((key) => `*.*.${key}`),
]

export interface CreateLoggerOptions {
  /** 注入日志出口（测试与宿主集成都用得到）；`pretty` 为 true 时忽略 */
  destination?: DestinationStream
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
    return options.destination ? pino(loggerOptions, options.destination) : pino(loggerOptions)
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
