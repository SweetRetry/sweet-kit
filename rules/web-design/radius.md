# 圆角

圆角随容器体量递增，嵌套时内外同心。

取值由 `packages/ui/src/styles/globals.css` 的 Token 管理；组件形态由变体提供，调用方不覆盖高度、padding 或圆角。

## 形态与阶梯

| 语义 | Class |
| --- | --- |
| 微角、把手与小角标 | `rounded-xs` |
| 通用控件与菜单面板 | `rounded-sm` / `rounded-md` |
| Dialog 等浮层窗口 | `rounded-lg` |
| 普通容器 | `rounded-xl` |
| 强调容器、嵌套视口 | `rounded-2xl` |
| 大模块外框 | `rounded-3xl` |
| Avatar、药丸控件 | `rounded-full` |

- 固定高度控件明确选择圆角矩形（`R ≤ H/4`）或胶囊（`R ≥ H/2`），避免处于两者之间。
- 复用组件的实际形态以现有变体为准；新形态按 `AGENTS.md` 的复用边界进入变体、recipe 或应用组件，不为对齐表格改动冻结组件。

## 嵌套同心

- 内圆角按 `max(0, 外圆角 − 实际间隙)` 推导，间隙计入 padding 与边框，不能机械复用外圆角。
- 按公式选最近 Token 并目测校准；小圆角可有 1–2px 光学补偿，内圆角始终不大于外圆角。
- 间隙达到外圆角时，内层位于直角区域，使用 `rounded-none`。
- 父容器间距或圆角变化后重新核对内圆角，不保留过期的像素推导表。
- 如使用 `corner-shape`，以 `@supports` 做渐进增强并保留标准圆角；非圆弧转角另行目测，不能直接套同心减法。
