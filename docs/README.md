# Docs

`docs/` 回答“这是什么”和“怎么用”，是面向开发者和 Agent 的系统知识库。

适合记录：

- 本地开发、部署、运维和故障排查指南
- API、业务流程、数据模型和系统交互说明
- 需要跨多个源码模块理解的功能文档

## 结构

```text
docs/
  architecture.md   # 系统结构：应用与 package 的职责、数据与 migration、边界与 composition root
  observability.md  # 日志、trace 契约、本地 trace 查询、OTLP 导出与 redaction
  branding.md       # 品牌接入：中性基底的落点、品牌色与字体的注入、边界
  adr/              # 长期架构决策：背景、取舍与风险
  research/         # 外部资料调研存档：升级指南、上游设计与规范参考
  future/           # 尚未决定或时机未到的计划：候选方案与触发条件
```

本文件只描述 `docs/` 自身的结构与边界；跨目录的资料路由见 [AGENTS.md](../AGENTS.md)。
