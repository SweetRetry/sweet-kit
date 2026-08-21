import path from "node:path"
import { trace } from "@opentelemetry/api"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"

import { AgentTraceFileExporter } from "./agent-traces.js"

export interface StartObservabilityOptions {
  serviceName: string
  localTraceFile?: string
}

export interface Observability {
  localTraceFile?: string
  shutdown(): Promise<void>
}

export function getActiveTraceId(): string | undefined {
  const context = trace.getActiveSpan()?.spanContext()
  return context?.traceId
}

export function startObservability(options: StartObservabilityOptions): Observability {
  const localTraceFile = options.localTraceFile ? path.resolve(options.localTraceFile) : undefined
  const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME ?? options.serviceName,
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
