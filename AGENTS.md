# Sweet Kit

Sweet Kit 是 Turborepo + pnpm workspace 组织的全栈 TypeScript 开发套件。

## 仓库知识与自动化边界

新增项目资料时按内容路由：长期架构取舍写入 `adr/`，强制工程约束写入 `rules/`，系统与使用知识写入 `docs/`，Local Loop、构建、database seed 或 Agent 自定义工具写入 `scripts/`。

## 架构约定

- `apps/*` 是应用入口和 composition root。
- `packages/*` 按架构切面划分，不以潜在复用性作为拆包依据。
- `packages/ui` 负责 Tailwind CSS、shadcn/ui 组件和全局设计 token。
- 应用通过 package 的公开 exports 访问切面，不跨 package 导入内部文件。
- 新增抽象前先用完整纵切验证当前需求。
- 优先使用维护活跃、经过生产验证的第三方成熟库；自行实现前先检查现有依赖的文档、类型定义和扩展能力。
- 修改 tracing、日志关联、错误 `traceId` 或 Agent trace 查询时，先读 `adr/0002-opentelemetry-observability.md`，保持 signal 边界、redaction 和 runtime 隔离。
- 修改 CLI auth、token 或 device authorization 时，先读 `adr/0004-cli-authentication-boundary.md`，保持第一方 session credential 的信任边界。
- 修改 server route、auth 或 database schema 时，使用 `createServerFixture` 运行真实 migration 的 Hono 集成测试；完成代码修改后以 `pnpm verify` 为唯一全量验证入口。
- 修改 job enqueue、task handler 或 worker lifecycle 时，先读 `adr/0003-postgresql-and-graphile-worker.md`，保持 transaction、at-least-once 与 process 边界。
- 新增或修改应用 runtime 环境变量时，先读 `adr/0001-architecture-runtime-boundaries.md`，由所属应用校验并通过 composition root 显式传入 package。

## 专项规则

- 使用 Zod schema 校验时，先读 `rules/zod-v4/README.md`，使用 v4 推荐 API，避免已废弃的 v3 模式。
- 设计或修改 UI 时，先读 `DESIGN.md`，遵循其中引用的字体、布局与色彩规则。

## 技术选型

- 前端客户端状态管理统一使用 zustand，不引入其他 store 方案。
- 前端动画统一使用 motion（非 framer-motion），不引入其他动画库。
- 表单使用 react-hook-form + zod + @hookform/resolvers，配合 shadcn/ui Form 组件实现。
- Toast / 通知统一使用 sonner，不引入其他 toast 方案。
- 图标统一使用 lucide-react（shadcn/ui 附带），安装在 packages/ui。
- 日期处理统一使用 dayjs。

## 当前结构

```text
apps/web/                    # Next.js App Router frontend
apps/server/                 # Hono server、OpenAPI 与 Scalar
apps/worker/                 # Graphile Worker process
apps/cli/                    # Commander CLI 与 device authorization
packages/auth/               # Better Auth 切面
packages/database/           # Drizzle ORM 与 schema
packages/jobs/               # Graphile task、payload 与 enqueue
packages/logger/             # Pino 结构化日志
packages/observability/      # OpenTelemetry tracing 与 Agent trace 查询
packages/request/            # ky 与 TanStack Query request 切面
packages/ui/                 # Tailwind CSS v4 + shadcn/ui
packages/typescript-config/  # TypeScript 配置
```

## 命令

```bash
pnpm dev
pnpm infra:up
pnpm infra:down
pnpm cli --help
pnpm build
pnpm lint
pnpm lint:fix
pnpm typecheck
pnpm test
pnpm verify
pnpm db:generate
pnpm db:migrate
pnpm knip
```

代码使用 Biome 格式化，采用 2 空格缩进、双引号、无分号。
