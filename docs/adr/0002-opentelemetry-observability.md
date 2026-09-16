# ADR 0002：OpenTelemetry 信号边界与诊断关联

- 状态：Accepted（暴露出口与关联字段命名部分由 [0006](0006-trace-context-contract.md) 取代）
- 日期：2026-08-21

## 背景

本地开发、CI 和生产需要共享同一套业务 instrumentation，并能从 HTTP 错误定位到对应 trace。OTLP 定义 telemetry 的传输方式，但不定义不同 backend 的查询 API，因此 export 与查询不能视为同一个抽象。

## 决策

- 业务代码只依赖 OpenTelemetry API；SDK、exporter 和 runtime 适配在各 process 的 composition root 初始化。
- 使用 W3C Trace Context 贯穿 HTTP request、job enqueue 和 worker execution。
- Pino JSON stdout 是 application log 的事实来源，日志从 active span 注入 `traceId` 和 `spanId`，不启用 OpenTelemetry logs pipeline。
- HTTP response 在存在 active span 时返回 `x-trace-id`；未处理异常的响应同时在结构化 body 中返回 `traceId`。
- Telemetry export 保持 vendor-neutral。trace 查询由独立 adapter 对接本地存储或具体 backend API。
- URL query、认证信息、cookie、password、secret 和 token 类数据不得进入持久化的 log 或 trace projection。
- Trace 只用于诊断，不承担业务状态、权限、幂等、恢复或审计不变量；sampling 和 export 失败不得改变业务结果。
- browser tracing 需要单独评估数据治理、CORS、采样和收益，不随 Node.js instrumentation 自动启用。

## 结果

- HTTP response、application log 和异步 job span 可以通过同一 trace 关联。
- Export backend 可以替换，但查询能力需要显式实现对应 adapter。
- 各 runtime 独立管理 SDK lifecycle，避免全局初始化和关闭行为相互影响。
