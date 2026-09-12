# UI Radius 规则

本规则约束圆角阶梯、嵌套同心推导与控件形态决断。

## 核心契约

1. **同心（Concentric）**：嵌套容器内外转角共享同一个虚拟圆心。间隙包含 Padding 与外/内 Border，因为边框物理占据了两道圆弧之间的空间：
   $$R_{inner} = \max(0, R_{outer} - (\text{Padding} + \text{Border}))$$
2. **形态决断（Commit to Shape）**：固定高度的交互控件二选一——受控圆角矩形（$R \le H/4$）或彻底药丸（$R \ge H/2$），不取两者之间。
3. **光学补偿**：同心公式是几何底线，肉眼是终点线。小圆角（$\le 8\text{px}$）允许 +1~2px 补偿，但 $R_{inner}$ 永不超过 $R_{outer}$。
4. **间隙溢出归零**：Gap $\ge R_{outer}$ 时内层所在区域已是直角平面，子元素背景与边框一律 `rounded-none`。

## 圆角阶梯

数值集中定义在 `packages/ui/src/styles/globals.css`（`--radius` 基准 + `--radius-*` 派生）。本规则只约定**语义到类的映射**，不复制取值；改 Token 时映射不变。

| 语义角色 | Class | 当前出现位置 |
| --- | --- | --- |
| 微角（不进阶梯） | `rounded-xs` | 拖拽把手、小尺寸角标；Tailwind 默认值，不受 `--radius` 影响 |
| 通用控件 | `rounded-sm` / `rounded-md` | Button、Input、菜单项、Select / Dropdown / Popover 面板 |
| 浮层窗口 | `rounded-lg` | Dialog、AlertDialog |
| 容器 | `rounded-xl` | Card |
| 强调容器 | `rounded-2xl` | 重点卡片、嵌套视口 |
| 大模块外框 | `rounded-3xl` | 全屏级窗口的目标态；`packages/ui` 上游组件尚未对齐 |
| 胶囊 | `rounded-full` | Avatar、Pill Badge、药丸按钮 |

**目标态**是全阶递进（窗口 > 卡片 > 浮层 > 控件 > 微角）。当前映射以 `packages/ui` 实现为准，避免规则与组件互相打脸；要把 Dialog 提到 `rounded-3xl` 属于上游改造，单独提交。

## 控件形态决断

固定高度控件在高度一半附近取值会落进「中庸浮肿」区间：过于圆润而失去受控矩形的精密感，又不够圆而不构成胶囊，视觉结果是臃肿。

| 形态 | 比例 | 示例（`h-10`） | 适用 |
| --- | --- | --- | --- |
| 受控圆角矩形 | $R \le H/4$ | `h-10 rounded-md` | 桌面端工具、数据密集型界面、中性标准操作 |
| 完全胶囊 | $R \ge H/2$ | `h-10 rounded-full` | 移动端强引导、独立 CTA、搜索胶囊、状态标签 |
| ❌ 浮肿禁区 | $H/4 < R < H/2$ | `h-10 rounded-xl` | 禁用 |

```tsx
<Button className="h-10 px-4 rounded-md">确定操作</Button>
<Button className="h-10 px-6 rounded-full">立即体验</Button>
```

## 嵌套同心

内外盲目共用同一个 Token 是最常见的翻车：外层 `rounded-2xl` + `p-2`，内层图片也写 `rounded-2xl`，内外转角明显漂移。

**声明关系，而非硬编码结果。** 父容器 Padding 或 Border 变化时，内层应当追随：

```css
.card__inner {
  border-radius: calc(var(--parent-radius) - var(--border-width, 1px) - var(--padding));
}
```

Tailwind 下按公式取最近阶梯即可：

```tsx
<div className="rounded-2xl border border-border p-2">
  {/* 16px - 8px - 1px = 7px ≈ rounded-md */}
  <div className="rounded-md bg-muted p-4">嵌套内容</div>
</div>
```

### 常用推导查表

像素值按当前 `--radius: 0.625rem` 推导，**改 Token 后按公式重算，不要照抄像素**。

| 外层 | Padding | Border | 计算 | 推荐内层 | 场景 |
| --- | --- | --- | --- | --- | --- |
| `rounded-3xl` (24px) | `p-2` | 0 | 16px | `rounded-2xl` | 大窗口内的次级卡片/图片 |
| `rounded-3xl` (24px) | `p-4` | 1px | 7px | `rounded-md` | 大窗口内标准间距表单面板 |
| `rounded-3xl` (24px) | `p-6` | 任意 | ≤ 0 | `rounded-none` | 大窗口通栏内容区 |
| `rounded-2xl` (16px) | `p-1` | 0 | 12px | `rounded-lg` ~ `rounded-xl` | 重点卡片内的紧密高亮块 |
| `rounded-2xl` (16px) | `p-2` | 0 | 8px | `rounded-md` | 标准卡片内的次级内容块 |
| `rounded-2xl` (16px) | `p-2` | 1px | 7px | `rounded-md` | 带边框卡片内的选项组件 |
| `rounded-2xl` (16px) | `p-4` | 任意 | ≤ 0 | `rounded-none` | 标准卡片通栏图片/主内容块 |
| `rounded-xl` (14px) | `p-2` | 1px | 5px | `rounded-sm` | 紧凑卡片内的图片封面 |
| `rounded-lg` (10px) | `p-1` | 1px | 5px | `rounded-sm` | 下拉菜单容器与内部菜单项 |
| `rounded-full` | 任意 | 任意 | — | `rounded-full` | 胶囊搜索条与内部圆形按钮 |

## 反模式

- **内外同值**：外层 `rounded-2xl`、内层有 8px Padding 的图片也复制 `rounded-2xl` → 转角不共心，内层挤向外壳。
- **直角区强行凹角**：外角 8px、Padding 16px 时子元素仍设 8px → 直角平面里凭空凹陷。
- **任意值**：业务代码不写 `rounded-[11px]`、`rounded-[15px]` 等脱离阶梯的值；需要新转角就先加 Token。

## 超椭圆（渐进增强）

`corner-shape: squircle` 破坏了线性减法定理（超椭圆向内平移不再是超椭圆），必须包裹在 `@supports` 门禁之后，并以标准 `border-radius` 回退；启用后需人工目测校准。

```css
.modern-card {
  border-radius: var(--radius-2xl);
}

@supports (corner-shape: squircle) {
  .modern-card {
    corner-shape: squircle;
  }
}
```

## 适用范围

本规则约束 `apps/**` 与新增业务组件。`packages/ui` 内的上游 shadcn/ui 组件按上游实现维护（其 `rounded-[2px]`、`rounded-[inherit]` 等写法不构成本规则违规）。

## 自动化验证

修改圆角后运行 `pnpm ui:check`（检查任意值 `rounded-[...]`）。

## 验收

- [ ] 每个圆角用类名表达，不用任意值；语义角色与阶梯表一致。
- [ ] 固定高度控件已明确落在受控矩形（$R \le H/4$）或胶囊（$R \ge H/2$），未进入浮肿区间。
- [ ] 存在内外嵌套的圆角容器，内圆角满足 $R_{inner} = \max(0, R_{outer} - (\text{Padding} + \text{Border}))$ 或在其 +1~2px 补偿窗口内，且 $R_{inner} \le R_{outer}$。
- [ ] 间隙 ≥ 外圆角时，内层为 `rounded-none`。
- [ ] 若使用 `corner-shape`，已包裹在 `@supports` 内并有标准回退。
