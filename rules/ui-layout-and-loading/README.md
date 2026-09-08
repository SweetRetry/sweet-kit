# UI Layout and Loading 规则

## 核心指导原则

1. 优先利用负空间、表面色调差与动态反馈建立视觉秩序；禁止使用高对比度的 1px 闭合边框作为内容分隔手段。
2. 间距体系（Spacing）、内边距（Padding）与外边距（Margin）严格服从 8px 网格与现代容器调度机制。
3. 容器与子元素圆角（Border Radius）严格遵循同心圆角几何法则与尺寸层级递增阶梯。
4. 结构与排版严格遵循格式塔心理学（亲密性倍率、连续性共享轴）与 12 栏响应式网格体系。

## 间距与内边距体系（Spacing & Padding）

页面和组件布局中的间距与内边距必须遵循 8px 网格。

### 1. 网格基准与阶梯

- **常规间距与内边距**：使用 `8 × n`，对应 Tailwind 标准类：
  - 8px (`p-2`, `gap-2`)
  - 16px (`p-4`, `gap-4`)
  - 24px (`p-6`, `gap-6`)
  - 32px (`p-8`, `gap-8`)
  - 40px (`p-10`, `gap-10`)
  - 48px (`p-12`, `gap-12`)
  - 64px (`p-16`, `gap-16`)
- **4px 半步间距（`p-1`, `gap-1`）**：是唯一允许的半步值，仅用于图标与文字微距、标签/角标内部微边距等紧密关联元素。
- **严禁非标值**：严禁使用 6px、10px、12px、20px 等偏离 8px 网格的数值，禁止在布局中使用任意像素值（Arbitrary value 如 `p-[15px]`）。

### 2. 文本交互控件的非对称内边距（Asymmetric Optical Padding）

对于包含单行文本的交互控件（Button, Input, Select, Badge），横向与纵向内边距不应相等：
- **光学原理**：字体本身具有排版行高（`leading`），上下自带字形间隙。若设置四边等宽内边距（如 `p-3`），视觉上会上下显得空荡、左右局促。
- **推荐比例**：水平内边距应为垂直内边距的 1.5 ~ 2 倍。
  - 标准控件（Button / Input）：`py-2 px-4` (8px / 16px) 或 `py-2.5 px-4`
  - 紧凑控件（Small Button / Badge）：`py-1 px-2.5` 或 `py-1 px-2`

### 3. 容器内边距逐级递减（Padding Decay）

内边距从外层容器向内层组件逐级收紧：
- **页面画布 / 视区（Page Canvas）**：`p-6` (24px) ~ `p-8` (32px)
- **结构面板 / 卡片容器（Card / Panel）**：`p-4` (16px) ~ `p-6` (24px)
- **卡片内列表项 / 单元行（Item / Row）**：`p-2` (8px)；仅紧密浮层菜单项允许 `p-1` (4px)

## 外边距体系（Margin）与现代布局共识

现代 Web 布局彻底摒弃传统分散式 margin 拼接，转为容器驱动（Container-driven）布局。

### 1. Zero Outer Margin 原则（组件零外边距）

所有可复用独立组件（如 `<Button />`、`<Card />`、`<Dialog />`、`<Input />` 等）的根 DOM 节点**对外暴露的 Margin 必须为 0**。
- 组件不自带外部留白，自身只处理自身的 `padding` 和内部流。
- 组件的位置、间距与外部对齐完全交由消费该组件的父容器排版。

### 2. Gap-First 原则

兄弟元素、列表、表单、按钮组之间的流式间隔，**100% 由父容器的 Flexbox / Grid `gap-*` 统一控制**。
- **严禁**给兄弟元素依次添加 `mb-*` 或 `mr-*`（此举会引入 `:last-child` 剔除和 Margin 折叠隐患）。
- **统一**使用：
  ```tsx
  // 正确：父容器统一调度 gap
  <div className="flex flex-col gap-4">
    <ComponentA />
    <ComponentB />
  </div>

  // 错误：组件外挂 margin
  <ComponentA className="mb-4" />
  <ComponentB />
  ```

