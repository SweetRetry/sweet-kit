# ADR 0002：Pino 结构化日志切面

- 状态：Accepted
- 日期：2026-08-21

## 背景

Hono server 需要统一的 application log 与 HTTP access log，使本地诊断和生产日志采集使用同一事件结构，并避免认证凭据进入日志。

## 决策

- 使用 Pino 生成结构化日志，配置集中在 `packages/logger`。
- Hono 使用 `hono-pino` 记录 HTTP request completion，并通过 Hono request ID middleware 关联同一请求的日志。
- 日志默认以 JSON 写入 stdout；`LOG_PRETTY=true` 时使用 `pino-pretty` 开发 transport。
- 使用 `LOG_LEVEL` 控制最小日志级别，默认 `info`。
- 2xx/3xx response 记录为 `info`，4xx 为 `warn`，5xx 为 `error`。
- authorization、cookie、password 和 token 类字段由 Pino redaction 在输出前替换。
- application event 使用稳定的 message name，例如 `server.started`，变化数据放入结构化字段。

## 结果

- 日志可以直接由容器平台、log collector 或后续 observability transport 消费。
- request log 包含 method、URL、status、response time 和 request ID。
- pretty output 仅作为开发显示层，不改变生产日志 schema。
- 新增日志调用通过 `packages/logger` 创建的 logger 或 Hono context logger，不直接使用 `console`。
