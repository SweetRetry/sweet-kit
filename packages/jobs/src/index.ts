import { context, propagation, SpanStatusCode, type TextMapSetter, trace } from "@opentelemetry/api"
import type { Logger } from "@workspace/logger"
import { type SQL, sql } from "drizzle-orm"
import type { TaskList } from "graphile-worker"
import { z } from "zod"

export const SYSTEM_PING_TASK = "system.ping"

export const systemPingPayloadSchema = z.object({
  message: z.string().min(1).max(200),
})

export type SystemPingPayload = z.infer<typeof systemPingPayloadSchema>

const systemPingJobSchema = z.object({
  payload: systemPingPayloadSchema,
  traceContext: z.record(z.string(), z.string()),
})

const tracer = trace.getTracer("@workspace/jobs")
const traceContextSetter: TextMapSetter<Record<string, string>> = {
  set(carrier, key, value) {
    carrier[key] = value
  },
}

export function createTaskList(options: { logger: Logger }): TaskList {
  return {
    [SYSTEM_PING_TASK]: async (rawPayload, helpers) => {
      const job = systemPingJobSchema.parse(rawPayload)
      const parentContext = propagation.extract(context.active(), job.traceContext)

      return context.with(parentContext, () =>
        tracer.startActiveSpan(`job ${SYSTEM_PING_TASK}`, async (span) => {
          span.setAttributes({
            "job.id": String(helpers.job.id),
            "job.system": "graphile_worker",
            "job.task": SYSTEM_PING_TASK,
          })

          try {
            options.logger.info(
              {
                job: {
                  id: helpers.job.id,
                  task: SYSTEM_PING_TASK,
                },
                message: job.payload.message,
              },
              "job.completed"
            )
            span.setStatus({ code: SpanStatusCode.OK })
          } catch (error) {
            span.recordException(error instanceof Error ? error : String(error))
            span.setStatus({ code: SpanStatusCode.ERROR })
            throw error
          } finally {
            span.end()
          }
        })
      )
    },
  }
}

export function enqueueSystemPing(payload: SystemPingPayload): SQL {
  const input = systemPingPayloadSchema.parse(payload)
  const traceContext: Record<string, string> = {}
  propagation.inject(context.active(), traceContext, traceContextSetter)

  return sql`select graphile_worker.add_job(
    ${SYSTEM_PING_TASK},
    ${JSON.stringify({ payload: input, traceContext })}::json
  )`
}