### 3. Margin 的唯三合法场景

仅在以下 3 种特定场景下允许使用 `margin`：
1. **Flex 自动推挤（Auto Spacing）**：利用 `ml-auto`、`mr-auto`、`mt-auto` 将某侧元素推向容器尽头（如顶部导航栏的右侧用户菜单、卡片底部的右对齐操作按钮）。
2. **负边距通栏破框（Bleed）**：利用 `-mx-4`、`-mx-6` 等负边距抵消父容器的内边距，使分割线、大图或通栏表头贴紧外框边缘。
3. **长文本排版流（Prose / Typography）**：在富文本或 Markdown 渲染容器中，文章段落、标题之间的连续纵向流式间隔（如 `prose` 中的 `p + p` 边距）。

## 圆角体系（Border Radius System）

圆角不仅是美学特征，更是界面的几何拓扑与层级秩序。

### 1. 同心圆角几何法则（Concentric Radius Formula）

当一个带有圆角的元素嵌套在另一个带有圆角的容器内部，且两者的转角靠近时，内外两层圆弧必须共享同一个虚拟同心圆心。

**核心数学公式**：
$$R_{inner} = \max(0, R_{outer} - \text{Padding})$$

```text
       ┌────────────────────────┐  R_outer
       │   Padding              │
       │   ┌────────────────┐   │
       │   │                │   │  R_inner = max(0, R_outer - Padding)
       │   │  Inner Element │   │
       │   │                │   │
       │   └────────────────┘   │
       └────────────────────────┘
```

#### 临界情况与处理规则：
1. **标准同心嵌套 ($R_{outer} > \text{Padding}$)**：
   内层圆角取 $R_{outer} - \text{Padding}$。转角处各方向空隙均匀对称，彻底杜绝内外穿插或转角畸变。
2. **内边距填满转角 ($R_{outer} \le \text{Padding}$)**：
   当外圆角小于或等于 Padding 时，外层圆弧已完全在 Padding 缓冲区内结束，内部内容所在的物理区域是标准直角矩形。
   **处理**：内层圆角归零（`rounded-none`）或使用极微圆角（2px/4px，若组件自身是交互控件）。**严禁**在内层设置大圆角，否则会在内部生硬制造第二重凹陷。
3. **非等宽内边距 ($P_x \neq P_y$)**：
   若横纵 Padding 不一致，内层以较小一侧（即最贴近外边框的一侧）的留白计算基准，或使用独立轴向圆角。

### 2. 圆角尺寸阶梯与语义角色（Radius Hierarchy Scale）

圆角大小应与容器尺寸及视觉层级成正比。外壳大、内层小；浮层与窗口更圆润，基础控件更精简：

| 层级与角色 | 推荐 Radius 取值 | Tailwind Class | 典型组件 / 场景 |
| :--- | :--- | :--- | :--- |
| **Micro / Sub-controls** | 2px ~ 4px | `rounded-xs` / `rounded-sm` | Checkbox、Tag 内部状态标、极小指示器 |
| **Controls** | 6px ~ 8px | `rounded-md` | 按钮 (Button)、输入框 (Input)、Select 触发器 |
| **Surfaces / Popovers** | 8px ~ 10px | `rounded-lg` | 下拉菜单 (Dropdown)、Popover、Tooltip |
| **Containers / Cards** | 12px ~ 16px | `rounded-xl` | 内容卡片 (Card)、结构面板 (Panel) |
| **Windows / Modals** | 16px ~ 24px | `rounded-2xl` / `rounded-3xl` | 对话框 (Dialog)、弹窗 Modal、Sheet 抽屉 |
| **Pills / Avatars** | 完全圆形 (9999px) | `rounded-full` | 用户头像 (Avatar)、状态药丸 (Status Badge)、搜索胶囊条 |

