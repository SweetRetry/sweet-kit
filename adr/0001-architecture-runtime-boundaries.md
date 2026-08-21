# ADR 0001：架构切面与 runtime 边界

- 状态：Accepted
- 日期：2026-08-21

## 背景

Sweet Kit 同时包含 browser、server、worker 和 CLI。它们共享部分能力，但具有不同的部署周期、secret 可见性和进程生命周期。如果按潜在复用性拆包，业务装配、runtime 初始化和跨环境配置容易混入公共 package，边界会随功能增长而失效。

## 决策

- `apps/*` 只承担进程入口、部署适配和切面装配。
- `packages/*` 按 auth、database、env、jobs、logger、observability、request、UI 等架构切面划分，不以潜在复用性作为拆包依据。
- 应用只能通过 package 的公开 exports 使用切面，不跨 package 导入内部文件。
- runtime-specific 初始化留在对应应用入口，不在不同 Node.js process 或 browser 之间共享有副作用的初始化模块。
- 环境配置由 `packages/env` 统一校验，并按 runtime 提供独立 exports。browser export 不得包含 server secret 或 database 配置。
- 新增抽象前先用完整纵切验证需求；优先使用现有依赖和成熟第三方库的公开扩展能力。

## 结果

- 应用可以独立运行和部署，package 保持单一架构职责。
- runtime 和 secret 边界由 import graph 表达，可通过静态检查持续验证。
- 跨切面行为在 composition root 显式组装，不由公共模块隐式启动。
