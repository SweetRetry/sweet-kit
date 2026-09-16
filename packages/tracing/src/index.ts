/**
 * Trace 关联契约：trace 长什么样、叫什么名字、从哪个出口出去。
 *
 * 校验与序列化委托给 OpenTelemetry（W3C Trace Context 的参考实现），
 * 本包只固定项目自己的暴露出口与关联字段命名，因此可以同时供浏览器侧的
 * `@workspace/request` 与 server / worker / jobs / logger 使用。
 *
 * 进程内的 SDK 装配、exporter 与 span 投影属于 `@workspace/observability`。
 */
import {
  type Context,
  context,
  defaultTextMapSetter,
  isSpanContextValid,
  isValidSpanId,
  isValidTraceId,
  propagation,
  type SpanContext,
  type TextMapPropagator,
  trace,
} from "@opentelemetry/api"
import {
  CompositePropagator,
  parseTraceParent,
  TRACE_PARENT_HEADER,
  TRACE_STATE_HEADER,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from "@opentelemetry/core"

export type { SpanContext }
export {
  isSpanContextValid,
  isValidSpanId,
  isValidTraceId,
  TRACE_PARENT_HEADER,
  TRACE_STATE_HEADER,
}

/**
 * W3C Trace Context §3.2.2.3 的 trace-id：32 位小写十六进制，全零非法。
 * 这是「我们发出的形状」，用于 OpenAPI 描述等对外声明；解析外部输入用 `isTraceId`。
 */
export const TRACE_ID_PATTERN = "^(?!0{32})[0-9a-f]{32}$"

/**
 * 外部输入的类型守卫。委托 OTel：拒绝全零、长度与字符错误；
 * 按接收端宽容原则接受大写 hex（发送端形状见 `TRACE_ID_PATTERN`）。
 */
export function isTraceId(value: unknown): value is string {
  return typeof value === "string" && isValidTraceId(value)
}

export function isSpanId(value: unknown): value is string {
  return typeof value === "string" && isValidSpanId(value)
}

/** 当前活跃 span 的 context；无 span 或 span context 非法时为 undefined */
export function getActiveSpanContext(): SpanContext | undefined {
  const spanContext = trace.getActiveSpan()?.spanContext()
  return spanContext && isSpanContextValid(spanContext) ? spanContext : undefined
}

/** 从 traceparent header 取 trace-id；形状非法（含大写 hex、全零）时为 undefined */
export function traceIdFromHeader(value: string | null | undefined): string | undefined {
  return typeof value === "string" ? parseTraceParent(value)?.traceId : undefined
}

/** 项目采用的传播器组合：W3C Trace Context + W3C Baggage，不随 `OTEL_PROPAGATORS` 变化 */
export function createTracePropagator(): TextMapPropagator {
  return new CompositePropagator({
    propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
  })
}

/** 传播出口：把当前 trace 上下文写入 carrier（HTTP response header 与 job payload metadata 共用） */
export function injectTraceContext(carrier: Record<string, string> = {}): Record<string, string> {
  propagation.inject(context.active(), carrier, defaultTextMapSetter)
  return carrier
}

/** 传播入口：从 carrier 还原 trace 上下文 */
export function extractTraceContext(carrier: Record<string, string>): Context {
  return propagation.extract(context.active(), carrier)
}

/**
 * HTTP response 的暴露出口。
 * 只回 `traceparent`：它是服务端 span context，正是调用方下一个 span 的父级。
 * 不回 `tracestate`：W3C Trace Context §6.3，跨域调用方不应看到上游厂商数据。
 */
export function traceResponseHeaders(): Record<string, string> {
  const traceparent = injectTraceContext()[TRACE_PARENT_HEADER]
  return traceparent === undefined ? {} : { [TRACE_PARENT_HEADER]: traceparent }
}

/** pino JSON stdout 的关联字段；命名对齐 OTel Logs Data Model 与日志后端的默认关联键 */
export interface TraceLogFields {
  trace_id?: string
  span_id?: string
  trace_flags?: string
}

export function traceLogFields(): TraceLogFields {
  const spanContext = getActiveSpanContext()

  if (!spanContext) return {}

  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
    trace_flags: spanContext.traceFlags.toString(16).padStart(2, "0"),
  }
}
