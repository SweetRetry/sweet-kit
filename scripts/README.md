# Scripts

`scripts/` 是工程脚本与工具库，承载：

- 本地开发循环（Local Loop）与环境辅助工具
- 自动化构建、发布和仓库维护流程
- Database seed 与开发数据初始化
- 供 Agent 调用的自定义 MCP Server 或 CLI 工具

常用操作通过根目录 `package.json` command 暴露，CI 与开发者调用同一入口。每个工具应说明用途、调用方式、输入、输出和失败状态。

Application runtime 与业务逻辑保留在 `apps/` 或 `packages/`；正式 database schema 变更由 migration 管理。
