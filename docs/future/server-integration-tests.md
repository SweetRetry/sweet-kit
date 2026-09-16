# Server 集成测试

## 问题

`apps/server` 目前没有自动化测试。已有覆盖只有 `packages/request`（错误契约、HTTP 客户端）和 `apps/web`（analytics）。路由、中间件错误出口、Better Auth Bearer session、device authorization 与 job execution 都依赖手动验证，`rules/api-contract.md` 要求的「应用响应测试」因此长期无人执行。

## 候选方案

- 通过 Hono `app.request()` 直接调用 app 实例，覆盖路由、中间件与错误出口，不启动真实端口。
- 需要数据库的用例由显式 integration environment 提供 PostgreSQL，不在测试内启动 container runtime。
- 涉及外部依赖的用例注入替身；认证相关用例复用 Better Auth 的测试夹具而非真实 device flow。

## 触发条件

第一次改动 server 路由、中间件或认证行为时推进，与 `rules/api-contract.md` 的应用响应测试门禁一起落地。

## 状态

`ci.yml` 已提供 PostgreSQL service 与 `DATABASE_URL`，并执行 `pnpm db:migrate`；缺的是用例本身与 `apps/server/vitest.config.ts`。落地后本条目删除，`README.md` 的检查一节改为实际覆盖范围。
