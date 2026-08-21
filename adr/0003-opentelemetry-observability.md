# ADR 0003：OpenTelemetry observability 与 Agent 诊断闭环

- 状态：Accepted
- 日期：2026-08-21

## 背景

Sweet Kit 需要让本地开发、CI 和生产使用同一套业务 instrumentation，并让开发者或 Coding Agent 能从 HTTP 错误响应定位到对应 trace。配置需要与 telemetry vendor 解耦，同时保留本地零容器运行能力。

OTLP 规范定义 telemetry 的编码、传输和 Export API，不定义跨 backend 的查询 API。因此，telemetry export 可以保持 vendor-neutral，trace 查询必须通过独立 adapter 对接本地文件或具体 backend。

## 决策

- Observability 切面放在 `packages/observability`，业务代码只使用 OpenTelemetry API；SDK、exporter 和环境适配集中在进程入口。
- Hono 使用 `@hono/otel` 建立 HTTP server span，读取 W3C Trace Context，并用匹配后的 route 更新 span name。
- Pino logger 从 OpenTelemetry API 的 active span 注入 `traceId`、`spanId` 和 `traceFlags`。Pino JSON stdout 仍是 application log 的事实来源，当前不启用处于 Development 状态的 OpenTelemetry JS logs pipeline。
- 所有 Hono response 在存在 active span 时返回 `x-trace-id`；未处理异常的 500 JSON body 同时返回 `traceId`。
- 本地未显式设置 `OTEL_TRACES_EXPORTER` 时，将最小化后的 span projection 写入 `apps/server/data/traces.jsonl`。URL query 和认证、cookie、password、secret、token 类 attribute 在写入前 redaction。
- CLI 使用 `sweet trace <traceId>` 输出 span tree，使用 `--json` 输出适合 Coding Agent 消费的完整结构化 projection。
- 生产不启用本地文件 adapter，使用标准 `OTEL_SERVICE_NAME`、`OTEL_TRACES_EXPORTER`、`OTEL_EXPORTER_OTLP_*` 和 sampling 环境变量配置 OTLP backend。
- Trace 是诊断信号，不承担业务状态、权限、幂等、恢复或审计不变量。sampling 或 export 失败不得改变业务请求结果。
- 当前基线只采集 Hono Node.js server traces。OpenTelemetry JS browser instrumentation 仍为 experimental；在明确客户端 tracing 的数据治理、CORS、采样和收益后再单独决策。Next.js server runtime 后续使用其 `instrumentation.ts` 入口接入，不与 Hono NodeSDK bootstrap 共用 runtime-specific 初始化代码。

## 环境约定

本地默认无需 collector。可显式选择 console：

```bash
OTEL_TRACES_EXPORTER=console pnpm --filter server dev
```

生产 OTLP/HTTP 使用 base endpoint；`OTEL_EXPORTER_OTLP_ENDPOINT` 后不附加 `/v1/traces`，SDK 会按信号补全路径：

```bash
NODE_ENV=production \
OTEL_SERVICE_NAME=sweet-kit-server \
OTEL_TRACES_EXPORTER=otlp \
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf \
OTEL_EXPORTER_OTLP_ENDPOINT=https://collector.example.com \
pnpm --filter server start
```

## 结果

- Hono 业务逻辑在本地和生产保持一致，export destination 与 sampling 只由进程配置决定。
- HTTP response、Pino log 和 span 通过同一个 `traceId` 关联。
- 本地 Agent 可以在没有 observability backend 的情况下完成确定性的 trace lookup。
- 生产 backend 可替换，但 Agent 的生产查询 adapter 需要针对所选 backend 的 API 单独实现。

## 依据

- [OpenTelemetry OTLP specification](https://opentelemetry.io/docs/specs/otlp/)
- [OpenTelemetry SDK environment variables](https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/)
- [OpenTelemetry JavaScript status](https://opentelemetry.io/docs/languages/js/)
- [Hono OpenTelemetry middleware](https://www.npmjs.com/package/@hono/otel)
- [Next.js instrumentation convention](https://nextjs.org/docs/app/guides/instrumentation)
