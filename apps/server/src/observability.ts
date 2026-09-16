import path from "node:path"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { AgentTraceFileExporter } from "@workspace/observability/agent-traces"
import { createTracePropagator } from "@workspace/tracing"

import { serverEnv } from "./env.ts"

export interface Observability {
  localTraceFile?: string
  shutdown(): Promise<void>
}

/**
 * Server 进程的 telemetry 装配（composition root）。
 * 本地开发把 span 投影到 JSONL 供 `pnpm cli trace` 查询，生产由 OTel 环境变量选择 OTLP；
 * 这里只固定 service name 与项目采用的 W3C propagator。
 */
export function startObservability(): Observability {
  const localTraceFile = serverEnv.agentTraceFile
    ? path.resolve(serverEnv.agentTraceFile)
    : undefined

  const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "sweet-kit-server",
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
