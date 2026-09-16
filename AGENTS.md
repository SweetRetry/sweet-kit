# Sweet Kit

Sweet Kit 是 Turborepo + pnpm workspace 组织的全栈 TypeScript 开发套件。

## 资料落点

按内容路由：长期架构取舍 → `docs/adr/`；外部资料调研 → `docs/research/`；未定型的计划 → `docs/future/`；系统与使用知识 → `docs/`；强制工程约束 → `rules/`；Local Loop、构建、database seed 与 Agent 自定义工具 → `scripts/`。新增或修改 `rules/` 下的规则前先读 `rules/README.md`。

## 架构约定

- `apps/*` 拥有应用入口、composition root 和应用专属业务模块；`packages/*` 只承载已被多个应用或进程共同使用的能力与契约，不以潜在复用性作为拆包依据。跨 package 只走公开 exports，不导入内部文件。
- `packages/ui` 拥有组件**自身的外观**：高度、padding、圆角、颜色与字体由变体（`variant` / `size`）决定；调用方只用布局类（`margin`、宽度、flex/grid 位置）与 props 控制。
- 新形态按复用面落点：多个应用共同需要的进组件变体（一次显式解冻），单一应用的方言进 recipe（`packages/ui/src/recipes`）或应用内组件。
- `packages/ui/src/components/**` 是上游 shadcn/ui 实现，**字节冻结（F1）**：基线见 `packages/ui/frozen.manifest.json`，`pnpm ui:freeze` 已检入 `rules:check`。基线是「上次被显式接受的状态」，不等于上游最新——上游是否已变由升级时的 `shadcn diff` 回答。改动经 `pnpm ui:freeze:update` 显式接受并单独提交，说明是上游升级还是记录在案的解冻；`src/styles/globals.css` 的主题与 token 是本地设计决策，不在冻结范围。
- 自行实现前先查现有依赖的文档、类型定义与扩展能力，优先维护活跃、经过生产验证的成熟库。
- 测试不得自行启动或依赖开发机的 container runtime；需要外部资源的集成验证由显式 integration environment 提供。
- 目录名承担分组与语义前缀；目录已表达领域或职责时，文件名只表达目录内的具体职责：`canvas-commands/generation-handlers.ts`，而非 `canvas-commands/canvas-command-generation-handlers.ts`。

当前 `apps/*` 与 `packages/*` 的职责与依赖方向见 [docs/architecture.md](docs/architecture.md)。

改动以下范围前先读对应 ADR：

| 范围 | ADR |
| :--- | :--- |
| 应用 runtime 环境变量 | [0001 架构与 runtime 边界](docs/adr/0001-architecture-runtime-boundaries.md) |
| tracing、日志关联与 Agent trace 查询 | [0002 OpenTelemetry 可观测性](docs/adr/0002-opentelemetry-observability.md)、[0006 trace 契约与暴露出口](docs/adr/0006-trace-context-contract.md) |
| job handler、worker lifecycle、运行时装配归属 | [0003 PostgreSQL 与 Graphile Worker](docs/adr/0003-postgresql-and-graphile-worker.md)、[0007 运行时装配与应用业务模块的归属](docs/adr/0007-runtime-assembly-and-app-ownership.md) |
| CLI auth、token、device authorization | [0004 CLI 认证边界](docs/adr/0004-cli-authentication-boundary.md) |
| API 版本前缀、REST 严格度、不兼容的 API 变更 | [0005 HTTP API 形态](docs/adr/0005-http-api-shape.md) |

## 专项规则

| 触发 | 先读 |
| :--- | :--- |
| 使用 Zod、改动数据校验 | `rules/zod-v4/README.md` |
| 前端 UI：界面、布局、动效、组件 | [DESIGN.md](DESIGN.md) |
| HTTP 错误响应、`ErrorCode`、OpenAPI 描述 | `rules/api-contract.md`（RFC 9457，不变量由 `packages/request` 测试守护） |

## 技术选型

各项保持单一方案，不引入替代库：

- 客户端状态 zustand；通知 sonner。
- 动画 motion（`motion/react`）或 Tailwind CSS 过渡。
- 表单 react-hook-form + zod + @hookform/resolvers，配 shadcn/ui Form 组件。
- 图标 lucide-react（shadcn/ui 附带，安装在 `packages/ui`）。
- 日期 dayjs。

## 验证门禁

- 完成代码修改后以 `pnpm verify` 为唯一全量验证入口（串联 Biome、rules:check、typecheck、test、build、knip）；日常命令见根目录 `package.json`。
- Git hooks 由根目录 `lefthook.yml` 管理，`pnpm install` 时自动安装：pre-commit 对 staged 文件跑 Biome（并重新入 stage）加 `rules:check`，pre-push 跑 typecheck 与 test。hook 只是 `pnpm verify` 的前置子集，不替代 CI；绕开用 `git commit --no-verify` 或 `LEFTHOOK=0`。
