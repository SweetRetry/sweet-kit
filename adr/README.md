# Architecture Decision Records

ADR 回答“为什么”。这里只记录会长期约束架构、存在重要取舍且无法从代码直接还原的决策。单份 ADR 应说明背景、备选方案、最终决策、结果与潜在风险，并使用连续四位序号；删除记录后执行 `pnpm adr:reorder` 统一重排。

工具用法、测试命令、依赖清单和可随实现局部调整的约定记录在 README、`AGENTS.md`、`rules/` 或代码中。

| ADR | 状态 | 决策 |
| --- | --- | --- |
| [0001](./0001-architecture-runtime-boundaries.md) | Accepted | 架构切面与 runtime 边界 |
| [0002](./0002-opentelemetry-observability.md) | Accepted | OpenTelemetry 信号边界与诊断关联 |
| [0003](./0003-postgresql-and-graphile-worker.md) | Accepted | PostgreSQL 与 Graphile Worker 一致性边界 |
| [0004](./0004-cli-authentication-boundary.md) | Accepted | 第一方 CLI 认证边界 |
