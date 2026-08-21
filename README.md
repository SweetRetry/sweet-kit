# Sweet Kit

基于 TypeScript 的全栈开发套件，使用 Turborepo 按架构切面组织 Web、server 和 CLI。

## 技术基线

- Web：Next.js App Router、React 19、Tailwind CSS v4、shadcn/ui
- Request：ky、TanStack Query
- Server：Hono、OpenAPI 3.1、Scalar
- Auth：Better Auth、device authorization、Bearer session
- Database：Drizzle ORM、SQLite、better-sqlite3
- Logging：Pino、hono-pino、request ID、敏感字段 redaction
- Observability：OpenTelemetry、trace/log correlation、Agent trace lookup
- CLI：Commander

技术决策记录在 [`adr/`](./adr/)，`rules/` 预留后续规则文档。

## 开始

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

默认地址：

- Web：<http://localhost:3000>
- Hono：<http://localhost:3001>
- Scalar：<http://localhost:3001/docs>
- OpenAPI：<http://localhost:3001/openapi.json>

生产环境变量参考 [`.env.example`](./.env.example)。本地开发可以直接使用内置 localhost 配置；生产环境必须提供高熵 `BETTER_AUTH_SECRET`。

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

Better Auth schema 由 Better Auth CLI 生成，SQL migration 由 Drizzle Kit 管理：

```bash
pnpm db:generate
pnpm db:migrate
```

## 检查

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm knip
pnpm peers check
```
