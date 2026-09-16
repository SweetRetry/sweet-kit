import {
  type Context,
  type ContextManager,
  context,
  propagation,
  ROOT_CONTEXT,
  type SpanContext,
  TraceFlags,
  trace,
} from "@opentelemetry/api"
import { TraceState, W3CTraceContextPropagator } from "@opentelemetry/core"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import {
  extractTraceContext,
  getActiveSpanContext,
  injectTraceContext,
  isSpanId,
  isTraceId,
  TRACE_ID_PATTERN,
  TRACE_PARENT_HEADER,
  TRACE_STATE_HEADER,
  traceIdFromHeader,
  traceLogFields,
  traceResponseHeaders,
} from "../src/index.ts"

const traceId = "4bf92f3577b34da6a3ce929d0e0e4736"
const spanId = "00f067aa0ba902b7"
const zeroTraceId = "0".repeat(32)

const spanContext: SpanContext = { traceId, spanId, traceFlags: TraceFlags.SAMPLED }

function withSpanContext<T>(value: SpanContext, run: () => T): T {
  return context.with(trace.setSpan(ROOT_CONTEXT, trace.wrapSpanContext(value)), run)
}

/**
 * 同步 context manager：@opentelemetry/api 默认是 noop（真实实现由 SDK 注册），
 * 这些测试都在同一个调用栈内，因此不需要引入 @opentelemetry/context-async-hooks。
 */
function createSyncContextManager(): ContextManager {
  let current = ROOT_CONTEXT

  return {
    active: () => current,
    bind(_context: Context, target) {
      return target
    },
    disable() {
      current = ROOT_CONTEXT
      return this
    },
    enable() {
      return this
    },
    with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
      next: Context,
      fn: F,
      thisArg?: ThisParameterType<F>,
      ...args: A
    ): ReturnType<F> {
      const previous = current
      current = next
      try {
        return fn.call(thisArg, ...args)
      } finally {
        current = previous
      }
    },
  }
}

beforeAll(() => {
  context.setGlobalContextManager(createSyncContextManager())
  propagation.setGlobalPropagator(new W3CTraceContextPropagator())
})

afterAll(() => {
  propagation.disable()
  context.disable()
})

describe("trace-id 形状", () => {
  it("拒绝全零 trace-id（W3C：all zeroes forbidden）", () => {
    expect(isTraceId(zeroTraceId)).toBe(false)
  })

  it("拒绝长度错误与非 hex 字符", () => {
    expect(isTraceId(traceId.slice(0, 31))).toBe(false)
    expect(isTraceId(`${traceId}0`)).toBe(false)
    expect(isTraceId("4bf92f3577b34da6a3ce929d0e0e473g")).toBe(false)
  })

  it("接受合法 id，并对非字符串保持类型守卫语义", () => {
    expect(isTraceId(traceId)).toBe(true)
    expect(isTraceId(traceId.toUpperCase())).toBe(true)
    expect(isTraceId(null)).toBe(false)
    expect(isTraceId(1234)).toBe(false)
  })

  it("拒绝全零 span-id", () => {
    expect(isSpanId(spanId)).toBe(true)
    expect(isSpanId("0".repeat(16))).toBe(false)
  })

  it("对外声明的 TRACE_ID_PATTERN 描述发送形状：小写且非全零", () => {
    const pattern = new RegExp(TRACE_ID_PATTERN)
    expect(pattern.test(traceId)).toBe(true)
    expect(pattern.test(zeroTraceId)).toBe(false)
    expect(pattern.test(traceId.toUpperCase())).toBe(false)
  })
})

describe("active span context", () => {
  it("无活跃 span 时为 undefined", () => {
    expect(getActiveSpanContext()).toBeUndefined()
  })

  it("span context 非法时为 undefined", () => {
    expect(
      withSpanContext({ ...spanContext, traceId: zeroTraceId }, () => getActiveSpanContext())
    ).toBeUndefined()
  })

  it("返回活跃 span 的 context", () => {
    expect(withSpanContext(spanContext, () => getActiveSpanContext())).toMatchObject(spanContext)
  })
})

describe("传播", () => {
  it("无活跃 span 时不写出任何 header", () => {
    expect(injectTraceContext()).toEqual({})
    expect(traceResponseHeaders()).toEqual({})
  })

  it("response 暴露 W3C traceparent 形状，且与活跃 span context 一致", () => {
    const headers = withSpanContext(spanContext, () => traceResponseHeaders())

    expect(Object.keys(headers)).toEqual([TRACE_PARENT_HEADER])
    expect(headers[TRACE_PARENT_HEADER]).toBe(`00-${traceId}-${spanId}-01`)
  })

  it("response 丢弃 tracestate，而传播 carrier 保留它（W3C §6.3 跨域泄漏）", () => {
    const remoteSpanContext: SpanContext = {
      ...spanContext,
      traceState: new TraceState("vendor=value"),
    }

    const headers = withSpanContext(remoteSpanContext, () => traceResponseHeaders())
    const carrier = withSpanContext(remoteSpanContext, () => injectTraceContext())

    expect(headers).not.toHaveProperty(TRACE_STATE_HEADER)
    expect(carrier[TRACE_STATE_HEADER]).toBe("vendor=value")
  })

  it("inject 与 extract 往返保留 trace-id 与采样标志", () => {
    const carrier = withSpanContext(spanContext, () => injectTraceContext())
    const extracted = trace.getSpanContext(extractTraceContext(carrier))

    expect(extracted).toMatchObject({
      spanId,
      traceFlags: TraceFlags.SAMPLED,
      traceId,
    })
  })

  it("从 traceparent 取 trace-id，形状非法时返回 undefined", () => {
    expect(traceIdFromHeader(`00-${traceId}-${spanId}-01`)).toBe(traceId)
    expect(traceIdFromHeader(`00-${zeroTraceId}-${spanId}-01`)).toBeUndefined()
    expect(traceIdFromHeader(`00-${traceId.toUpperCase()}-${spanId}-01`)).toBeUndefined()
    expect(traceIdFromHeader("not-a-traceparent")).toBeUndefined()
    expect(traceIdFromHeader(null)).toBeUndefined()
  })
})

describe("日志关联字段", () => {
  it("无活跃 span 时不注入任何字段", () => {
    expect(traceLogFields()).toEqual({})
  })

  it("字段名与 OTel Logs Data Model 对齐", () => {
    expect(withSpanContext(spanContext, () => traceLogFields())).toEqual({
      trace_id: traceId,
      span_id: spanId,
      trace_flags: "01",
    })
  })

  it("未采样 span 的 flags 为 00", () => {
    expect(
      withSpanContext({ ...spanContext, traceFlags: TraceFlags.NONE }, () => traceLogFields())
    ).toMatchObject({ trace_flags: "00" })
  })
})
