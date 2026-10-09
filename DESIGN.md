# 设计规则入口

编写、修改或评审 UI 时，按本次改动**实际触及的内容**查规则，不按需求名称判断。同一个需求常同时命中多行，命中即读。

| 改动中出现 | 规则 |
| :--- | :--- |
| 新增容器、分组结构、注意力与权重（6:3:1）、字段过多、折叠与浮层选型 | [信息层级与收纳](rules/web-design/hierarchy.md) |
| 留白、间距、内边距、内容最大宽度、12 栏栅格、轴线对齐 | [布局与间距](rules/web-design/layout.md) |
| 异步加载防跳动、Card 网格等高沉底、空结果、表单报错推挤、文本溢出穿孔 | [尺寸稳定](rules/web-design/stability.md) |
| 颜色、表面高度（E0–E3）、暗色主题、圆角同心、Z 轴层叠与 Portal 穿透 | [色彩、表面与层叠](rules/web-design/surface.md) |
| 字号、字体族、字重、排版字阶比重、数字金额与计数对齐（`tabular-nums`） | [排版与字体](rules/web-design/typography.md) |
| 过渡动效、按压反馈（scale-95）、Toast、字段级 inline 报错、提交等待态 | [交互反馈与动效](rules/web-design/interaction.md) |

规则适用于应用与新增业务组件；组件外观归属和上游冻结边界遵循 [AGENTS.md](AGENTS.md)。`packages/ui` 与 `globals.css` 的改动必须 **HITL（人工在环确认）**，避免不知不觉修改元组件或污染全局。
静态门禁与规则维护原则见 [rules/README.md](rules/README.md)；UI 检查配置在 `.oxlintrc.json`。
