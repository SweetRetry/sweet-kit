# ADR 0001：Sweet Kit 技术基线与切面边界

- 状态：Accepted
- 日期：2026-08-21

## 背景

Sweet Kit 是面向全栈 TypeScript 项目的开发套件。package 的拆分依据是架构切面，而不是潜在复用性；应用仅承担进程入口、部署适配和切面装配。

## 决策

- 使用 pnpm workspace 与 Turborepo 管理 monorepo 和任务依赖。
- Web 使用 Next.js App Router、React 19 和 TypeScript。
- UI 切面使用 Tailwind CSS v4 与 shadcn/ui，统一放在 `packages/ui`。
- Request 切面放在 `packages/request`：ky 负责 HTTP lifecycle，TanStack Query 负责 Web server state。
- Server 使用 Hono；API contract 使用 `@hono/zod-openapi`，交互式文档使用 Scalar。
- Auth 切面放在 `packages/auth`，使用 Better Auth。CLI 采用 RFC 8628 device authorization，在当前第一方场景下获取 Better Auth session token，并由 Bearer plugin 接入 Hono API。
- Database 切面放在 `packages/database`，使用 PostgreSQL、Drizzle ORM 与 `node-postgres`；Better Auth 通过官方 Drizzle adapter 使用同一数据库实例和 schema。
- Job 切面放在 `packages/jobs`，使用 Graphile Worker；`apps/worker` 作为独立 process 执行 task。
- CLI 位于 `apps/cli`，使用 Commander 组织命令，使用系统浏览器完成 device authorization，并通过 request 切面调用 Hono API。
- 优先采用维护活跃、经过生产验证的第三方成熟库；仅在现有依赖的文档、类型定义和扩展能力无法满足需求时自行实现。

## 边界

```text
apps/web      → request、ui、Better Auth browser client
apps/server   → auth、database、Hono/OpenAPI/Scalar composition root
apps/worker   → jobs、Graphile Worker composition root
apps/cli      → request、Better Auth device client、Commander

packages/ui
packages/request
packages/auth
packages/database
packages/env
packages/jobs
```

应用通过 package 的公开 exports 访问切面，不跨 package 导入内部文件。

## 结果

- 前端、服务端和 CLI 可以独立部署或运行，同时共享一致的任务图和质量检查。
- Auth、database 与 request 的实现细节被限制在对应切面内。
- PostgreSQL 同时承载 application data 与 Graphile Worker，业务写入和 job enqueue 可以原子提交。
- 当前 CLI token 是第一方 session token，不具备 OAuth resource audience 和细粒度 scope。需要开放第三方 CLI 或多 resource server 时，应通过新的 ADR 评估 Better Auth OAuth Provider。
