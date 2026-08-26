# Sweet Kit

基于 TypeScript 的全栈开发套件，使用 Turborepo 按架构切面组织 Web、server 和 CLI。

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
- Test：Vitest、Hono `app.request()`、Testcontainers PostgreSQL

## 仓库知识与自动化

| 目录 | 关注点 | 内容 |
| --- | --- | --- |
| [`adr/`](./adr/) | Why | 长期架构决策、背景、取舍与风险 |
| [`rules/`](./rules/) | How | 编码规范、架构边界和 Agent 必须遵守的约束 |
| [`docs/`](./docs/) | What | 系统说明、开发指南、API、业务与运维知识 |
| [`scripts/`](./scripts/) | Tools | Local Loop、构建、database seed 与 Agent 自定义工具 |

根目录 `AGENTS.md` 是 Agent 规则入口；专项规则由它引用 `rules/` 中的文档。

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

日志默认以 JSON 写入 stdout。使用 `LOG_LEVEL` 控制级别；本地需要可读输出时设置 `LOG_PRETTY=true`。

## Observability

Hono response 会返回 `x-trace-id`，未处理异常的 500 JSON body 同时包含 `traceId`。Pino request log 自动包含同一组 `traceId`、`spanId` 和 `traceFlags`。

本地未设置 `OTEL_TRACES_EXPORTER` 时，span 默认写入 `apps/server/data/traces.jsonl`。可以从 response header 或错误 body 取得 `traceId` 后查询：

```bash
pnpm cli trace <traceId>
pnpm cli trace <traceId> --json
```

`--json` 用于 Coding Agent 获取完整 span projection；`--file <path>` 可以指定其他 JSONL 文件。设置 `OTEL_TRACES_EXPORTER=console` 可改用 console exporter。

生产使用标准 OTel 环境变量发送 OTLP：

```bash
NODE_ENV=production \
OTEL_SERVICE_NAME=sweet-kit-server \
OTEL_TRACES_EXPORTER=otlp \
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf \
OTEL_EXPORTER_OTLP_ENDPOINT=https://collector.example.com \
pnpm --filter server start
```

`OTEL_EXPORTER_OTLP_ENDPOINT` 是 base endpoint，不附加 `/v1/traces`。Pino stdout 继续负责 logs；当前设置 `OTEL_LOGS_EXPORTER=none`，避免重复日志 pipeline。

## CLI

```bash
pnpm cli login
pnpm cli whoami
pnpm cli logout
pnpm cli trace <traceId> [--json]
```

`login` 会启动 Better Auth device authorization，在浏览器中完成登录和明确授权后，将 session token 写入用户配置目录，文件权限为 `0600`。

## Database

业务表和 Better Auth 表由 Drizzle migration 管理。Graphile Worker 在独立的 `graphile_worker` schema 中维护自身对象：

```bash
pnpm db:generate
pnpm db:migrate
```

业务状态与 job 需要原子写入时，在同一个 Drizzle transaction 中执行 `packages/jobs` 提供的 enqueue SQL。

## 检查

```bash
pnpm test
pnpm verify
```

server 集成测试使用 Testcontainers 启动临时 PostgreSQL，执行正式 Drizzle 与 Graphile Worker migration，并通过 Hono `app.request()` 覆盖 OpenAPI、middleware、Better Auth Bearer session、device authorization 和 job execution。`pnpm verify` 依次执行 lint、typecheck、test、build、Knip 和 peer dependency 检查。
