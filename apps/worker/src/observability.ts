import path from "node:path"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
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
          spanProcessors: [new BatchSpanProcessor(new AgentTraceFileExporter(localTraceFile))],
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
