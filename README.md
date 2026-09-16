# Sweet Kit

基于 TypeScript 的全栈开发套件，使用 Turborepo 按架构切面组织 Web、server、worker 和 CLI。

## 技术基线

- Web：Next.js App Router、React 19、Tailwind CSS v4、shadcn/ui
- Request：ky、TanStack Query
- Server：Hono、OpenAPI 3.1、Scalar
- Auth：Better Auth、device authorization、Bearer session
- Database：PostgreSQL、Drizzle ORM、node-postgres
- Jobs：Graphile Worker、transactional enqueue、独立 worker process
- Logging：Pino、hono-pino、request ID、敏感字段 redaction
- Observability：OpenTelemetry、trace/log correlation、Agent trace lookup
- CLI：Commander
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

根目录 `AGENTS.md` 是 Agent 规则入口；专项规则由它引用 `rules/` 中的文档。系统文档见 [architecture](docs/architecture.md)、[observability](docs/observability.md)、[database](docs/database.md)。

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

`pnpm dev` 同时启动 Web、Hono server 和 Graphile Worker；PostgreSQL 由 `compose.yaml` 提供。

各应用的本地配置存放在对应目录的 `.env.local`，生产环境变量参考相邻的 `.env.example`；生产环境必须提供高熵 `BETTER_AUTH_SECRET`。

日志与 tracing 的使用说明（trace 契约、本地 trace 查询、OTLP 导出、redaction）见 [docs/observability.md](docs/observability.md)；数据库与后台任务见 [docs/database.md](docs/database.md)。

## CLI

```bash
pnpm cli login
pnpm cli whoami
pnpm cli logout
pnpm cli trace <traceId> [--json]
```

`login` 会启动 Better Auth device authorization，在浏览器中完成登录和明确授权后，将 session token 写入 `$XDG_CONFIG_HOME/sweet-kit/credentials.json`（默认 `~/.config/sweet-kit/`），文件权限 `0600`。`SWEET_KIT_SERVER_URL` 必填，`SWEET_KIT_CONFIG_DIR` 与 `SWEET_KIT_TRACE_FILE` 可覆盖默认位置。信任边界见 [docs/adr/0004](docs/adr/0004-cli-authentication-boundary.md)。

## 检查

```bash
pnpm test
pnpm verify
```

当前自动化测试覆盖 `packages/request` 的错误契约与 HTTP 客户端、`packages/tracing` 的 trace 契约不变量，以及 `apps/web` 的 analytics。`apps/server` 的集成测试尚未建立，计划见 [docs/future/server-integration-tests.md](docs/future/server-integration-tests.md)。CI 会启动 PostgreSQL 并执行 `pnpm db:migrate`，随后运行 `pnpm verify`；其完整步骤见根目录 `package.json`。
