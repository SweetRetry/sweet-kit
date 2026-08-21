# ADR 0006：分 runtime 的统一环境配置边界

- 状态：Accepted
- 日期：2026-08-21

## 背景

环境变量读取分散在各 app 后，默认值、校验和 secret 边界容易漂移。Web browser、server、worker 和 CLI 又具有不同的可见性与启动方式，不能共享包含全部配置的单一对象。

## 决策

- `packages/env` 是环境配置切面，使用 Zod 在 process 启动时完成解析。
- 按 runtime 提供独立 exports：`server`、`worker`、`web`、`cli`、`database` 和 `logger`。
- browser code 只导入 `@workspace/env/web`；server secrets 与 database URL 只存在于 Node.js runtime exports。
- OpenTelemetry 标准环境变量继续由 OTel SDK 直接读取；Testcontainers 的 Docker runtime discovery 留在 testing adapter。

## 结果

环境变量的名称、默认值和 validation 具有单一来源，同时通过 package export 保持 runtime 与 secret 隔离。
