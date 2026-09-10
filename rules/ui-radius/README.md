# UI Radius 规则

本规则约束 Sweet Kit 全栈应用与组件库中的圆角体系（Border Radius System）、嵌套同心推导、控件几何形态决断与现代 CSS 曲线演进。

界面的圆角不仅是美学点缀，更是界面的**几何拓扑、空间包容关系与体量层级**的直接体现。界面中的圆角必须服从严谨的相对几何秩序，消除转角漂移、内外冲突与中庸浮肿等视觉缺陷。

---

## 核心指导原则

1. **圆角感知相对性（Roundness is Relative）**：圆角大小不是孤立的绝对数值，其视觉重量随着元素的物理尺寸而剧烈改变。相同的数值在小按钮上饱满突出，在全屏卡片上近乎平直。圆角必须随组件体量层级协同阶梯演进（Radius Ladder）。
2. **控件形态决断（Commit to Shape）**：按钮与固定高度的交互控件严禁陷入高度一半附近的“中庸浮肿陷阱（The Half-Height Trap）”。必须做出明确决断：要么是克制精确的**受控圆角矩形**，要么是极具意图的**彻底药丸胶囊**。
3. **同心几何与边框计入间隙（Concentric Geometry & Borders as Gap）**：嵌套容器内外转角必须共享同一个虚拟同心圆。**边框不是数学之外的纯视觉装饰，它物理占用了两道圆弧之间的空间**。内圆角必须扣除 Padding 与外/内 Border 的总和：
   $$R_{inner} = \max(0, R_{outer} - (\text{Padding} + \text{Border}))$$
4. **数学是及格线，肉眼是终点线（Concentric is the Floor, Eye is the Finish）**：严格的几何减法保证了转角不漂移；但在微小圆角下，严格同心的内角往往显得过分紧绷局促。设计与编码应以同心公式为几何底线，允许经肉眼校准后施加 +1 ~ 2px 的**光学平衡微调（Optical Balance）**。
5. **形状依赖与超椭圆渐进增强（Shape Dependency & Squircle）**：同心公式成立的前提是浏览器默认的四分之一正圆弧。现代 CSS 的超椭圆（`corner-shape: squircle`）无法通过线性减法保持内外共形。在超椭圆体系下需肉眼校对，并通过 `@supports` 严格保证圆弧公式的优雅回退。

---

## 1. 圆角感知相对性与尺寸阶梯（Radius Ladder）

### 1.1 为什么一个固定数值是不够的？

在 CSS 中，`border-radius: 12px` 仅仅是一个几何半径，它无法单独定义“圆角给人带来的心理感受”。
- 在一个 $36\text{px}$ 高度的按钮上，12px 显得非常圆润饱满，甚至开始抢夺按钮本身的矩形特征；
- 在一个 $320\text{px}$ 宽度的内容卡片上，12px 看起来适度柔和，边角自然收敛；
- 在一个 $800\text{px}$ 的模态弹窗或抽屉上，12px 几乎被拉平，显得僵硬且锐利。

**圆角是相对的**。组件尺寸越大，转角所需的缓冲弧度就越大。设计系统不仅要定义静态的 Radius Token，更要定义组件体量与圆角层级之间的对应关系。

```text
       ┌────────────────────────┐  Drawer / Modal: rounded-2xl ~ rounded-3xl (16~24px)
       │                        │
       │  ┌──────────────────┐  │  Card / Panel: rounded-xl ~ rounded-2xl (14~16px)
       │  │                  │  │
       │  │  ┌────────────┐  │  │  Control (Button/Input): rounded-md ~ rounded-lg (8~10px)
       │  │  │  [Button]  │  │  │
       │  │  └────────────┘  │  │
       │  └──────────────────┘  │
       └────────────────────────┘
```

### 1.2 Sweet Kit 的圆角语义阶梯（Tailwind CSS v4 映射）

在 `packages/ui/src/styles/globals.css` 中，Sweet Kit 建立了基于基准变量 `--radius: 0.625rem` (10px) 的语义阶梯：

