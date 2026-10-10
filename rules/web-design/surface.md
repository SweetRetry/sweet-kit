# 色彩、表面与层叠

表面系统定义界面的三维空间秩序：平面的圆角几何、深度的色彩高度模型，以及 Z 轴的层叠与浮层挂载。只消费语义 Token，禁止任意值。

## 1. 色彩与表面高度（E0–E3）

高度描述表面的前后关系，Token 表达组件职责；每个表面都归入 E0–E3 之一。色彩与表面的视觉重量遵循 [6:3:1 注意力法则](hierarchy.md#1-631-注意力法则与构图)，焦点色（`primary`、`accent`、`destructive`）不超过 10%。

| 高度层级 | 语义职责 | 对应 Token | 越界禁令 |
| :--- | :--- | :--- | :--- |
| **E0 基底** | 应用背景、最远连续画布 | `background` / `foreground` | 严禁高彩度铺满底色 |
| **E1 结构面** | 侧栏、持久功能分区 | `sidebar` / `sidebar-foreground` | 严禁多层同级表面层叠 |
| **E2 抬升面** | 卡片、从承载面分离的模块 | `card` / `card-foreground` | 嵌套不自动代表抬升 |
| **E3 浮层** | 临时覆盖的弹窗、菜单 | `popover` / `popover-foreground` | 严禁 `primary` 大面积做背景 |

- **配比例外**（按场景取舍 10% 上限）：
  - **生产创作（编辑器、画布、代码区）**：90%+ 中性基底，强调色仅在光标、选择态与必要反馈微量出现（< 5%）。
  - **信息看板（图表）**：颜色承担数据分类与状态编码，不受 10% 限制，60% 基底仍为中性色。
  - **品牌表达（营销页、活动页）**：品牌色经 Token 定义后可大面积使用；状态语义色与文字对比度不得被削弱。
  - **内容沉浸（影视、相册、UGC）**：框架保持中性，局部主题色可由内容提取，经 Token 限定范围并校验对比度。

- **组件特定表面约定**：
  - Dialog、AlertDialog、Sheet 沿用 `background` 配配套遮罩；Tooltip 使用 `foreground` 作为背景、`background` 作为文字色——禁止在调用点强行覆盖为 `popover`。
  - `accent` 仅表达交互高亮，不是通用的“更高一层”；`input` 仅用于输入控件边界，不是内凹表面的通用 Token。
- **主题表现与 Token 维护**：
  - 亮暗双主题（`:root` 与 `.dark`）；暗色下 `card` 与 `popover` 略亮于 `background`，层级通过微弱明度差、边框与遮罩表达。
  - `forced-colors`（高对比度模式）生效时使用系统颜色，不追踪明度关系。
  - 色值集中在 [globals.css](../../packages/ui/src/styles/globals.css) 维护，业务组件消费语义 Token，严禁硬编码 Hex/OKLCH。

## 2. 圆角与几何形态

只消费 `globals.css` 定义的圆角阶梯，严禁任意值（`rounded-[11px]`）：

| 阶梯 | Class | 值 | 适用对象 |
| :--- | :--- | :--- | :--- |
| **微角** | `rounded-xs` | 2px | 拖拽把手、极小角标、关闭按钮 |
| **内部元素** | `rounded-sm` | 6px | 菜单项、紧凑控件内的子元素 |
| **通用控件** | `rounded-md` | 8px | Button、Input、Select、Popover、Tooltip |
| **浮层窗口** | `rounded-lg` | 10px | Dialog、AlertDialog |
| **普通容器** | `rounded-xl` | 14px | Card、主面板卡片 |
| **重点容器** | `rounded-2xl` | 18px | 重点卡片、嵌套视口 |
| **大模块** | `rounded-3xl` / `4xl` | 22px / 26px | 顶层面板、全屏窗口、设备外框 |
| **胶囊** | `rounded-full` | — | Avatar、Badge、Pill 按钮 |

- **同心定理**：嵌套容器必须满足 $R_{inner} = \max(0, R_{outer} - (\text{Padding} + \text{Border}))$。间隙 $\ge R_{outer}$ 时子元素一律 `rounded-none`。小圆角（≤ 8px）允许 +1~2px 光学补偿，但 $R_{inner}$ 永不超过 $R_{outer}$。
- **阶梯取整**：计算值不在阶梯上时，内层取**不超过计算值的最大阶梯**，不写任意值。例：`rounded-3xl`（22px）+ `p-2` → 14px → `rounded-xl`；`rounded-2xl`（18px）+ `p-4` → 2px → `rounded-xs`；`rounded-xl`（14px）+ `p-6` → ≤ 0 → `rounded-none`。
- **形态决断**：固定高度控件必须满足 $R \le H/4$（圆角矩形）或 $R \ge H/2$（完全胶囊），**严禁浮肿禁区（$H/4 < R < H/2$）**。
- **超椭圆（渐进增强）**：`corner-shape: squircle` 必须包裹在 `@supports` 内，以标准 `border-radius` 回退。

## 3. 层叠上下文与 Z-Index

业务代码上限为 `z-50`，严禁突破或使用任意值（`z-[999]`）：

| 层级 | Class | 数值 | 职责与约束 |
| :--- | :--- | :--- | :--- |
| **Below** | `-z-10` | -10 | 背景装饰、水印 |
| **Base** | `z-0` / `z-auto` | 0 | 普通文档流 |
| **Elevated** | `z-10` | 1–10 | 局部微层级（Focus 环、头像堆叠、Tab 激活态）；**父容器必须声明 `isolate`** |
| **Sticky** | `z-20` | 20 | 吸顶表头、吸底操作栏、拖拽把手 |
| **Navigation** | `z-30` | 30 | 固定导航栏、固定侧边栏 |
| **Backdrop** | `z-40` | 40 | 业务自建非模态遮罩；Dialog / Sheet 自带遮罩随浮层使用 `z-50` |
| **Overlay** | `z-50` | 50 | 全部顶层浮层（Dialog、Sheet、Popover、Tooltip 等） |

- **Portal 挂载规范**：
  - **强制 Portal 至 `<body>`**：Dialog、Sheet、DropdownMenu、Popover、Select、Tooltip，穿透局部容器防裁剪（避免 `overflow-hidden`）。
  - **禁止 Portal**：Accordion、Collapsible、Tabs、Sticky 表头（作为内容流一部分随视口滚动）。
  - **第三方例外**：sonner 的 `<Toaster />` 使用库内置层级并在应用根部挂载，不在业务代码覆盖数值；两个浮层互相遮挡时调整挂载顺序，不比拼数值。
- **层叠排查机制**：高层级被遮挡时排查祖先触发的独立层叠上下文（`transform`、`opacity < 1`、`filter` / `backdrop-filter`、`contain`、`will-change`、`mix-blend-mode`），通过 Portal 提升，严禁无脑追加更高 `z-index`。

## 验收清单

- [ ] **Token 合规**：无硬编码 Hex/OKLCH，无 `rounded-[*]` 或 `z-[*]` 任意值。
- [ ] **高度自洽**：每个表面可归入 E0–E3；同一局部链上明度与层叠不翻转；焦点色占比符合 6:3:1 或所属场景的配比例外。
- [ ] **浮层脱离**：浮层去掉阴影后仍能通过明度差或边框与下层区分。
- [ ] **几何吻合**：每处嵌套容器满足同心公式并已按阶梯取整；固定控件未入 $H/4 < R < H/2$ 浮肿区。
- [ ] **层叠受控**：`z-10` 局部容器均有 `isolate`；顶层浮层正确通过 Portal 挂载，未超 `z-50`。
- [ ] **无障碍兼容**：`forced-colors` 生效时使用系统色；超椭圆包裹在 `@supports` 中。
