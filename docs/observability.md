# Observability

信号边界与取舍见 [ADR 0002](adr/0002-opentelemetry-observability.md)，trace 契约见 [ADR 0006](adr/0006-trace-context-contract.md)，装配归属见 [ADR 0007](adr/0007-runtime-assembly-and-app-ownership.md)。本页是使用说明。

## 信号

- **Traces**：OpenTelemetry。业务代码只依赖 API；SDK 由 `apps/server/src/observability.ts` 与 `apps/worker/src/observability.ts` 各自装配和关停。
- **Logs**：Pino JSON stdout 是 application log 的事实来源，不启用 OpenTelemetry logs pipeline（`OTEL_LOGS_EXPORTER=none`）。
- **Metrics**：未启用（`OTEL_METRICS_EXPORTER=none`）。

日志默认以 JSON 写入 stdout；`LOG_LEVEL` 控制级别，本地需要可读输出时设置 `LOG_PRETTY=true`。

## trace 契约

| 内容 | 取值 | 真源 |
| :--- | :--- | :--- |
| 传播格式 | W3C Trace Context：`traceparent`、`tracestate` | `packages/tracing` |
| 传播器 | Trace Context + Baggage，不随 `OTEL_PROPAGATORS` 变化 | `packages/tracing` |
| HTTP response 暴露 | `traceparent`（服务端 span context），不返回 `tracestate` | `packages/tracing` |
| 错误体 | RFC 9457 扩展成员 `traceId`，仅 `INTERNAL_SERVER_ERROR` 携带 | `packages/request/src/contract.ts` |
| 日志关联字段 | `trace_id`、`span_id`、`trace_flags` | `packages/tracing` |
| span 投影 | camelCase `traceId` / `spanId`（对齐 OTLP/JSON） | `packages/observability` |

形状的校验与序列化委托给 `@opentelemetry/api` 与 `@opentelemetry/core`，项目内不自写正则。接收端接受大写 hex（OTel 语义），发送端固定小写。

跨域调用方需要 `Access-Control-Expose-Headers` 才能读到 `traceparent`，server 已显式声明。

## 本地查看 trace

未设置 `OTEL_TRACES_EXPORTER` 的非生产环境下，span 以 JSONL 投影落盘：server 写 `apps/server/data/traces.jsonl`，worker 写 `apps/worker/data/traces.jsonl`（可用 `SWEET_KIT_TRACE_FILE`、`SWEET_KIT_WORKER_TRACE_FILE` 覆盖）。

从 HTTP response 的 `traceparent` 或 500 响应体的 `traceId` 取得 trace id 后查询：

```bash
pnpm cli trace <traceId>
pnpm cli trace <traceId> --json
```

`trace` 默认**同时读 server 与 worker 两份文件**，因此 HTTP request 与它触发的 job 会在同一棵 span tree 里；`--file <path>` 指定其他 JSONL 文件（可重复，给出后取代默认列表）。trace id 大小写不敏感：发送端固定小写，查询时大写输入会归一后再匹配。`--json` 输出完整 span projection，供 Coding Agent 读取。

## 导出到 backend

生产使用标准 OTel 环境变量发送 OTLP：

```bash
NODE_ENV=production \
OTEL_SERVICE_NAME=sweet-kit-server \
OTEL_TRACES_EXPORTER=otlp \
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf \
OTEL_EXPORTER_OTLP_ENDPOINT=https://collector.example.com \
pnpm --filter server start
```

`OTEL_EXPORTER_OTLP_ENDPOINT` 是 base endpoint，不附加 `/v1/traces`。OTLP 只标准化 export，不标准化查询 API；trace 查询需要对接具体 backend。

## Redaction

- log 的敏感字段排除列表在 `packages/logger`：按字段名逐层匹配（顶层、`*.password`、`*.*.accessToken` 等），`apiKey`、`credential`、`authorization`、`cookie` 与各类 token 都在表内；`gen_ai.usage.input_tokens` 这类计数指标不受影响。
- span 投影在 `packages/observability` 上先按 key 语义判定：凭据类 key 整值替换，`token` 只有作为独立 key 段（`session.token`）才算凭据；`input_tokens`、`token_count` 是指标，保留原值。URL 的 query 与 fragment 被剔除，`url.query` 整值替换。
- 两处都有回归测试：`packages/logger/test/redaction.test.ts` 与 `packages/observability/test/agent-traces.test.ts`。

URL query、认证信息、cookie、password、secret 与 api key 类数据不得进入持久化的 log 或 trace projection。新增字段若命中上述语义，先补测试再合入。