### 3. 实战嵌套推导查表（8px 网格对齐）

| 容器外层 Radius | 容器 Padding | 内部子元素推导 Radius | 适用场景 |
| :--- | :--- | :--- | :--- |
| **`rounded-3xl` (24px)** | `p-2` (8px) | `rounded-2xl` (16px) | 窗口内紧凑包裹的内容区 / 嵌套卡片 |
| **`rounded-3xl` (24px)** | `p-4` (16px) | `rounded-md` (8px) | 模态框内的可交互表单卡片 |
| **`rounded-3xl` (24px)** | `p-6` (24px) | `rounded-none` / 直角 | 大模态框常规通栏内容区 |
| **`rounded-2xl` (16px)** | `p-2` (8px) | `rounded-md` (8px) | 卡片内部高亮选择项 / hover 激活背景 |
| **`rounded-2xl` (16px)** | `p-4` (16px) | `rounded-none` / 直角 | 标准卡片内部主要内容块 |
| **`rounded-lg` (10px)** | `p-1` (4px) | `rounded-sm` (6px) | 下拉菜单容器与内部 MenuItem 项 |
| **`rounded-full`** | 任意等比 | `rounded-full` | 胶囊搜索条与内部圆形 Action 按钮 |

### 4. 严禁的圆角反模式（Anti-patterns）

- **禁止内外同值套用**：严禁外层写 `rounded-2xl`，内部子卡片或 Item 也写 `rounded-2xl`。
- **禁止内角大外角小**：内层元素的圆角半径在任何情况下不得超过外层容器半径。
- **禁止无根据的 Arbitrary Radius**：禁止使用 `rounded-[13px]` 等随意值，所有圆角必须映射至主题 Token 或标准阶梯。

## 格式塔视觉秩序与网格系统（Gestalt & Grid System）

界面不仅是尺寸的罗列，更是大脑感知信息的几何映射。大模型生成代码时缺乏 2D 视觉画布，极易写出“间距完全均等”、“对齐左右锯齿”的无序代码。编写组件时必须严格遵循以下格式塔物理规律与网格纪律。

### 1. 格式塔亲密性原则（Law of Proximity）与 2~3 倍间距阶梯

在视觉认知中，**距离近的物体会被大脑自动归纳为同一逻辑单元**。如果组内元素间距与组外间距相等，界面就会失去逻辑层级，用户无法判断标签到底归属哪个输入框。

#### 核心数学倍率公式：
$$\text{Gap}_{\text{inter-group}} \ge (2 \sim 3) \times \text{Gap}_{\text{intra-group}}$$

- **微观内聚（组内间距 Intra-group）**：
  - 标签与控件（Label ➔ Input）：`gap-1.5` (6px) 或 `gap-2` (8px)
  - 标题与副标题（Heading ➔ Subtitle）：`gap-1` (4px) 或 `gap-1.5` (6px)
  - 图标与正文（Icon ➔ Text）：`gap-2` (8px)
- **宏观聚合（组间间距 Inter-group）**：
  - 表单项之间（Field ➔ Field）：`gap-6` (24px) 或 `gap-8` (32px)
  - 内容段落之间（Block ➔ Block）：`gap-6` (24px) 或 `gap-8` (32px)
  - 独立功能章节之间（Section ➔ Section）：`gap-12` (48px) 或 `gap-16` (64px)

#### 标题垂直吸附法则（Heading Anchoring）
大标题或小节标题，其**上方留白必须是下方留白的 3 倍以上**（例如 `pt-8 pb-2` 或 `mt-8 mb-2`）。视觉重心必须牢牢“吸附”在它所统领的内容上，严禁让标题垂直居中悬空。

#### 典型代码对比：

