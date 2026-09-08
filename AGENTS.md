# Sweet Kit

Sweet Kit 是 Turborepo + pnpm workspace 组织的全栈 TypeScript 开发套件。

## 仓库知识与自动化边界

新增项目资料时按内容路由：长期架构取舍写入 `adr/`，强制工程约束写入 `rules/`，系统与使用知识写入 `docs/`，Local Loop、构建、database seed 或 Agent 自定义工具写入 `scripts/`。

## 架构约定

- `apps/*` 拥有应用入口、composition root 和应用专属业务模块。
- `packages/*` 只承载已经被多个应用或进程共同使用的能力与契约，不以潜在复用性作为拆包依据。
- `packages/ui` 负责 Tailwind CSS、shadcn/ui 组件和全局设计 token。
- 应用通过 package 的公开 exports 访问切面，不跨 package 导入内部文件。
- 优先使用维护活跃、经过生产验证的第三方成熟库；自行实现前先检查现有依赖的文档、类型定义和扩展能力。
- 修改 tracing、日志关联、错误 `traceId` 或 Agent trace 查询时，先读 `adr/0002-opentelemetry-observability.md`，保持 signal 边界、redaction 和 runtime 隔离。
- 修改 CLI auth、token 或 device authorization 时，先读 `adr/0004-cli-authentication-boundary.md`，保持第一方 session credential 的信任边界。
- 测试不得自行启动或依赖开发机的 container runtime；需要外部资源的集成验证由显式 integration environment 提供。完成代码修改后以 `pnpm verify` 为唯一全量验证入口。
- 修改 job enqueue、task handler 或 worker lifecycle 时，先读 `adr/0003-postgresql-and-graphile-worker.md`，保持 transaction、at-least-once 与 process 边界。
- 新增或修改应用 runtime 环境变量时，先读 `adr/0001-architecture-runtime-boundaries.md`，由所属应用校验并通过 composition root 显式传入 package。

## 代码设计

- 目录名承担分组与语义前缀；当目录已明确表达领域或职责时，文件名只表达目录内的具体职责，不重复目录语义。例如 `canvas-commands/generation-handlers.ts`，而非 `canvas-commands/canvas-command-generation-handlers.ts`。

## 专项规则

- **数据校验**：使用 Zod 时先读 `rules/zod-v4/README.md`，使用 v4 推荐 API，避免已废弃的 v3 模式。
- **UI 设计与组件编码（统一入口 `DESIGN.md`）**：开发时根据场景精准触发对应规则：
  - 🔄 **异步数据 / 列表 / 状态切换**：必读 `rules/ui-stability/README.md`，落实尺寸守恒（`min-h`）、空值防塌陷与按钮防抖。
  - 🪜 **浮层 / 弹窗 / 元素重叠**：必读 `rules/z-index/README.md`，严禁 arbitrary 值，局部重叠父级必须声明 `isolate`。
  - 📐 **间距 / 网格 / 格式塔秩序**：必读 `rules/ui-layout-and-loading/README.md`，落实格式塔亲密性（组间距为组内 2~3 倍）、12 栏响应式网格、零外边距（Zero Margin）与同心圆角。
  - 🎨 **色彩 / 表面明度**：必读 `rules/ui-color-and-surface/README.md`，仅消费语义 Token，越靠近用户感知明度越高。
  - 🧱 **构图与反生成式惯性**：必读 `rules/ui-design-quality/README.md`，拒绝无脑套卡片与滥用 Badge，排版与留白优先。
  - 🔤 **字体字号**：必读 `rules/font-system/README.md`，严禁 `text-[*]`，正文下限为 `text-xs`。
  - 🎞️ **交互反馈 / 进出场 / 布局转场 / 手势动画**：必读 `rules/ui-animation/README.md`，按使用频率决定动效，保持可打断并尊重减少动态效果偏好。

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
apps/server/src/auth.ts      # Server 的 Better Auth 业务模块
apps/server/src/database/    # Server 的 Drizzle client 与 schema
apps/server/drizzle/         # Application migrations
packages/jobs/               # Graphile task、payload 与 enqueue
packages/logger/             # Pino 结构化日志
packages/observability/      # OpenTelemetry tracing 与 Agent trace 查询
packages/request/            # ky HTTP client 与 API error contract
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
