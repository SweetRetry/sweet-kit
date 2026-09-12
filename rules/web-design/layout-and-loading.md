# UI Layout and Loading 规则

## 核心指导原则

1. 优先利用负空间、表面色调差与动态反馈建立视觉秩序；禁止使用高对比度的 1px 闭合边框作为内容分隔手段。
2. 间距体系（Spacing）、内边距（Padding）与外边距（Margin）严格服从 8px 网格与现代容器调度机制。
3. 容器与子元素圆角（Border Radius）100% 收敛遵循 [UI Radius 规则](radius.md)，服从相对几何、同心推导与控件形态决断。
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
- **紧凑微距**：`p-1` / `gap-1` (4px)，仅用于图标与文字、标签/角标内部的紧密关联元素。
- **不受网格约束的值域**：文本行高托底（`min-h-[1lh]`、`min-h-5`、`min-h-[1.25rem]`）与光学微调（`gap-1.5`、`gap-2.5`、`py-2.5 px-4`）由排版与光学决定，不按本条判定。
- **禁止**：偏离网格的任意值（如 `p-[15px]`、`p-[13px]`）。

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

兄弟元素、列表、表单、按钮组之间的流式间隔由父容器统一控制。两种等价写法，首选前者：

- **`gap-*`（首选）**：`<div className="flex flex-col gap-4">`
- **`space-y-*`（等价）**：同样声明在父容器上，用于纯纵向流；它内部就是兄弟选择器，不引入逐项 margin。

**严禁逐个兄弟元素挂 `mb-*` / `mr-*`**，那会把间距散落到每个子节点，并带来 `:last-child` 剔除与 Margin 折叠隐患：

```tsx
// ❌ 错误：间隔写进组件自身
<ComponentA className="mb-4" />
<ComponentB />
```

### 3. Margin 的唯三合法场景

仅在以下 3 种特定场景下允许使用 `margin`：
1. **Flex 自动推挤（Auto Spacing）**：利用 `ml-auto`、`mr-auto`、`mt-auto` 将某侧元素推向容器尽头（如顶部导航栏的右侧用户菜单、卡片底部的右对齐操作按钮）。
2. **负边距通栏破框（Bleed）**：利用 `-mx-4`、`-mx-6` 等负边距抵消父容器的内边距，使分割线、大图或通栏表头贴紧外框边缘。
3. **长文本排版流（Prose / Typography）**：在富文本或 Markdown 渲染容器中，文章段落、标题之间的连续纵向流式间隔（如 `prose` 中的 `p + p` 边距）。

## 圆角

圆角阶梯、嵌套同心推导与控件形态决断 100% 遵循 [UI Radius 规则](radius.md)。

## 格式塔视觉秩序与网格系统（Gestalt & Grid System）

### 1. 格式塔亲密性原则（Law of Proximity）与 2~3 倍间距阶梯

距离近的物体会被读成同一逻辑单元。组内间距等于组外间距时，用户无法判断标签归属哪个输入框。

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
3. **表面高度表达层次**：布局先确定表面的承载、抬升或内凹关系，再按 [UI Color and Surface](color-and-surface.md#表面高度) 取当前主题的表面 Token，避免高对比度描边。
4. **动态反馈表达可交互性**：交互区域通过 hover、pressed、focus 等状态的色调、阴影或形变反馈其边界和状态，不使用静态闭合边框代替交互反馈。
5. **分隔线不是默认分区方式**：页面、卡片和表单区块先靠留白、共享对齐轴与微弱表面差分区。成组列表允许低对比度分隔（`divide-y divide-border/40`）；高对比度闭合边框、`<Separator />` 与同类线条不得作为默认分区手段。

## 适用边界

本规则约束通用内容分区与几何形态，不限制承载明确语义或状态的边界（例如键盘焦点环 `ring`、选中状态、校验错误状态），以及图表或数据网格自身需要表达的坐标线。

## 适用范围

本规则约束 `apps/**` 与新增业务组件。`packages/ui` 内的上游 shadcn/ui 组件按上游实现维护（其 `p-[3px]` 等任意值不构成本规则违规），改造它们需单独提交。

## 关联规则与边界

- **圆角与几何拓扑**：圆角阶梯、嵌套同心推导、边框间隙计算与控件形态决断，100% 收敛遵循 [UI Radius 规则](radius.md)。
- **异步加载与骨架稳定性**：完整的尺寸守恒、防塌陷、Skeleton 与 Loader 细则，100% 收敛遵循 [UI Stability 规则](stability.md)。
- **表面明度与高度**：表面的承载、抬升与内凹关系，遵循 [UI Color and Surface 规则](color-and-surface.md#表面高度)。

## 验收清单

- [ ] **间距合规**：外部间距与内边距为 8px 整数倍或 `p-1`/`gap-1` 紧凑微距，无偏离网格的任意值；行高托底与光学微调值属于另一值域。
- [ ] **亲密性倍率**：组间距（Inter-group）达到组内间距（Intra-group）的 2~3 倍以上，表单项逻辑归属明确，标题上方留白明显大于下方。
- [ ] **12 栏网格合规**：页面和复合看板采用标准 12 列栅格（`col-span-8/4`、`col-span-6/6`、`col-span-4*3` 等），移动端具备 `col-span-12` 优雅退化。
- [ ] **轴线与等宽对齐**：图标与文字垂直居中或基线对齐；所有金额、数值与统计指标声明了 `tabular-nums` 且采用右对齐。
- [ ] **组件零外边距**：所有独立复用组件根节点无外部 margin，组件间隔由父容器 `gap-*` 或 `space-y-*` 统一控制。
- [ ] **圆角与拓扑合规**：所有圆角使用、嵌套推导与控件形态符合 [UI Radius 规则](radius.md)。
- [ ] **光学内边距平衡**：文本交互控件（Button, Input）水平内边距明显大于垂直内边距。
- [ ] **分区克制与闭合自然**：依靠对齐、留白与微弱明度差形成清晰逻辑边界，不滥用高对比度闭合边框。
