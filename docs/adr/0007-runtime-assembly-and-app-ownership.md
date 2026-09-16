# ADR 0007：运行时装配与应用业务模块的归属

- 状态：Accepted
- 日期：2026-09-16

## 背景

[ADR 0001](0001-architecture-runtime-boundaries.md) 规定：`apps/*` 拥有进程入口、切面装配和应用专属业务模块；`packages/*` 只承载已经存在多个应用或进程消费者的能力与契约，不以潜在复用性作为拆包依据；runtime-specific 初始化留在对应应用，不共享有副作用的初始化模块。

实现中出现两类偏离：

- `packages/observability` 导出 `startObservability()`，由 package 内部读取环境、构造并启动 NodeSDK。两个 process 各自调用它，但「装配」是应用职责，且 [ADR 0002](0002-opentelemetry-observability.md) 本身要求 SDK、exporter 和 runtime 适配在各 process 的 composition root 初始化。
- `packages/jobs`（[ADR 0003](0003-postgresql-and-graphile-worker.md) 记录的决策）把 task identifier、payload contract、handler 和 enqueue 能力放在 package 里。实际消费者只有 `apps/worker` 一个进程，enqueue 能力没有任何消费者 —— 正是 0001 禁止的「以潜在复用性拆包」。

## 决策

- **删除 `packages/jobs`。** Worker 消费的 task 定义（identifier、payload schema、handler）回到 `apps/worker`。
- **生产侧（enqueue）跟随写出业务状态与 job 的 app**，并且必须与业务写入在同一个 database transaction 中提交。当前没有任何消费者，因此不保留无人调用的占位实现；出现真实生产者时，先按 0001 判断它属于哪个 app，再决定是否需要跨 app 的契约。
- **`packages/observability` 只保留 span 投影与本地查询源**（`@workspace/observability/agent-traces`），不再导出启动函数。各 app 在自己的 `src/observability.ts` 装配 NodeSDK，并在入口显式启停。
- **传播器组合仍由 `@workspace/tracing` 提供**（`createTracePropagator()`），但调用它完成装配的是 app。
- **新增 app 需要 telemetry 时复制这段装配**，不把它重新提取为公共启动函数。

## 备选方案

- **保留 `packages/jobs` 并放宽 knip 检查**：把无人调用的导出声明为 entry 可以让门禁通过，但同时把「package 只因未来可能复用而存在」和「占位实现可以长期留着」写进配置。放弃。
- **把 enqueue 放进 `apps/worker`**：worker 只消费 job，不写出触发它的业务状态，放这里等于把生产侧挂在错误的进程上。放弃。
- **保留 `startObservability({ serviceName, localTraceFile })`**：两处调用点各约 20 行装配，看起来像重复；但 service name、环境变量来源和 exporter 选择都不同，且共享它会把「谁启动 SDK」从应用移走。放弃。

## 结果

- runtime 边界回到由 import graph 表达：app 依赖 package，package 不启动进程级资源。
- 减少一个 package 与其构建产物；`apps/worker` 不再经由 `packages/jobs` 间接依赖 drizzle-orm 与 OTel。
- 每个 app 各持一份 NodeSDK 选项（约 20 行）。这是有意的重复：它让「本进程导出什么、service 叫什么、何时 shutdown」在应用内可读。
- 风险：server 之后需要 enqueue 时会出现第二个 job 生产者。届时按 0001 判断契约应放在哪个 app，或在出现两个真实消费者后再拆 package，而不是现在预留。