| 语义角色 | Tailwind Class | 实际计算公式 / 像素值 | 适用组件与场景 | 视觉特征 |
| :--- | :--- | :--- | :--- | :--- |
| **Micro / Sub-controls** | `rounded-xs` / `rounded-sm` | `calc(var(--radius) - 4px)` (6px) | Checkbox、Tag 状态微标、Tooltip 气泡 | 精准、紧致、无多余钝感 |
| **Controls (Base)** | `rounded-md` | `calc(var(--radius) - 2px)` (8px) | 按钮 (Button)、输入框 (Input)、Select 触发器 | 默认交互标准，清晰干练 |
| **Surfaces / Popovers** | `rounded-lg` | `var(--radius)` (10px) | 下拉菜单 (Dropdown)、Popover、浮层面板 | 柔和收敛，承上启下 |
| **Containers / Cards** | `rounded-xl` | `calc(var(--radius) + 4px)` (14px) | 普通卡片 (Card)、分组容器 (Panel) | 结构感强，明确内容边界 |
| **Elevated Cards** | `rounded-2xl` | `calc(var(--radius) + 6px)` (16px) | 重点卡片、嵌套视口、大模块外框 | 饱满从容，空间感突出 |
| **Windows / Modals** | `rounded-3xl` | `calc(var(--radius) + 14px)` (24px) | 对话框 (Dialog)、抽屉 (Sheet)、系统级弹窗 | 宏观包裹感强，边缘柔化视区 |
| **Pills / Avatars** | `rounded-full` | `9999px` | 头像 (Avatar)、胶囊徽章 (Pill Badge)、药丸按钮 | 纯粹对称的有机曲率 |

---

## 2. 按钮与控件的形态决断（Buttons Want a Decision）

按钮暴露圆角问题最为迅速，因为它们具有明确且狭窄的高度（常见为 36px ~ 44px），几乎没有模糊容错的空间。

### 2.1 中庸浮肿陷阱（The Half-Height Trap）

当圆角的数值落在按钮高度的一半附近时，就会陷入“既不……也不……”的尴尬中间态：
- **例如**：在 $40\text{px}$ 高度的按钮上设置 $14\text{px} \sim 16\text{px}$ 的圆角。
- 它过于圆润，丧失了精密圆角矩形（Precision Rounded Rectangle）的干练与力量感；
- 它又不够圆，无法形成意图明确的胶囊药丸（Intentional Pill）；
- **最终视觉呈现不是“更柔和”，而是显得“臃肿、浮肿（swollen）”**，如同未完全定型的半成品。

### 2.2 决断矩阵

交互控件必须在两种纯粹形态中明确下注，禁止在浮肿中庸区取值：

| 决断形态 | 高度与圆角比例 | 推荐 Class (以 h-10 40px 为例) | 适用场景与心理暗示 |
| :--- | :--- | :--- | :--- |
| **受控圆角矩形** | $R \le \text{Height} / 4$ | `h-10 rounded-md` (8px) 或 `rounded-lg` (10px) | 专业级 Web 桌面端、数据密集型工具、中性克制的标准操作 |
| **完全胶囊药丸** | $R \ge \text{Height} / 2$ | `h-10 rounded-full` (`9999px`) | 移动端强引导、独立 CTA 转化按钮、搜索输入胶囊、状态标签 |
| **❌ 浮肿禁区** | $\text{Height}/4 < R < \text{Height}/2$ | `h-10 rounded-xl` (14px) 或 `rounded-2xl` (16px) | **严禁使用**。视觉松散、缺乏张力、破坏排版秩序 |

```tsx
// ❌ 错误：40px 高度使用 14px/16px 圆角，陷入浮肿陷阱
<button className="h-10 px-4 rounded-xl">浮肿的中庸按钮</button>

// ✅ 正确 1：受控圆角矩形，干脆利落
<Button className="h-10 px-4 rounded-md">确定操作</Button>

// ✅ 正确 2：彻底的药丸胶囊，意图明确
<Button className="h-10 px-6 rounded-full">立即体验</Button>
```

---

## 3. 嵌套同心几何与边框间隙（Concentric Nesting & Borders Count as Gap）

在卡片内部嵌套图片、子卡片或操作块时，最常见的翻车是“内外盲目共用同一个圆角 Token”。
例如：外层卡片 `rounded-xl` (14px)，内层图片也给 `rounded-xl` (14px)，Padding 为 8px。此时内外转角会发生明显的**转角漂移（Drifting）与挤压**，视觉极度不和谐。

### 3.1 同心圆角基本定律

嵌套的内外两个圆角不是彼此独立的孤岛，**内层圆角本质上是外层圆弧沿法线方向向内平移一段间隙后得到的内缩曲线**。它们必须共享同一个虚拟圆心。

