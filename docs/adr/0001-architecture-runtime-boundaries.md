# ADR 0001：架构切面与 runtime 边界

- 状态：Accepted
- 日期：2026-08-21

## 背景

Sweet Kit 同时包含 browser 与 server。它们共享部分能力，但具有不同的部署周期、secret 可见性和进程生命周期。如果按潜在复用性拆包，业务装配、runtime 初始化和跨环境配置容易混入公共 package，边界会随功能增长而失效。

## 决策

- `apps/*` 拥有进程入口、部署适配、切面装配和应用专属业务模块。Server 独占的 auth、database schema 与 application migration 由 `apps/server` 所有。
- `packages/*` 只承载已经存在多个应用或进程消费者的能力与契约，不以潜在复用性作为拆包依据。代码在出现真实的跨边界消费者前留在所属应用。
- 应用只能通过 package 的公开 exports 使用切面，不跨 package 导入内部文件。
- runtime-specific 初始化留在对应应用入口，不在不同 Node.js process 或 browser 之间共享有副作用的初始化模块。
- 应用的 runtime 环境配置由所属应用读取和校验，并在 composition root 显式传给 package；公共 package 不维护跨 runtime 的配置聚合。
- 本地开发通过 package 的 `development` export 直接消费 TypeScript source，由应用自身的 watcher 编译；发布构建仍使用 package 的 compiled default export。
- 新增抽象前先用完整纵切验证需求；优先使用现有依赖和成熟第三方库的公开扩展能力。

## 结果

- 应用可以独立运行和部署，package 表达真实的共享边界，应用专属修改不触发独立 package build。
- runtime 和 secret 边界由应用所有权和 import graph 表达，可通过静态检查持续验证。
- 跨切面行为在 composition root 显式组装，不由公共模块隐式启动。
