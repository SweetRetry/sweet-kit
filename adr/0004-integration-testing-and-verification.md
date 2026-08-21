# ADR 0004：Hono 集成测试、临时 PostgreSQL 与统一验证入口

- 状态：Accepted
- 日期：2026-08-21

## 背景

server 的主要风险位于 Hono middleware、Better Auth、Drizzle schema、Graphile Worker 和 OpenAPI 的连接处。仅测试孤立函数无法验证这些真实契约，共享开发数据库则会让测试结果依赖本地状态。

## 决策

- 使用 Vitest 作为测试运行器，并通过 Test Projects 承载 monorepo 内各应用的测试配置。
- server 集成测试直接调用 Hono `app.request()`，不监听网络端口。
- 每个 test suite 使用 Testcontainers 创建独占 PostgreSQL，并执行正式 Drizzle 与 Graphile Worker migration；测试结束关闭连接并停止 container。
- auth 测试使用正式 Better Auth handler、Bearer plugin 和 device authorization plugin；job 测试执行真实 enqueue SQL 和 task handler。
- 根目录 `pnpm verify` 是完整验证入口，固定执行 lint、typecheck、test、build、Knip 和 peer dependency 检查。

## 结果

测试能覆盖应用 composition 边界和真实数据库契约，同时保持本地与 CI 隔离。失败可由单条命令稳定复现，Coding Agent 也能直接读取结构化测试输出继续定位。