```text
       ┌────────────────────────┐  R_outer
       │   Gap                  │
       │   ┌────────────────┐   │
       │   │                │   │  R_inner = max(0, R_outer - Gap)
       │   │  Inner Element │   │
       │   │                │   │
       │   └────────────────┘   │
       └────────────────────────┘
```

### 3.2 边框也是 Gap 的一部分（Borders Count as Gap）

这是工程实现中最容易被忽视的盲点：**边框不是数学之外的视觉涂层，边框拥有物理厚度，真实占据了内外两道曲线之间的几何空间**！

如果外层卡片设置了 16px 圆角，内部有 8px Padding，并且子元素或卡片本身带有 1px 边框：
- ❌ **只减 Padding 的粗糙计算**：$16 - 8 = 8\text{px}$（忽略了边框，内外圆角仍然无法同心）；
- ✅ **物理真实的完整间隙计算**：
  $$\text{Gap} = \text{Padding} + \text{Border}_{\text{parent}} + \text{Border}_{\text{child}}$$
  $$R_{inner} = \max(0, R_{outer} - (\text{Padding} + \text{Border}))$$
  此时同心起点应为 $16 - 8 - 1 = 7\text{px}$。

### 3.3 声明关系，而非硬编码结果（Write the Relationship, Not the Result）

在组件设计中，尽可能**持有公式，而不是硬编码计算出的静态数字**。当父容器的 Padding 或 Border 调整时，内层转角应当自然追随：

```css
/* 声明相对关系：内圆角随变量自适应收缩 */
.card__inner {
  border-radius: calc(var(--parent-radius) - var(--border-width, 1px) - var(--padding));
}
```

```tsx
// ✅ 在 Tailwind / React 中使用 CSS 变量或推导语义 Token
<div className="rounded-2xl p-2 border border-border">
  {/* 16px (2xl) - 8px (p-2) - 1px (border) = 7px ≈ 8px (rounded-md) */}
  <div className="rounded-md bg-muted p-4">
    嵌套内容
  </div>
</div>
```

### 3.4 间距溢出直角临界律（Gap $\ge R_{outer}$）

当间隙（Padding + Border）大于或等于外圆角半径时：
- 外层的圆角弧度已经在 Padding 缓冲区内彻底结束；
- 内部内容所在的物理区域实际上是一个**标准直角平面**；
- **处理规则**：内层子元素的背景或边框必须直接使用**直角（`rounded-none` / 0px）**；
- **严禁反模式**：严禁在直角物理区域内强行设置大圆角，否则会在内部生硬制造出极其丑陋的二次转角凹陷（Secondary Pocket）。

---

## 4. 光学平衡补偿法则（Concentric as Floor, Eye as Finish）

数学上的同心减法能够确保几何学上的严格对称与不漂移，但**数学同心是及格底线，肉眼感知才是终点线**。

### 4.1 微小内圆角的紧绷感（Tightness at Small Radii）

在较小的圆角尺寸下，严格按照数学减法算出的内角往往会因视觉错觉显得**过于锐利、局促和紧绷**：
- **例如**：外层卡片 12px，Padding 为 8px。数学推导 $12 - 8 = 4\text{px}$。
- 在屏幕上实际观察时，4px 的内转角视觉上会显得“太瘪、太尖”；
- 此时将内角光学微调为 $6\text{px}$，转角呼吸感更加舒展均匀。
- **典型法则**：“Concentric at 4px, optically balanced at 6px；Concentric at 7px, optically balanced at 8~10px”。

### 4.2 光学补偿工程准则

在执行同心推导时，遵循以下容差区间：
1. **基准底线**：$R_{\text{baseline}} = \max(0, R_{outer} - \text{Gap})$。
2. **补偿窗口**：当 $R_{\text{baseline}} > 0$ 且处于小圆角区间（$\le 8\text{px}$）时，允许上浮 **1px ~ 2px**：
   $$R_{\text{concentric}} \le R_{\text{inner}} \le \min(R_{outer}, R_{\text{concentric}} + 2\text{px})$$
3. **绝对上限**：无论如何光学补偿，内层圆角**绝对不得大于外层容器圆角**（$R_{inner} \le R_{outer}$）。

---

## 5. 常用嵌套推导查表（8px 网格与 Tailwind v4）

