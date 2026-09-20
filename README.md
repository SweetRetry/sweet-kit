# Sweet Kit

基于 TypeScript 的全栈开发套件，使用 Turborepo 按架构切面组织 Web 与 server。

## 技术基线

- Web：Next.js App Router、React 19、Tailwind CSS v4、shadcn/ui
- Request：ky、TanStack Query
- Server：Hono、OpenAPI 3.1、Scalar
- AI：Vercel AI SDK（provider 与模型名由部署环境提供，见 `apps/server/src/ai.ts`）
- Auth：Better Auth、Bearer session
- Database：PostgreSQL、Drizzle ORM、node-postgres
- Logging：Pino、hono-pino、request ID、敏感字段 redaction
- Observability：OpenTelemetry、trace/log correlation、本地 JSONL 投影
- Env：各应用独立拥有的 Zod 环境变量配置
- Test：Vitest

## 仓库知识与自动化

| 目录 | 关注点 | 内容 |
| --- | --- | --- |
| [`docs/`](./docs/) | What | 系统说明、开发指南、API、业务与运维知识 |
| [`docs/adr/`](./docs/adr/) | Why | 长期架构决策、背景、取舍与风险 |
| [`docs/research/`](./docs/research/) | Source | 外部资料调研存档：升级指南、上游设计与规范参考 |
| [`docs/future/`](./docs/future/) | Later | 尚未决定或时机未到的计划：候选方案与触发条件 |
| [`rules/`](./rules/) | How | 编码规范、架构边界和 Agent 必须遵守的约束 |
| [`scripts/`](./scripts/) | Tools | Local Loop、构建、database seed 与 Agent 自定义工具 |

根目录 `AGENTS.md` 是 Agent 规则入口；专项规则由它引用 `rules/` 中的文档。系统文档见 [architecture](docs/architecture.md) 与 [observability](docs/observability.md)。

## 开始

```bash
pnpm install
pnpm infra:up
pnpm db:migrate
pnpm dev
```

默认地址：

- Web：<http://localhost:43110>
- Hono：<http://localhost:43111>
- Scalar：<http://localhost:43111/docs>
- OpenAPI：<http://localhost:43111/openapi.json>

`POST /api/assistant/reply`（需登录）在部署提供 `OPENAI_API_KEY` 后返回模型输出，未配置时返回 `503 SERVICE_UNAVAILABLE`；provider 调用参与 trace 关联。

`pnpm dev` 同时启动 Web 与 Hono server；PostgreSQL 由 `compose.yaml` 提供。

各应用的本地配置存放在对应目录的 `.env.local`，生产环境变量参考相邻的 `.env.example`；生产环境必须提供高熵 `BETTER_AUTH_SECRET`。

日志与 tracing 的使用说明（trace 契约、本地 trace 查看、OTLP 导出、redaction）见 [docs/observability.md](docs/observability.md)。

## 检查

```bash
pnpm test
pnpm verify
```

`pnpm install` 会通过 [lefthook](lefthook.yml) 安装 Git hooks：pre-commit 对 staged 文件跑 Biome 并跑机械门禁，pre-push 跑 typecheck 与 test。hook 是本地快速反馈，`pnpm verify` 与 CI 仍是全量门禁。

当前自动化测试覆盖 `packages/request` 的错误契约与 HTTP 客户端、`packages/tracing` 的 trace 契约不变量、`packages/logger` 的日志脱敏、`packages/observability` 的 span 投影、`apps/web` 的 analytics，以及 `apps/server` 的 HTTP 错误出口（需要 PostgreSQL，未提供 `DATABASE_URL` 时跳过）。其余成功响应分支与真实登录流程尚未建立。CI 会启动 PostgreSQL 并执行 `pnpm db:migrate`，随后运行 `pnpm verify`；其完整步骤见根目录 `package.json`。
