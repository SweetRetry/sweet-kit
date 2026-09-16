# Database 与后台任务

一致性边界与 at-least-once 语义见 [ADR 0003](adr/0003-postgresql-and-graphile-worker.md)，job 与运行时装配的归属见 [ADR 0007](adr/0007-runtime-assembly-and-app-ownership.md)。

## 所有权

- **PostgreSQL** 是 application data 与 job queue 的共同持久化基线，本地由 `compose.yaml` 提供（`pnpm infra:up`）。
- **Drizzle** 只管理 application schema；schema 与 client 属于 `apps/server/src/database/`。业务表和 Better Auth 表都在这里。
- **Graphile Worker** 在独立的 `graphile_worker` schema 中管理自身对象与 migration，不进入 Drizzle migration。

## Migration

```bash
pnpm db:generate
pnpm db:migrate
```

## 后台任务

- 消费侧：`apps/worker` 定义 task identifier、payload schema 与 handler，并作为独立进程运行（`JOB_CONCURRENCY` 控制并发）。
- 生产侧：需要与业务状态原子提交的 enqueue 由写出该状态的 app 在同一个 Drizzle transaction 中执行；`apps/worker` 不承担生产侧职责。
- task 按 at-least-once 语义设计，可能重复执行的外部副作用必须有 idempotency strategy（例如 welcome 邮件按 `job_key` 去重）。

## 测试

测试不得自行启动或依赖开发机的 container runtime；需要数据库的验证由显式 integration environment 提供。当前覆盖范围与计划见 [README 的检查一节](../README.md) 与 [future/server-integration-tests.md](future/server-integration-tests.md)。
