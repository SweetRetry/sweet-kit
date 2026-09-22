# 设计规则入口

编写、修改或评审 UI 时，按本次改动**实际触及的内容**查规则，不按需求名称判断。同一个需求常同时命中多行，命中即读。

| 改动中出现                            | 规则                                                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 新增容器、分组、注意力与权重（6:3:1） | [构图与信息层级](rules/web-design/design-quality.md)                                                       |
| 间距、内边距、栅格、对齐              | [布局与间距](rules/web-design/layout-and-loading.md)、[构图与信息层级](rules/web-design/design-quality.md) |
| 数字、时间、金额、计数                | [字体与字号](rules/web-design/font-system.md)、[布局与间距](rules/web-design/layout-and-loading.md)        |
| 字号、字体族、字重、排版字阶比重      | [字体与字号](rules/web-design/font-system.md)、[构图与信息层级](rules/web-design/design-quality.md)        |
| 圆角、嵌套容器                        | [圆角](rules/web-design/radius.md)                                                                         |
| 层级、浮层、Portal、遮挡              | [层叠](rules/web-design/z-index.md)                                                                        |
| 加载、空结果、失败、内容溢出          | [尺寸稳定](rules/web-design/stability.md)                                                                  |
| 颜色、表面、主题、色彩配比（6:3:1）   | [色彩与表面](rules/web-design/color-and-surface.md)、[构图与信息层级](rules/web-design/design-quality.md)  |
| 过渡、动画、交互反馈                  | [动效](rules/web-design/animation.md)                                                                      |
| 操作反馈形态、toast、inline 错误      | [反馈与通知](rules/web-design/feedback-and-notification.md)                                                |

规则适用于应用与新增业务组件；组件外观归属和上游冻结边界遵循 [AGENTS.md](AGENTS.md)。`packages/ui` 与 `globals.css` 的改动必须 **HITL（人工在环确认）**，避免不知不觉修改元组件或污染全局。
静态门禁与规则维护原则见 [rules/README.md](rules/README.md)；UI 检查配置在 `.oxlintrc.json`。