结合 Sweet Kit 标准的 8px 间距网格、1px 默认描边与 Tailwind v4 圆角 Token，实战推荐推导如下：

| 外层容器 Radius | 外层 Padding | 边框 Border | 理论计算 ($R_{outer} - P - B$) | 光学校准推荐 Class | 典型场景 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`rounded-3xl` (24px)** | `p-2` (8px) | 0px | 16px | `rounded-2xl` (16px) | 模态窗口内包裹的次级卡片/图片 |
| **`rounded-3xl` (24px)** | `p-2` (8px) | 1px | 15px | `rounded-xl` (14px) ~ `rounded-2xl` (16px) | 带描边大窗口内的紧凑卡片 |
| **`rounded-3xl` (24px)** | `p-4` (16px) | 1px | 7px | `rounded-md` (8px) | 模态框内标准间距的表单面板 |
| **`rounded-3xl` (24px)** | `p-6` (24px) | 任意 | $\le 0$ | `rounded-none` (直角) | 大弹窗常规通栏内容区 |
| **`rounded-2xl` (16px)** | `p-1` (4px) | 0px | 12px | `rounded-xl` (14px) / `rounded-lg` (10px) | 重点卡片内的紧密高亮选框 |
| **`rounded-2xl` (16px)** | `p-2` (8px) | 0px | 8px | `rounded-md` (8px) ~ `rounded-lg` (10px) | 标准卡片内的次级图片/内容块 |
| **`rounded-2xl` (16px)** | `p-2` (8px) | 1px | 7px | `rounded-md` (8px) | 带边框卡片内部的选项组件 |
| **`rounded-2xl` (16px)** | `p-4` (16px) | 任意 | $\le 0$ | `rounded-none` (直角) | 标准卡片通栏图片/主内容块 |
| **`rounded-xl` (14px)** | `p-2` (8px) | 1px | 5px | `rounded-sm` (6px) | 紧凑卡片内的图片封面 |
| **`rounded-lg` (10px)** | `p-1` (4px) | 1px | 5px | `rounded-sm` (6px) | 下拉菜单容器与内部 MenuItem 项 |
| **`rounded-full`** | 任意等比 | 任意 | - | `rounded-full` | 胶囊搜索条与内部圆形操作按钮 |

---

## 6. 形状依赖与现代 CSS 超椭圆（Shape Dependency & Squircle）

同心减法公式 $R_{inner} = R_{outer} - \text{Gap}$ 能够生效，依赖一个潜意识的几何前提：**浏览器默认的圆角是四分之一正圆（quarter circle）**。
- 正圆的几何特性在于：沿法线向内等距收缩，得到的依然是同心的正圆。

### 6.1 超椭圆（Squircle）打破了减法定理

现代 UI（以 Apple 界面为代表）与现代 CSS 引入了 `corner-shape: squircle`（超椭圆，Superellipse）。超椭圆将曲率更平缓地融入直线边缘，消除了圆弧与切线相交处的曲率跳变（Curvature Discontinuity）。

然而，**超椭圆在向内等距平移时，得到的曲线不再是标准的超椭圆**！
- 如果在超椭圆容器上直接执行单纯的数值减法（$R - \text{Gap}$），内外曲线的弯曲趋势会发生脱节，产生视觉漂移；
- W3C CSS 工作组（CSSWG issue #10993）对此展开过专门论证，目前标准 CSS 尚未原生提供自适应嵌套对称；
- 相比之下，Apple SwiftUI 专门内置了 `ConcentricRectangle` 布局原语以解决该问题。

### 6.2 Sweet Kit 的落地策略与渐进增强

在现阶段 Web 标准下，对待高级曲率属性遵循以下工程规范：

1. **圆弧公式保底**：以标准 `border-radius` 与同心减法作为可靠的几何通用基础。
2. **渐进增强（Progressive Enhancement）**：若在特定前沿场景中探索 `corner-shape: squircle`，**必须强制包裹在 `@supports` 门禁之后**，禁止作为裸奔样式引入：
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
3. **超椭圆依赖人工目测校准**：一旦启用了 `corner-shape: squircle`，简单的线性公式不再能保证 100% 贴合，工程师必须在多倍率屏幕上实机肉眼观察，交付“视觉最无违和感（least-wrong）”的平衡数值。

---

## 7. 严禁的圆角反模式（Anti-patterns）

