# ADR 0006：trace 契约、暴露出口与关联字段命名

- 状态：Accepted
- 日期：2026-09-16

## 背景

trace 的生成、传播与查询由 [ADR 0002](0002-opentelemetry-observability.md) 划定边界，但「trace id 长什么样、叫什么名字、从哪个出口暴露给调用方」没有单一真源，同一件事在 5 处各自实现：

- id 形状校验在 `packages/request` 用自写正则，比 W3C 松（接受全零 id，而 W3C 要求收到全零 trace-id 的 `traceparent` 必须忽略）。
- 暴露出口是 `apps/server` 与 `packages/request` 各自硬编码的 `x-trace-id` —— 一个没有互操作含义的本地发明。
- 日志关联字段用 camelCase，与 OTel Logs Data Model、官方 pino instrumentation 和日志后端的默认关联键都不一致。
- 跨进程传播的 carrier 读写散落在 job enqueue 处手写。

W3C Trace Context 与 OpenTelemetry 已经覆盖了「格式、传播器、日志字段语义」，项目只需要决定暴露出口与命名契约，不需要自研校验。OTLP 标准化 export，但不标准化「把 trace id 暴露给 API 调用方」的形态，所以这一层必须由本 ADR 固定。

## 决策

- **单一 owner 是 `packages/tracing`。** 它定义传播格式、暴露出口与关联字段命名，只依赖 `@opentelemetry/api` 与 `@opentelemetry/core`，保持浏览器可用；进程内的 SDK 装配、exporter 与 span 投影不属于它。
- **校验与序列化一律委托 OTel，不自写正则。** 形状判断用 `isValidTraceId` / `isSpanId`；生成 `traceparent` 与解析都用 W3C propagator 的同一套实现。
- **传播格式是 W3C Trace Context**（`traceparent` + `tracestate`）。传播器组合固定为 Trace Context + Baggage，由 `createTracePropagator()` 提供，不随 `OTEL_PROPAGATORS` 变化。
- **HTTP response 的暴露出口是 `traceparent`**，取代 `x-trace-id`（部分取代 [ADR 0002](0002-opentelemetry-observability.md)）。response 里的 `traceparent` 是服务端 span context，正是调用方下一个 span 的父级，字段语义成立；同时入站解析与出站序列化共用同一条代码路径。
- **response 不回传 `tracestate`。** W3C Trace Context §6.3 指出 response 中的 vendor 数据可能泄漏给跨域调用方；`tracestate` 只用于进程间传播。
- **错误体的 `traceId` 保留**，仍是仅随 500 出现的 RFC 9457 扩展成员；它的取值形状由 W3C 决定，不再由本项目自行约定。
- **日志关联字段是 `trace_id` / `span_id` / `trace_flags`**，对齐 OTel Logs Data Model、官方 pino instrumentation 与日志后端的默认关联键。
- **span 投影保持 camelCase**（`traceId` / `spanId` / `parentSpanId`），因为它对齐 OTLP/JSON 的表示，与 pino stdout 的关联字段是两种不同用途的名称。

## 备选方案

- **保留 `x-trace-id`**：对「人从 devtools 复制一个 id」更省事，但永久停留在一个无互操作含义的本地 header 上，且需要维护两套出口。放弃。
- **改用 `server-timing: trace;desc=<traceparent>`**：这是 trace-context 仓库当前草案给出的 response binding，浏览器可经 `PerformanceServerTiming` 读取。但面向 CLI 与 API 消费者更难取用，且草案状态不稳定。放弃。
- **日志字段保留 camelCase**：改动更小，但接 OTLP logs 或日志后端时需要 adapter 或改名。放弃。
- **兼容 .NET 生态的 `ProblemDetails.extensions.traceId`**：ASP.NET Core 写入的是完整 `Activity.Id`（`00-<trace>-<span>-<flags>`），不是 32 位 trace-id。两边形状不同，只共享成员名；本项目不为此放宽校验。

## 结果

- trace 的形状、名称与出口只在 `packages/tracing` 与 `packages/request` 的错误契约里定义一次；`x-trace-id` 从所有出口消失。
- 客户端与 CLI 从 `traceparent` 取 trace id，W3C 格式的解析由 `packages/request` 封装，调用方不直接处理。
- 接收端接受大写 hex（OTel 语义），发送形状仍是 W3C 的小写；两者的区别由 `TRACE_ID_PATTERN` 与 `isTraceId` 的注释区分，并由测试守护。
- 风险：跨域调用方需要 `Access-Control-Expose-Headers` 才能读到 `traceparent`，忘记声明时表现为“看不到 trace id”而非报错。
