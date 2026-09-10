# Design 规范路由器

本文件是 Sweet Kit 的设计工程与 UI 规范唯一入口。编写、修改或审查前端组件与页面时，按具体分支查阅对应专项规则：

| 触发分支 (Leading Words) | 专项规则 | 核心心智契约 (Positive Principles) |
| :--- | :--- | :--- |
| **异步加载、骨架占位、防塌陷、按钮防抖** | [UI Stability](rules/ui-stability/README.md) | **尺寸守恒 (Conservation of Dimensions)**：锁定容器体量，`min-h-*` / aspect-ratio 兜底，禁用裸奔 Loader。 |
| **浮层、弹窗、下拉气泡、层叠把手** | [Z-Index System](rules/z-index/README.md) | **局部隔离与 Portal**：局部重叠必须父级 `isolate`；全局浮层一律 Portal 挂载；严禁 `z-[*]` 任意值。 |
| **圆角弧度、同心圆角、胶囊药丸、嵌套边角** | [UI Radius](rules/ui-radius/README.md) | **相对圆角与同心几何**：圆角随体量定级；$R_{inner} = \max(0, R_{outer} - \text{Gap})$（Border 计入 Gap）；按钮拒绝中庸陷阱；公式为基准、光学平衡微调。 |
| **间距、外边距、网格秩序、亲密排版** | [UI Layout & Grid](rules/ui-layout-and-loading/README.md) | **零外边距与几何秩序**：组件 Zero Margin；父容器控制 `gap`；8px 栅格节奏；12 栏响应式。 |
| **构图排版、信息密度、去模板化** | [UI Design Quality](rules/ui-design-quality/README.md) | **排版优先 (Content-First)**：单焦点构图，拒绝机械卡片与 Badge 泛滥，留白与对齐建立层级。 |
| **主题明度、表面抬升、色彩语义** | [UI Color & Surface](rules/ui-color-and-surface/README.md) | **高度递亮 (Elevation Ladder)**：越靠近用户感知明度越高；仅消费语义 Token。 |
| **文本字号、排版阶梯** | [Font System](rules/font-system/README.md) | **标准阶梯**：严禁 `text-[*]` 任意值；正文字号下限严格为 `text-xs` (12px)；可运行 `pnpm font:check` 验证。 |
| **交互动效、手势、转场、退出** | [UI Animation](rules/ui-animation/README.md) | **按频定效与可打断**：高频交互 0ms 即时反馈；中低频强力 ease-out；Spring 不混写；尊重减少动态偏好。 |

