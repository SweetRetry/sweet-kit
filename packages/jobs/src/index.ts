import { context, propagation, SpanStatusCode, type TextMapSetter, trace } from "@opentelemetry/api"
import type { Logger } from "@workspace/logger"
import { type SQL, sql } from "drizzle-orm"
import type { TaskList } from "graphile-worker"
import { z } from "zod"

export const SYSTEM_PING_TASK = "system.ping"
export const EMAIL_WELCOME_TASK = "email.welcome"

export const systemPingPayloadSchema = z.object({
  message: z.string().min(1).max(200),
})

export const emailWelcomePayloadSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  userId: z.string().min(1),
})

export type SystemPingPayload = z.infer<typeof systemPingPayloadSchema>
export type EmailWelcomePayload = z.infer<typeof emailWelcomePayloadSchema>

const systemPingJobSchema = z.object({
  payload: systemPingPayloadSchema,
  traceContext: z.record(z.string(), z.string()),
})

const emailWelcomeJobSchema = z.object({
  payload: emailWelcomePayloadSchema,
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

    [EMAIL_WELCOME_TASK]: async (rawPayload, helpers) => {
      const job = emailWelcomeJobSchema.parse(rawPayload)
      const parentContext = propagation.extract(context.active(), job.traceContext)

      return context.with(parentContext, () =>
        tracer.startActiveSpan(`job ${EMAIL_WELCOME_TASK}`, async (span) => {
          span.setAttributes({
            "job.id": String(helpers.job.id),
            "job.system": "graphile_worker",
            "job.task": EMAIL_WELCOME_TASK,
            "user.id": job.payload.userId,
          })

          try {
            // TODO: 接入实际邮件服务（如 Resend）后替换此处
            options.logger.info(
              {
                job: {
                  id: helpers.job.id,
                  task: EMAIL_WELCOME_TASK,
                },
                recipient: job.payload.email,
                userId: job.payload.userId,
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

export function enqueueEmailWelcome(payload: EmailWelcomePayload): SQL {
  const input = emailWelcomePayloadSchema.parse(payload)
  const traceContext: Record<string, string> = {}
  propagation.inject(context.active(), traceContext, traceContextSetter)

  return sql`select graphile_worker.add_job(
    ${EMAIL_WELCOME_TASK},
    ${JSON.stringify({ payload: input, traceContext })}::json,
    job_key := ${`welcome:${input.userId}`}
  )`
}