```tsx
// ❌ 灾难：均一化间距。Label 到自己 Input 的距离(16px)，等于到上一个 Input 的距离(16px)！
<form className="flex flex-col gap-4">
  <label>用户名</label>
  <input />
  <label>登录密码</label>  {/* 悬浮在两个输入框的正中间，无法识别归属 */}
  <input />
</form>

// ✅ 正确：严格遵循 2~3 倍亲密性阶梯，逻辑从属一目了然
<form className="flex flex-col gap-6">
  <div className="flex flex-col gap-2">
    <Label htmlFor="username">用户名</Label>
    <Input id="username" />
  </div>
  <div className="flex flex-col gap-2">
    <Label htmlFor="password">登录密码</Label>
    <Input id="password" type="password" />
  </div>
</form>
```

---

### 2. 12 栏响应式网格系统（12-Column Grid Rhythm）

页面画布和复杂看板**严禁使用随意绝对像素宽度（如 `w-[350px]`）或孤立百分比**，必须纳入标准 12 栏栅格体系（`grid grid-cols-12`）以保证各断点下的韵律对称与统一。

#### 常用列跨度节奏查表（Column Span Rhythms）：

| 布局形态 | 网格声明 | 列分配 (Col Span) | 适用场景 |
| :--- | :--- | :--- | :--- |
| **主辅非对称 (黄金比)** | `grid grid-cols-12 gap-6` | `col-span-12 lg:col-span-8` + `col-span-12 lg:col-span-4` | 详情页主体 + 侧边栏操作区；长表单 + 帮助说明 |
| **对称双栏** | `grid grid-cols-12 gap-6` | `col-span-12 md:col-span-6` × 2 | 双栏表单、左右对比卡片、并列图表 |
| **三列内容看板** | `grid grid-cols-12 gap-6` | `col-span-12 md:col-span-4` × 3 | 功能卡片矩阵、项目看板、方案比较 |
| **四列紧凑指标** | `grid grid-cols-12 gap-4` | `col-span-6 lg:col-span-3` × 4 | 核心 KPI 统计卡片、轻量元数据面板 |

#### 响应式流动规范：
必须显式声明移动端退化。所有在桌面端占据多列的子项，默认在移动端使用 `col-span-12` 垂直单列平铺，禁止在移动端挤压出窄长缝隙。

---

### 3. 视觉连续性与共享参考轴（Continuity & Shared Axis）

人眼具有沿直线扫描的生理惯性。界面的排版必须建立稳定贯穿的**对齐轴线（Alignment Track）**，消除像锯齿一样的视觉杂波。

#### 铁律一：图文混排强制轴线对齐
- 图标与单行文本并排时，必须声明 `inline-flex items-center gap-2`，杜绝因行高（line-height）与图标尺寸不一致造成上浮或下沉错位。
- 大标题伴随辅助操作时，使用 `items-baseline`，以字体主基线为基准对齐。

#### 铁律二：数据、金额与统计列的等宽与右对齐（Tabular Numbers）
- 凡涉及数字对比、金额、百分比、时间戳和计数器，必须添加 `tabular-nums`，启用等宽数字特性。
- 表格和列表中，**数值列及其表头必须统一右对齐（`text-right`）**；长文本列左对齐；状态标签居中。
- 右对齐使十位、百位、千位及小数点垂直精确对齐在同一条纵轴线上，扫视即可感知数量级差异。

```tsx
// ❌ 错误：数值比例字体且居中/左对齐，小数点与位数上下错位，像锯齿一样晃眼
<div className="flex justify-between py-2">
  <span>月度消费</span>
  <span>$1,240.50</span>
</div>
<div className="flex justify-between py-2">
  <span>年度结余</span>
  <span>$89.20</span>
</div>

// ✅ 正确：右对齐 + 等宽数字，垂直落位整齐划一
<div className="flex justify-between items-center py-2">
  <span className="text-sm text-muted-foreground">月度消费</span>
  <span className="tabular-nums text-right font-medium">$1,240.50</span>
</div>
<div className="flex justify-between items-center py-2">
  <span className="text-sm text-muted-foreground">年度结余</span>
  <span className="tabular-nums text-right font-medium">$89.20</span>
</div>
```

---

