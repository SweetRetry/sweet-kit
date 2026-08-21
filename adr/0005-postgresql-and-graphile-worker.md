# ADR 0005：PostgreSQL 与 Graphile Worker job 基础设施

- 状态：Accepted
- 日期：2026-08-21
## 背景

套件需要可靠的后台任务、延迟执行、重试和 cron 能力，并要求业务状态与 job enqueue 可以原子提交。单独引入 queue service 会增加独立开发阶段的部署与诊断成本。

## 决策

- PostgreSQL 是唯一 database 基线；Drizzle 使用 `node-postgres` driver，Better Auth 使用官方 Drizzle PostgreSQL adapter。
- Graphile Worker 使用同一个 PostgreSQL database，并在默认 `graphile_worker` schema 中自行维护内部对象；Drizzle migration 只管理 application schema。
- `packages/jobs` 是 job 切面，定义 task identifier、Zod payload、handler 和 enqueue SQL；`apps/worker` 是独立 process composition root。
- 需要一致性的业务写入与 enqueue 使用同一个 Drizzle transaction 执行。task 按 at-least-once 语义设计，所有外部副作用必须支持 idempotency。
- enqueue payload 携带 W3C Trace Context；worker handler 创建 OTel job span，使 Pino log 与 producer trace 可关联。
- 本地 PostgreSQL 使用 Compose；integration test 使用 Testcontainers 启动真实 PostgreSQL。

## 结果

业务 database 与 job queue 共享 PostgreSQL 的事务保证，不需要 Redis 或独立 broker。server 与 worker 可以独立扩缩容，job contract、日志和 tracing 保持在明确的切面内。
