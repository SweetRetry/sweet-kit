# ADR 0003：PostgreSQL 与 Graphile Worker 一致性边界

- 状态：Accepted（`packages/jobs` 归属部分由 [0007](0007-runtime-assembly-and-app-ownership.md) 取代）
- 日期：2026-08-21

## 背景

后台任务需要延迟执行、重试和 cron，并要求业务状态与 job enqueue 可以原子提交。引入独立 queue service 会失去与业务数据库的单事务保证，并增加部署和故障诊断边界。

## 决策

- PostgreSQL 是 application data 和 job queue 的共同持久化基线。
- Drizzle migration 只管理 application schema；Graphile Worker 在独立 schema 中管理自身对象和 migration。
- `packages/jobs` 定义 task identifier、payload contract、handler 和 enqueue 能力；`apps/worker` 是独立 process composition root。
- 需要一致性的业务写入与 enqueue 必须在同一个 database transaction 中执行。
- Task 按 at-least-once 语义设计；所有可能重复执行的外部副作用必须具有 idempotency strategy。
- Enqueue 传播 W3C Trace Context，worker execution 建立对应 job span，但 tracing 不参与任务正确性判断。

## 结果

- 业务状态和 job 创建具有原子性，不需要跨 PostgreSQL 与外部 broker 协调提交。
- Server 与 worker 可以独立扩缩容和管理 lifecycle。
- Application migration 与 queue internals 的所有权边界明确。
