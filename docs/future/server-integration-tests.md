# Server 剩余集成测试

## 问题

`apps/server` 的 HTTP 错误出口已由 `apps/server/test/http-contract.test.ts` 覆盖：未匹配路由、请求校验、认证缺失、限流与未配置依赖分别断言实际状态、`code` 与 problem 媒体类型，并核对 OpenAPI 声明的错误状态。该文件需要 `DATABASE_URL` 与已执行的 migration，未提供时整组跳过。

仍依赖手动验证、`rules/api-contract.md` 的「应用响应测试」尚未覆盖的部分：

- device authorization 的批准 / 拒绝全流程与过期、轮询间隔分支。
- Bearer session 与 cookie session 的等价性、会话过期后的 `401`。
- 成功响应分支（`201` / `202` / `204`）与 `Location`、`WWW-Authenticate` 等响应头，随第一个真实业务 endpoint 一起建立。
- job execution 侧：`apps/worker` 的 handler 幂等与重试行为。

## 候选方案

- 继续用 `app.request()` 直接调用 app 实例：`createServerApp` 是无副作用的工厂，装配在 `src/index.ts`，测试只需注入 database、auth 与 logger（logger 可用 `createLogger({ destination })` 收集输出）。
- 需要数据库的用例由显式 integration environment 提供 PostgreSQL，不在测试内启动 container runtime。
- 认证用例复用 Better Auth 的 server API（`auth.api.signUpEmail` 等）取得 session cookie，而不是走真实 device flow。

## 触发条件

第一次改动 device authorization、worker handler 或新增带请求体 / 成功响应语义的 endpoint 时推进。

## 状态

`ci.yml` 已提供 PostgreSQL service 与 `DATABASE_URL`，并执行 `pnpm db:migrate`，因此新增用例不需要改 CI。
