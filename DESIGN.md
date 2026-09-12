# Design 规范路由器

本文件是 Sweet Kit 的设计工程与 UI 规范唯一入口。编写、修改或审查前端组件与页面时，按 **Leading Word** 定位分支，再读对应专项规则：

| Leading Word | 触发（何时查阅） | 专项规则 | 契约（正向目标） |
| :--- | :--- | :--- | :--- |
| **尺寸守恒** | 异步加载、骨架占位、空值或超长数据、按钮提交中 | [UI Stability](rules/ui-stability/README.md) | 体量在 Loading → Ready → Empty → Error 全程不变 |
| **隔离** | 层叠遮挡、浮层挂载、局部重叠（Tab / Focus 环 / 头像堆叠） | [Z-Index System](rules/z-index/README.md) | 局部重叠关在自己的层叠上下文里，全局浮层走 Portal |
| **同心** | 圆角取值、嵌套边角、胶囊与矩形形态决断 | [UI Radius](rules/ui-radius/README.md) | 内外圆角共享一个圆心，间隙含 border |
| **亲密性** | 间距、外边距、网格秩序、分组归属 | [UI Layout & Grid](rules/ui-layout-and-loading/README.md) | 组间距 ≥ 2× 组内间距，间隔由父容器统一给 |
| **移植测试** | 构图、信息密度、去模板化、列表与指标呈现 | [UI Design Quality](rules/ui-design-quality/README.md) | 换掉文案就失去意义的构图才算通过 |
| **职责** | 主题色、表面抬升、状态与语义色 | [UI Color & Surface](rules/ui-color-and-surface/README.md) | 每个非中性色说得出来职责；暗色递亮、亮色只做分隔 |
| **阶梯** | 字号、排版层级 | [Font System](rules/font-system/README.md) | 字号只取标准阶梯，正文下限 `text-xs` |
| **频率** | 交互动效、手势、转场、进出场 | [UI Animation](rules/ui-animation/README.md) | 高频即时呈现，中低频强 ease-out，随时可打断 |

数据校验规则见 [Zod v4](rules/zod-v4/README.md)。静态门禁：`pnpm ui:check`（任意值、transition-all）、`pnpm font:check`（字号）、`pnpm zod:check`（废弃 API），或直接 `pnpm rules:check`。
