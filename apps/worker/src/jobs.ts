import { context, SpanStatusCode, trace } from "@opentelemetry/api"
import type { Logger } from "@workspace/logger"
import { extractTraceContext } from "@workspace/tracing"
import type { TaskList } from "graphile-worker"
import { z } from "zod"

/**
 * Worker 消费的 task 定义。
 *
 * 生产侧（enqueue）不属于本 app：需要与业务状态同事务提交的 enqueue 由写出该状态的
 * app 负责，见 docs/adr/0003 与 docs/adr/0007。
 */
const SYSTEM_PING_TASK = "system.ping"
const EMAIL_WELCOME_TASK = "email.welcome"

const systemPingPayloadSchema = z.object({
  message: z.string().min(1).max(200),
})

const emailWelcomePayloadSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(100),
  userId: z.string().min(1),
})

const systemPingJobSchema = z.object({
  payload: systemPingPayloadSchema,
  traceContext: z.record(z.string(), z.string()),
})

const emailWelcomeJobSchema = z.object({
  payload: emailWelcomePayloadSchema,
  traceContext: z.record(z.string(), z.string()),
})

const tracer = trace.getTracer("sweet-kit-worker")

export function createTaskList(options: { logger: Logger }): TaskList {
  return {
    [SYSTEM_PING_TASK]: async (rawPayload, helpers) => {
      const job = systemPingJobSchema.parse(rawPayload)
      const parentContext = extractTraceContext(job.traceContext)

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
      const parentContext = extractTraceContext(job.traceContext)

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
