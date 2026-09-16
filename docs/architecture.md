# 系统结构

Turborepo + pnpm workspace 组织。`apps/*` 拥有进程入口、切面装配和应用专属业务；`packages/*` 只承载已被多个应用或进程共同使用的能力与契约。边界的取舍与历史见 [ADR 0001](adr/0001-architecture-runtime-boundaries.md) 与 [ADR 0007](adr/0007-runtime-assembly-and-app-ownership.md)。

## 应用

| 路径 | 进程 | 职责 |
| :--- | :--- | :--- |
| `apps/web` | Next.js App Router（43110） | 浏览器前端，经 `@workspace/request` 访问 server |
| `apps/server` | Hono（43111） | HTTP API、OpenAPI 3.1 与 Scalar、Better Auth、Drizzle schema 与 migration、telemetry 装配 |
| `apps/worker` | Graphile Worker | 消费后台任务，独立进程与 lifecycle |
| `apps/cli` | Commander | device authorization 登录与本机 trace 查询 |

## Package

| 路径 | 职责 | 消费者 |
| :--- | :--- | :--- |
| `packages/tracing` | trace 契约：W3C 格式校验、传播、暴露出口、日志关联字段命名 | server、worker、request、logger |
| `packages/observability` | span 投影与本地查询源（`agent-traces`） | server、worker、cli |
| `packages/logger` | Pino 结构化日志与敏感字段 redaction | server、worker |
| `packages/request` | API 错误契约（RFC 9457）与 ky HTTP client | server、web、cli |
| `packages/ui` | Tailwind CSS v4 + shadcn/ui 组件与设计 token | web |
| `packages/typescript-config` | 共享 tsconfig 预设 | 全部 |

## 边界

- 应用只通过 package 的公开 exports 使用能力，不跨 package 导入内部文件。
- package 不启动进程级资源、不聚合跨 runtime 配置：环境变量由所属应用校验，SDK 的构造与启停留在应用（见 `apps/server/src/observability.ts`、`apps/worker/src/observability.ts`）。
- 应用专属业务模块留在所属应用：Better Auth、database schema 与 migration 属于 `apps/server`；task handler 属于 `apps/worker`。
- 新代码在出现真实的跨边界消费者之前留在所属应用；不以潜在复用性拆包。
- 本地开发时应用通过 package 的 `development` export 直接消费 TypeScript 源码，发布构建使用编译后的 default export。

## Composition root

`apps/*/src/index.ts` 是各进程的入口：读取并校验自身环境变量（`src/env.ts`），装配资源，注册关停流程。跨切面行为在这里显式组装，不由公共模块隐式启动。
