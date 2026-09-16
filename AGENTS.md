# Sweet Kit

Sweet Kit 是 Turborepo + pnpm workspace 组织的全栈 TypeScript 开发套件。

## 仓库知识与自动化边界

新增项目资料时按内容路由：长期架构取舍写入 `docs/adr/`，外部资料调研存入 `docs/research/`，未定型的计划写入 `docs/future/`，强制工程约束写入 `rules/`，系统与使用知识写入 `docs/`，Local Loop、构建、database seed 或 Agent 自定义工具写入 `scripts/`。新增或修改 `rules/` 下的规则时先读 `rules/README.md`（准入条件、自动化门禁边界与目录约定）。

## 架构约定

- `apps/*` 拥有应用入口、composition root 和应用专属业务模块。
- `packages/*` 只承载已经被多个应用或进程共同使用的能力与契约，不以潜在复用性作为拆包依据。
- `packages/ui` 负责 Tailwind CSS、shadcn/ui 组件和全局设计 token，并拥有组件**自身的外观**：高度、padding、圆角、颜色与字体由变体（`variant` / `size`）决定。调用方只用布局类（`margin`、宽度、flex/grid 位置）和 props 控制，不在调用点用 `className` 覆盖。
- `packages/ui/src/components/**` 是上游 shadcn/ui 实现，**字节冻结（F1）**：文件内容不得偏离基线，基线见 `packages/ui/frozen.manifest.json`，`pnpm ui:freeze` 检入 `rules:check`。基线的含义是「上次被显式接受的状态」，不等于上游最新版本——上游是否已变由升级时的 `shadcn diff` 回答，两件事不要混。改动必须经 `pnpm ui:freeze:update` 显式接受并单独提交，说明是上游升级还是记录在案的解冻。主题与 token（`src/styles/globals.css`）不在冻结范围，它本就是本地设计决策的载体。
- 新形态的落点按复用面划：`packages/*` 只承载已被多个应用共同使用的能力，变体与 recipe 同理——多个应用共同需要的形态进组件变体（一次显式解冻），单一应用的方言进 recipe（`packages/ui/src/recipes`）或应用内组件。
- 应用通过 package 的公开 exports 访问切面，不跨 package 导入内部文件。
- 优先使用维护活跃、经过生产验证的第三方成熟库；自行实现前先检查现有依赖的文档、类型定义和扩展能力。
- 环境变量：新增或修改应用 runtime 环境变量时，先读 `docs/adr/0001-architecture-runtime-boundaries.md`，由所属应用校验并通过 composition root 显式传入 package。
- Tracing 与诊断关联：修改 tracing、日志关联、错误 `traceId` 或 Agent trace 查询时，先读 `docs/adr/0002-opentelemetry-observability.md`，保持 signal 边界、redaction 和 runtime 隔离。
- 后台任务与一致性：修改 job enqueue、task handler 或 worker lifecycle 时，先读 `docs/adr/0003-postgresql-and-graphile-worker.md`，保持 transaction、at-least-once 与 process 边界。
- CLI 认证边界：修改 CLI auth、token 或 device authorization 时，先读 `docs/adr/0004-cli-authentication-boundary.md`，保持第一方 session credential 的信任边界。
- HTTP API 形态：引入 API 版本前缀、调整 REST 严格度或做无法兼容的 API 变更时，先读 `docs/adr/0005-http-api-shape.md`，保持资源路径、方法取舍与兼容演进策略。
- 测试集成环境：测试不得自行启动或依赖开发机的 container runtime；需要外部资源的集成验证由显式 integration environment 提供。

## 代码设计

- 目录名承担分组与语义前缀；当目录已明确表达领域或职责时，文件名只表达目录内的具体职责，不重复目录语义。例如 `canvas-commands/generation-handlers.ts`，而非 `canvas-commands/canvas-command-generation-handlers.ts`。

## 专项规则

- **数据校验**：使用 Zod 时先读 `rules/zod-v4/README.md`，使用 v4 推荐 API，避免已废弃的 v3 模式；完成变更后运行 `pnpm zod:check` 验证。
- **UI 设计与组件编码**：涉及前端 UI（界面、布局、动效、组件）时，先读 [DESIGN.md](DESIGN.md) 按 Leading Word 路由到 `rules/web-design/` 下的专项规则。
- **设计契约执法**：className 层的约束由 `.oxlintrc.json`（`@shadcn/lint`）机械执法，`pnpm design:check` 已检入 `rules:check`。其中 `no-restyle` 只约束从 `@workspace/ui/components` 导入的组件，其余五条作用于全部 className；`packages/ui/src/components/**` 整体排除（上游冻结，见上条）。新增这一层约束时扩展该配置，不再另写正则扫描。
- **API 契约**：新增或修改 HTTP 错误响应、`ErrorCode` 或 OpenAPI 描述时，先读 `rules/api-contract.md`；错误层遵循 RFC 9457，契约不变量由 `packages/request` 的测试守护。

## 技术选型

- 前端客户端状态管理统一使用 zustand，不引入其他 store 方案。
- 前端动画统一使用 motion（非 framer-motion），不引入其他动画库。
- 表单使用 react-hook-form + zod + @hookform/resolvers，配合 shadcn/ui Form 组件实现。
- Toast / 通知统一使用 sonner，不引入其他 toast 方案。
- 图标统一使用 lucide-react（shadcn/ui 附带），安装在 packages/ui。
- 日期处理统一使用 dayjs。

## 模块结构

```text
apps/web/                    # Next.js App Router 前端
apps/server/                 # Hono server、OpenAPI 与 Scalar 文档
apps/worker/                 # Graphile Worker 进程
apps/cli/                    # Commander CLI 与 device authorization
apps/server/src/auth.ts      # Server 的 Better Auth 业务模块
apps/server/src/database/    # Server 的 Drizzle client 与 schema
packages/jobs/               # Graphile task、payload 与 enqueue
packages/logger/             # Pino 结构化日志
packages/observability/      # OpenTelemetry tracing 与 Agent trace 查询
packages/request/            # ky HTTP client 与 API error contract
packages/typescript-config/  # 共享 tsconfig 预设：base / nextjs / react-library
packages/ui/                 # Tailwind CSS v4 + shadcn/ui
```

## 开发与验证门禁

- 代码使用 Biome 格式化，采用 2 空格缩进、双引号、无分号。
- 完成代码修改后以 `pnpm verify` 为唯一全量验证入口（串联 Biome、rules:check、typecheck、test、build、knip 等）。常见日常命令参见根目录 `package.json`。
