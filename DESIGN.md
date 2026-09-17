# 设计规则入口

编写、修改或评审 UI 时，只读当前任务涉及的专项规则。

| 任务 | 规则 |
| --- | --- |
| 构图、信息层级与密度 | [构图与信息层级](rules/web-design/design-quality.md) |
| 间距、分组与响应式布局 | [布局与间距](rules/web-design/layout-and-loading.md) |
| 异步加载、空状态与内容溢出 | [尺寸稳定](rules/web-design/stability.md) |
| 色彩、主题与表面层级 | [色彩与表面](rules/web-design/color-and-surface.md) |
| 字号与字体 | [字体与字号](rules/web-design/font-system.md) |
| 圆角与嵌套容器 | [圆角](rules/web-design/radius.md) |
| 浮层与遮挡 | [层叠](rules/web-design/z-index.md) |
| 交互反馈与转场 | [动效](rules/web-design/animation.md) |
| 字段取舍、文案与操作提示 | [信息呈现与文案](rules/web-design/information-clarity.md) |

规则适用于应用与新增业务组件；组件外观归属和上游冻结边界遵循 [AGENTS.md](AGENTS.md)。`packages/ui` 与 `globals.css` 的改动必须 **HITL（人工在环确认）**，避免不知不觉修改元组件或污染全局。
静态门禁与规则维护原则见 [rules/README.md](rules/README.md)；UI 检查配置在 `.oxlintrc.json`。
