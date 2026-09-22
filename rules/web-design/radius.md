# 圆角与几何形态

圆角表达组件的物理形态与触摸亲和力。只消费已发布的语义 Token，禁止任意值（`rounded-[11px]`）。

## 核心定理

1. **同心定理**：$R_{inner} = \max(0, R_{outer} - (\text{Padding} + \text{Border}))$
2. **形态决断**：固定高度控件必须选择受控圆角矩形（$R \le H/4$）或完全胶囊（$R \ge H/2$），**严禁浮肿禁区（$H/4 < R < H/2$）**。
3. **光学补偿**：小圆角（≤ 8px）允许 +1~2px 补偿，但 $R_{inner}$ 永不超过 $R_{outer}$。
4. **间隙溢出归零**：间隙 ≥ $R_{outer}$ 时，子元素一律 `rounded-none`。

## 圆角阶梯

数值集中定义在 `globals.css`（`--radius` 基准 + `--radius-*` 派生）：

| 语义角色 | Class | 常见对象 |
| :--- | :--- | :--- |
| 微角 | `rounded-xs` | 拖拽把手、小角标 |
| 通用控件 | `rounded-sm` / `rounded-md` | Button、Input、菜单项、Select |
| 浮层窗口 | `rounded-lg` | Dialog、AlertDialog |
| 普通容器 | `rounded-xl` | Card、主面板卡片 |
| 强调容器 | `rounded-2xl` | 重点卡片、嵌套视口 |
| 大模块外框 | `rounded-3xl` | 全屏窗口、顶层面板 |
| 胶囊 | `rounded-full` | Avatar、Pill Badge |

## 嵌套同心推导（`--radius: 0.625rem`）

| 外层 | Padding | 推荐内层 | 场景 |
| :--- | :--- | :--- | :--- |
| `rounded-3xl` (24px) | `p-2` (8px) | `rounded-2xl` | 大窗口内次级卡片 |
| `rounded-3xl` (24px) | `p-4` (16px) | `rounded-md` | 大窗口标准间距面板 |
| `rounded-3xl` (24px) | `p-6` (24px) | `rounded-none` | 大窗口通栏内容区 |
| `rounded-2xl` (16px) | `p-1` (4px) | `rounded-lg` ~ `rounded-xl` | 重点卡片紧密高亮块 |
| `rounded-2xl` (16px) | `p-2` (8px) | `rounded-md` | 标准卡片次级内容 |
| `rounded-2xl` (16px) | `p-4` (16px) | `rounded-none` | 标准卡片通栏内容 |
| `rounded-xl` (14px) | `p-2` (8px) | `rounded-sm` | 紧凑卡片图片封面 |
| `rounded-lg` (10px) | `p-1` (4px) | `rounded-sm` | 下拉菜单与内部选项 |

## 超椭圆（渐进增强）

`corner-shape: squircle` 必须包裹在 `@supports` 内，以标准 `border-radius` 回退。

## 验收清单

- [ ] **阶梯合规**：无 `rounded-[*]` 任意值。
- [ ] **形态决断**：固定高度控件落在 $R \le H/4$ 或 $R \ge H/2$，未入浮肿禁区。
- [ ] **同心吻合**：嵌套容器满足减法公式，$R_{inner} \le R_{outer}$。
- [ ] **溢出归零**：间隙 ≥ 外圆角时子元素 `rounded-none`。
- [ ] **超椭圆降级**：`corner-shape` 在 `@supports` 中且有标准圆角兜底。
