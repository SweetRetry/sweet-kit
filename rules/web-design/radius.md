# 圆角与几何形态

圆角表达组件的物理形态与触摸亲和力。只消费已发布的语义 Token，禁止任意值（`rounded-[11px]`）。

## 核心定理

1. **同心定理**：$R_{inner} = \max(0, R_{outer} - (\text{Padding} + \text{Border}))$
2. **形态决断**：固定高度控件必须选择受控圆角矩形（$R \le H/4$）或完全胶囊（$R \ge H/2$），**严禁浮肿禁区（$H/4 < R < H/2$）**。
3. **光学补偿**：小圆角（≤ 8px）允许 +1~2px 补偿，但 $R_{inner}$ 永不超过 $R_{outer}$。
4. **间隙溢出归零**：间隙 ≥ $R_{outer}$ 时，子元素一律 `rounded-none`。
5. **阶梯取整**：计算结果不在阶梯上时，按[嵌套同心推导](#嵌套同心推导)的取整规则落到阶梯，不写任意值。

## 圆角阶梯

数值集中定义在 `globals.css`（`--radius: 0.625rem` 基准 + `--radius-*` 派生）；`rounded-xs` 为 Tailwind 默认值。

| 语义角色 | Class | 值 | 常见对象 |
| :--- | :--- | :--- | :--- |
| 微角 | `rounded-xs` | 2px | 拖拽把手、小角标、关闭按钮 |
| 内部元素 | `rounded-sm` | 6px | 菜单项、紧凑控件内的子元素 |
| 通用控件 | `rounded-md` | 8px | Button、Input、Select、Popover、DropdownMenu、Tooltip |
| 浮层窗口 | `rounded-lg` | 10px | Dialog、AlertDialog |
| 普通容器 | `rounded-xl` | 14px | Card、主面板卡片 |
| 强调容器 | `rounded-2xl` | 18px | 重点卡片、嵌套视口 |
| 大模块外框 | `rounded-3xl` | 22px | 顶层面板 |
| 超大外框 | `rounded-4xl` | 26px | 全屏窗口、设备外框 |
| 胶囊 | `rounded-full` | — | Avatar、Badge |

## 嵌套同心推导

内层取**不超过计算值的最大阶梯**；计算值 ≤ 8px 时可按光学补偿放宽 2px；计算值 ≤ 0 时 `rounded-none`。下表按无边框计算，外层有 1px 边框时计算值再减 1。

| 外层 | Padding | 计算值 | 推荐内层 | 场景 |
| :--- | :--- | :--- | :--- | :--- |
| `rounded-4xl` (26px) | `p-2` (8px) | 18px | `rounded-2xl` | 全屏窗口内次级卡片 |
| `rounded-3xl` (22px) | `p-2` (8px) | 14px | `rounded-xl` | 顶层面板内卡片 |
| `rounded-3xl` (22px) | `p-4` (16px) | 6px | `rounded-sm` | 顶层面板标准间距内容 |
| `rounded-3xl` (22px) | `p-6` (24px) | ≤ 0 | `rounded-none` | 顶层面板通栏内容区 |
| `rounded-2xl` (18px) | `p-1` (4px) | 14px | `rounded-xl` | 重点卡片紧密高亮块 |
| `rounded-2xl` (18px) | `p-2` (8px) | 10px | `rounded-lg` | 重点卡片次级内容 |
| `rounded-2xl` (18px) | `p-4` (16px) | 2px | `rounded-xs` | 重点卡片标准间距内容 |
| `rounded-xl` (14px) | `p-2` (8px) | 6px | `rounded-sm` | 紧凑卡片图片封面 |
| `rounded-xl` (14px) | `p-4` / `p-6` | ≤ 0 | `rounded-none` | Card 内容区（Card 自身 `px-6`） |
| `rounded-md` (8px) | `p-1` (4px) | 4px | `rounded-sm` | 下拉菜单与内部选项（含 +2px 补偿） |

## 超椭圆（渐进增强）

`corner-shape: squircle` 必须包裹在 `@supports` 内，以标准 `border-radius` 回退。

## 验收清单

- [ ] **阶梯合规**：无 `rounded-[*]` 任意值。
- [ ] **形态决断**：固定高度控件落在 $R \le H/4$ 或 $R \ge H/2$，未入浮肿禁区。
- [ ] **同心吻合**：嵌套容器满足减法公式，$R_{inner} \le R_{outer}$。
- [ ] **溢出归零**：间隙 ≥ 外圆角时子元素 `rounded-none`。
- [ ] **超椭圆降级**：`corner-shape` 在 `@supports` 中且有标准圆角兜底。
