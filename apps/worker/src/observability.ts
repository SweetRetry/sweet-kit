import path from "node:path"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { AgentTraceFileExporter } from "@workspace/observability/agent-traces"
import { createTracePropagator } from "@workspace/tracing"

import { workerEnv } from "./env.ts"

export interface Observability {
  localTraceFile?: string
  shutdown(): Promise<void>
}

/**
 * Worker 进程的 telemetry 装配（composition root）。
 * 与 server 各自独立启停 SDK，避免两个 process 的全局初始化互相影响。
 *
 * 本地用 SimpleSpanProcessor 而非默认的 BatchSpanProcessor：批处理是为了摊薄 OTLP 的网络开销，
 * 对本地文件追加只剩延迟（默认 5s），会让刚跑完的 job 查不到自己的 trace。
 */
export function startObservability(): Observability {
  const localTraceFile = workerEnv.agentTraceFile
    ? path.resolve(workerEnv.agentTraceFile)
    : undefined

  const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "sweet-kit-worker",
    textMapPropagator: createTracePropagator(),
    ...(localTraceFile
      ? {
          spanProcessors: [new SimpleSpanProcessor(new AgentTraceFileExporter(localTraceFile))],
          metricReaders: [],
          logRecordProcessors: [],
        }
      : {}),
  })

  sdk.start()

  return {
    ...(localTraceFile ? { localTraceFile } : {}),
    shutdown: () => sdk.shutdown(),
  }
}
