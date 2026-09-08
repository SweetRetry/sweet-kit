# Design 规范路由器

本文件是 Sweet Kit 的设计与 UI 工程规范入口。编写、修改或审查 UI 组件时，必须按具体操作场景查阅对应专项规则：

| 任务场景 | 专项规则 | 核心心智与不可触犯的铁律 |
| :--- | :--- | :--- |
| **异步加载、空状态、表单反馈** | [UI Stability](rules/ui-stability/README.md) | **尺寸守恒**：禁止高度突变与塌陷；必须有 `min-h`、aspect-ratio 与空兜底，按钮防抖。 |
| **下拉菜单、弹窗、层叠把手** | [Z-Index System](rules/z-index/README.md) | **局部隔离**：严禁任意值 `z-[*]`；局部层叠父级必加 `isolate`；全局浮层必须 Portal。 |
| **组件封装、间距、网格与格式塔** | [UI Layout & Grid](rules/ui-layout-and-loading/README.md) | **秩序与网格**：组件对外 margin 为 0；格式塔亲密性（组间距为组内 2~3 倍）；12 栏响应式网格；同心圆角。 |
| **新页面排版、卡片构图** | [UI Design Quality](rules/ui-design-quality/README.md) | **拒绝套路**：拒绝无脑包裹卡片与无意义装饰；单一视觉焦点，留白与排版优先。 |
| **主题切换、背景与表面明度** | [UI Color & Surface](rules/ui-color-and-surface/README.md) | **高度递亮**：组件只消费语义 Token，越靠近用户的表面感知明度越高。 |
| **字体字号设置** | [Font System](rules/font-system/README.md) | **字号阶梯**：严禁 `text-[*]`；文本字号严格下限为 `text-xs` (12px)。 |
| **交互反馈、进出场、布局转场、手势动画** | [UI Animation](rules/ui-animation/README.md) | **克制与可打断**：高频操作 0ms，常规过渡 ≤200ms；严禁 scale(0) 与 transition-all；仅动 transform/opacity。 |