### ❌ 反模式 1：内外同值套用（Same Radius Copy-Pasting）
外层卡片声明了 `rounded-2xl`，内层有 8px Padding 的图片也随意复制了 `rounded-2xl`。
- **后果**：内外转角严重不共心，内层转角突兀挤向外壳，画面充满廉价模板感。

### ❌ 反模式 2：内角大于外角（Inverted Radius Hierarchy）
内部子元素的圆角半径大于外层容器的圆角半径（如外层 `rounded-md` 内部却放了一个 `rounded-xl`）。
- **后果**：违背物理包容常识，产生严重视觉畸变。

### ❌ 反模式 3：中庸浮肿按钮（The Swollen Button Trap）
按钮高度 40px，却使用了 14px 或 16px 圆角。
- **后果**：不伦不类，像发酵膨胀的面团，丧失精致度。

### ❌ 反模式 4：边框视而不见（Ignoring Borders in Gap）
在带有 1px 或 2px 高对比边框的嵌套结构中，计算内圆角时只扣除 Padding，完全忽略边框对空间的侵占。
- **后果**：计算偏差 1~2px，在视网膜高分屏上呈现轻微错位与视觉粘连。

### ❌ 反模式 5：直角区域强行凹角（Forcing Radius When Gap $\ge R_{outer}$）
在外圆角较小、内边距较大的容器中（例如外角 8px、Padding 16px），子元素仍然被设置了 8px 圆角。
- **后果**：物理直角区内部凭空凹陷，破坏界面整体的平整度。

### ❌ 反模式 6：无依据的 Arbitrary Radius
在组件中随意书写 `rounded-[11px]`、`rounded-[15px]`、`rounded-[21px]` 等脱离规范阶梯的任意数值。
- **后果**：圆角阶梯碎片化，破坏项目整体的设计统一性。

---

## 8. 验收清单（Checklist）

在组件开发、页面重构或 Code Review 时，对照以下清单逐项验证：

- [ ] **体量层级匹配**：微控件使用 `rounded-xs`/`rounded-sm`，标准控件使用 `rounded-md`，卡片使用 `rounded-xl`/`rounded-2xl`，弹窗窗口使用 `rounded-3xl`。
- [ ] **控件形态决断**：所有按钮与固定高度交互控件，已明确选用“受控圆角矩形（$R \le H/4$）”或“胶囊药丸（`rounded-full`）”，未落入中庸浮肿区。
- [ ] **嵌套同心推导**：所有存在内外嵌套关系的圆角容器，内圆角均满足 $R_{inner} = \max(0, R_{outer} - (\text{Padding} + \text{Border}))$ 或其光学补偿范围。
- [ ] **边框计入间隙**：容器或子元素若声明了边框，推导内圆角时已将边框厚度计入总间隙。
- [ ] **光学平衡校准**：微小同心内角（$\le 8\text{px}$）在视觉紧绷时，已适度调优 +1~2px，整体转角视觉平滑舒展。
- [ ] **直角临界归零**：当间隙（Padding + Border）大于或等于外圆角时，内部子元素背景与边框严格归零（`rounded-none`）。
- [ ] **无随意 Arbitrary 值**：除公式推导或极其特殊的几何映射外，业务代码中无无序 `rounded-[*]` 任意值。
- [ ] **超椭圆渐进增强**：若涉及 `corner-shape`，严格包裹在 `@supports` 门禁中，并具备标准的 `border-radius` 回退保障。

---

## 来源与延伸阅读

- [Juliette: Corners are relative: nesting rounded corners and corner-shape (2026)](https://shedsgns.me/radius)：相对圆角认知、按钮中庸陷阱、边框计入间隙、光学平衡微调与 squircle 几何局限的核心洞察。
- [Cloud Four: The math behind nesting rounded corners (2023)](https://cloudfour.com/thinks/the-math-behind-nesting-rounded-corners/)：嵌套圆角同心数学推导与几何证明。
- [W3C CSS Working Group: Issue #10993 (Squircle nesting symmetry)](https://github.com/w3c/csswg-drafts/issues/10993)：关于超椭圆嵌套曲线不对称性的标准化技术讨论。
- [Apple Developer: ConcentricRectangle](https://developer.apple.com/documentation/swiftui/concentricrectangle)：SwiftUI 中解决嵌套平滑同心曲率的原生架构参考。
