# 字体与字号

字号阶梯表达内容的阅读层级，每个级别对应一种阅读角色。使用 Tailwind CSS 标准字号 utility，**严禁任意字号（`text-[11px]`）或任意字体族（`font-[Geist]`）**。

## 6:3:1 排版字阶法则

字号与字重表达阅读层级，视区内文字篇幅与视觉重量遵循 [6:3:1 注意力法则](design-quality.md#631-注意力与权重法则)：

| 配比层级 | Class 阶梯 | 推荐字重 | 阅读角色 | 越界禁令 |
| :--- | :--- | :--- | :--- | :--- |
| **60% 基础阅读** | `text-xs` / `text-sm` / `text-base` | `font-normal` | 正文、表格行、表单说明、辅助标注 | 严禁低于 `text-xs`（12px 下限）；严禁正文大面积加粗 |
| **30% 结构分层** | `text-lg` / `text-xl` | `font-medium` / `font-semibold` | 模块标题、卡片标题、表单分组 Label | 严禁列表项每行套用标题字号 |
| **10% 核心焦点** | `text-2xl` 及以上 | `font-bold` | 页面主标题、Hero 文案、核心 KPI（配 `tabular-nums`） | 严禁同一视区多个等权大标题 |

### 约束

1. **阶梯优先**：字号只取标准 utility，具体 px 与行高以 Tailwind 默认值为准。
2. **禁止任意值**：需超出阶梯时扩展 Tailwind `fontSize` Token，不写 `text-[*]`。
3. **字体族规范**：统一通过 `globals.css` 的 `--font-sans` / `--font-mono` / `--font-serif` 与对应 utility 消费。
4. **禁止以缩字号解决溢出**：内容装不下按 [构图规则](design-quality.md) 重组，不缩小正文硬塞。

## 数字字形（Tabular Numbers）

| 判据 | 处理 |
| :--- | :--- |
| 动态数值（倒计时、进度、固定徽章） | `tabular-nums`；容器固定时叠加 `min-w-*` |
| 纵向对齐比对（金额列、统计指标） | `tabular-nums` + `text-right`，表头同步右对齐 |

正文叙述与大字号展示保持比例数字；仅需数字等宽时勿滥用 `font-mono`。

## 验收清单

- [ ] **字阶合规**：所有文字类名属于标准 utility，无 `text-[*]` 任意值；正文无低于 `text-xs` 的文字。
- [ ] **字体族合规**：仅使用 `font-sans` / `font-mono` / `font-serif`，无 `font-[*]` 任意值。
- [ ] **等宽数值**：金额、统计与动态计数器添加了 `tabular-nums` 并右对齐。
- [ ] **字阶权重**：视区内大标题单一明确，正文无大面积多处 `font-bold`。
