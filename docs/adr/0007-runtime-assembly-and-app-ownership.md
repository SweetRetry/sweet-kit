# ADR 0007：运行时装配与应用业务模块的归属

- 状态：Accepted
- 日期：2026-09-16

## 背景

[ADR 0001](0001-architecture-runtime-boundaries.md) 规定：`apps/*` 拥有进程入口、切面装配和应用专属业务模块；`packages/*` 只承载已经存在多个应用或进程消费者的能力与契约，不以潜在复用性作为拆包依据；runtime-specific 初始化留在对应应用，不共享有副作用的初始化模块。

实现中出现偏离：

- `packages/observability` 导出 `startObservability()`，由 package 内部读取环境、构造并启动 NodeSDK。应用调用它，但「装配」是应用职责，且 [ADR 0002](0002-opentelemetry-observability.md) 本身要求 SDK、exporter 和 runtime 适配在各 process 的 composition root 初始化。

## 决策

- **`packages/observability` 只保留 span 投影与本地出口**（`@workspace/observability/agent-traces`），不再导出启动函数。app 在自己的 `src/observability.ts` 装配 NodeSDK，并在入口显式启停。
- **传播器组合仍由 `@workspace/tracing` 提供**（`createTracePropagator()`），但调用它完成装配的是 app。
- **新增 app 需要 telemetry 时复制这段装配**，不把它重新提取为公共启动函数。

## 备选方案

- **保留 `startObservability({ serviceName, localTraceFile })`**：调用点各约 20 行装配，看起来像重复；但 service name、环境变量来源和 exporter 选择都不同，且共享它会把「谁启动 SDK」从应用移走。放弃。

## 结果

- runtime 边界回到由 import graph 表达：app 依赖 package，package 不启动进程级资源。
- 每个 app 各持一份 NodeSDK 选项（约 20 行）。这是有意的重复：它让「本进程导出什么、service 叫什么、何时 shutdown」在应用内可读。
