# ADR 0005：HTTP API 形态与版本策略

- 状态：Accepted
- 日期：2026-09-16

## 背景

HTTP API 由 `apps/server`（Hono + `@hono/zod-openapi`）提供，消费方是同仓库的 `apps/web` 与 `packages/request`。当前只有 `/api/health`、`/api/me` 两个项目 endpoint，以及 Better Auth 挂载的 `/api/auth/*`。

没有第三方 client，也没有对外兼容承诺，endpoint 仍会大幅增删。引入版本前缀的收益只在出现无法兼容的破坏性变更时兑现，而成本从第一天开始：挂载点与 SDK 都要处理版本段。

## 决策

- API 以资源路径 + HTTP 方法表达，方法语义遵循 RFC 9110。非 CRUD 操作用子资源路径（`POST /resources/{id}/action`），不引入动词式顶层路径。强制规则见 `rules/api-contract.md`。
- 暂不引入版本前缀，保持 `/api/*`。破坏性变更优先以兼容方式演进：新增字段、新增资源路径或新增错误 code。
- 出现无法兼容的变更时，由新 ADR 决定版本化方案，不在本 ADR 下直接加前缀。备选方案是路径前缀 `/api/v2`（要求 Better Auth 挂载点与 SDK 整体前移，影响面最大但语义最直白）与媒体类型协商 `Accept: application/vnd.sweet-kit.v2+json`（URI 稳定，但要求每个消费方实现协商）。
- 不追求 HATEOAS、超媒体链接或统一资源发现入口；API 由 `openapi.json` 与 SDK 类型描述。

## 结果

- endpoint 路径保持扁平，SDK 不需要处理版本协商。
- 兼容性由 spec 与评审约束，而非技术手段强制；代价是破坏性变更的拦截点晚于版本前缀方案。
- `packages/request` 的错误契约与 tracing 关联不随版本策略变化。`/api/auth/*` 由 Better Auth 的协议决定，本 ADR 不对其施加版本语义。