### 4. 格式塔闭合与无形边界（Law of Closure）

大脑具有自动补全轮廓（Closure）的强大能力。**不要把界面变成无休止的“小方块笼子”**。

- **依靠对齐形成虚边界**：当列表项共享严格的左对齐轴（Shared Left Anchor）时，人眼自然知道它们属于同一个列表，不需要给每一行外面都包一圈边框。
- **依靠微弱明度差形成层级**：外层容器用背景留白和微弱的表面明度差建立空间秩序，彻底取代高对比度的 1px 闭合灰色边框。

## 规则

1. **负空间定义分组**：根据内容的从属关系规划间距，使组内间距明显小于组间距；通过留白、对齐、网格和容器宽度表达区块边界。
2. **排版建立层级**：使用标题层级、字号、字重和文字颜色组织阅读顺序，不依赖容器轮廓补救层级不清。
3. **表面高度表达层次**：布局先确定表面的承载、抬升或内凹关系，再按 [UI Color and Surface](../ui-color-and-surface/README.md#表面高度) 映射柔和的明度差，避免高对比度描边。
4. **动态反馈表达可交互性**：交互区域通过 hover、pressed、focus 等状态的色调、阴影或形变反馈其边界和状态，不使用静态闭合边框代替交互反馈。
5. **分隔线不是默认分区方式**：页面、卡片、列表项和表单区块不使用高对比度 `border`、`divide-*`、`<Separator />` 或同类线条进行常规分区。

## 适用边界

本规则约束通用内容分区与几何形态，不限制承载明确语义或状态的边界（例如键盘焦点环 `ring`、选中状态、校验错误状态），以及图表或数据网格自身需要表达的坐标线。

## 加载状态与防突变

页面或主要内容区首次加载时使用与最终内容结构一致的 Skeleton；Loader 只反馈局部操作的进行状态。禁止用居中或全屏旋转 Loader 替代页面骨架。

完整的**尺寸守恒、防塌陷与防抖动细则**，必须严格遵循 [UI Stability 规则](../ui-stability/README.md)。

- **Skeleton**：路由级 `loading.tsx`、页面首次加载和主要内容区首次加载使用 1:1 等比 Skeleton。
- **Loader**：仅用于按钮提交、局部刷新等就地操作，不阻塞无关内容。

## 验收清单

- [ ] **间距合规**：所有 `padding`、`gap` 均为 8px 整数倍（或唯一的 4px 半步紧凑微距），无偏离网格的 arbitrary value。
- [ ] **亲密性倍率**：组间距（Inter-group）达到组内间距（Intra-group）的 2~3 倍以上，表单项逻辑归属明确，标题上方留白明显大于下方。
- [ ] **12 栏网格合规**：页面和复合看板采用标准 12 列栅格（`col-span-8/4`、`col-span-6/6`、`col-span-4*3` 等），移动端具备 `col-span-12` 优雅退化。
- [ ] **轴线与等宽对齐**：图标与文字垂直居中或基线对齐；所有金额、数值与统计指标声明了 `tabular-nums` 且采用右对齐。
- [ ] **组件零外边距**：所有独立复用组件根节点无外部 margin，组件间距由父容器 `gap` 统一控制。
- [ ] **同心圆角几何**：存在嵌套关系的圆角结构符合 $R_{inner} = \max(0, R_{outer} - P)$ 公式；不存在内外同值套用或内角大于外角现象。
- [ ] **圆角阶梯匹配**：控件用小圆角（6~8px）、卡片用中大圆角（12~16px）、弹窗用大圆角（16~24px），层级匹配清晰。
- [ ] **光学内边距平衡**：文本交互控件（Button, Input）水平内边距明显大于垂直内边距。
- [ ] **分区克制与闭合自然**：移除高对比度闭合边框后，依靠对齐、留白与明度差界面依然具备清晰逻辑边界。
- [ ] **加载状态规范**：页面级使用结构对齐的 Skeleton，局部操作使用就地 Loader。
