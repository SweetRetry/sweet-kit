# UI Design Quality 规则

本规则约束页面与组件的构图质量。设计必须由当前任务、内容关系和交互状态产生，不能把通用组件模板当作默认答案。

## 核心原则

先确定当前视区的主任务和主导关系，再选择布局与组件。由多个区块组成的页面至少有一个无法原封不动移植到无关业务的组织方式，例如任务特有的比较结构、信息密度、操作路径、状态关系或内容节奏。单一表单、设置项或确认页等结构已由任务直接决定时，不为追求差异添加独特构图。

克制来自清晰的层级、准确的排版、稳定的对齐和有意义的视觉张力，不等于黑白配色、细线与大片空白。

## 构图

1. **一个主导关系**：每个视区或主要区块只保留一个首要焦点，辅助信息降低视觉重量，不与其竞争。
2. **关系先于组件**：先用顺序、比例、位置、共享刻度、连接或分组表达内容关系，再决定是否需要卡片、表格、图表或其他组件。
3. **重复代表同级**：只有语义、结构和操作真正同级的对象才使用重复布局。重要性或结构不同的内容通过排序、分组、占比或密度表达差异。
4. **层级先于装饰**：优先使用字体、比例、对齐、密度、节奏和负空间建立层级。表面、边框、颜色、图标和动效只在增加语义或可供性时出现。
5. **内容决定密度**：信息不足时如实保留空缺，不用面板、指标、插图或特效填充；信息密集时先重组和取舍，不通过缩小正文或压缩控件硬塞。

## 拒绝生成式设计惯性

以下模式不能作为默认构图；只有它直接表达当前任务关系，并且移除后会损害理解或操作时才可使用。

### 典型模式对比（Anti-patterns vs Best Practice）

#### 模式 1：列表与内容组织——拒绝“万物皆套 Card + Badge 泛滥”

```tsx
// ❌ 典型 AI 生成式惯性：为每个普通元数据套 Badge、每个列表项套厚重 Card、满屏装饰边框
<div className="space-y-4">
  {users.map(user => (
    <Card key={user.id} className="p-4 shadow-md bg-gradient-to-r from-background to-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-10" />
          <div>
            <h4 className="font-bold">{user.name}</h4>
            <Badge variant="outline" className="text-xs">ID: {user.id}</Badge>
          </div>
        </div>
        <Badge variant="secondary">{user.department}</Badge>
      </div>
    </Card>
  ))}
</div>

// ✅ 现代克制实践：通过留白、自然对齐与微弱明度差表达秩序，消除视觉噪音
<div className="divide-y divide-border/40">
  {users.map(user => (
    <div key={user.id} className="flex items-center justify-between py-3 px-2 hover:bg-muted/40 transition-colors rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="size-8 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium leading-none truncate">{user.name}</p>
          <span className="text-xs text-muted-foreground">{user.id}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{user.department}</span>
    </div>
  ))}
</div>
```

#### 模式 2：指标呈现——拒绝“机械等大 3 列指标卡”

```tsx
// ❌ 典型 AI 生成式惯性：3 个无论重要与否都一模一样的大方块卡片，带着彩色图标背景
<div className="grid grid-cols-3 gap-4">
  <Card className="p-4"><div className="size-8 rounded-full bg-blue-100 flex items-center justify-center"><UsersIcon /></div><p>总用户</p><h3>12,340</h3></Card>
  <Card className="p-4"><div className="size-8 rounded-full bg-green-100 flex items-center justify-center"><CheckIcon /></div><p>已激活</p><h3>9,820</h3></Card>
  <Card className="p-4"><div className="size-8 rounded-full bg-purple-100 flex items-center justify-center"><StarIcon /></div><p>满意度</p><h3>98%</h3></Card>
</div>

// ✅ 现代克制实践：突出主导核心指标，次要指标辅以对比节奏与紧凑排版
<div className="flex flex-col sm:flex-row sm:items-baseline gap-6 p-6 rounded-xl bg-card border border-border/50">
  <div>
    <p className="text-xs text-muted-foreground uppercase tracking-wider">活跃用户转化</p>
    <div className="flex items-baseline gap-2 mt-1">
      <span className="text-3xl font-semibold tracking-tight">79.6%</span>
      <span className="text-xs font-medium text-emerald-600">+4.2%</span>
    </div>
  </div>
  <div className="h-8 w-px bg-border hidden sm:block" />
  <div className="flex gap-6 text-sm">
    <div>
      <span className="text-muted-foreground">总用户：</span>
      <span className="font-medium ml-1">12,340</span>
    </div>
    <div>
      <span className="text-muted-foreground">已激活：</span>
      <span className="font-medium ml-1">9,820</span>
    </div>
  </div>
</div>
```

### 核心设计契约与正向指引

#### 1. 布局与容器：主导结构与非对称权重 (Structure-Driven Layout)

- **内容决定形态**：只有语义、结构真正同级的对象才使用等宽 Grid。主次关系、流程链条或因果关系优先使用非对称网格（如 8:4 栏）、单侧推挤（`ml-auto`）或流式排版展现权重差异。
- **单层表面承载**：优先使用留白（`gap-*`）、微弱表面明度差（`bg-card` / `bg-muted/40`）或自然左对齐轴建立分组；坚决避免卡片嵌套卡片或通过重重边框补救层级。
- **数据宽展呈现**：宽幅数据表格拥有最高水平空间优先级，提供横向滚动或全宽展示，不为容纳旁侧非必要装饰而强制截断或挤压列宽。

#### 2. 装饰与视觉：表面纯净与语义修饰 (Pure Surface & Meaningful Accents)

- **纯净中性基底**：背景与容器严格遵循 Neutral/Ghost 哲学，仅使用纯色中性 Token；依靠微弱明度差与对齐建立秩序，消除无意义的氛围光晕、网格纹理、斑点与渐变文字。
- **轻量文本排版**：普通元数据、标签或辅助说明优先采用 `text-xs text-muted-foreground` 自然排版；Badge 仅用于强状态区分（如 `destructive`、`warning`）或核心分类，杜绝“见词就套胶囊”。
- **功能性图标**：图标必须具有明确操作识别或可供性价值，与文本严格居中对齐；不使用无含义的巨大图标装饰块或插画填充留白。

#### 3. 排版与文案：自然阶梯与结论直陈 (Direct Hierarchy & Clean Copy)

- **标准字号与对齐**：标题与正文严格落在 Tailwind 标准阶梯内（正文下限为 `text-xs`）；同级指标、标签与数值严格共享水平基线（Baseline Alignment）。
- **结论直陈**：界面文案直接陈述业务数据与操作结论，精炼不重复；不在界面中向用户叙述页面设计背景、排版理由或过往尝试。

#### 4. 数据表达：真实编码与就地标注 (Truthful Encoding & Direct Labeling)

- **就地直接标注**：图表数值与趋势线尽量就地标注；只有数据维度过多无法就地展示时才使用独立图例。
- **真实比例刻度**：同级数据图形必须共享统一基准轴（Baseline）与比例刻度，条柱长度与面积必须严格线性对应真实数值。

## 允许的例外

品牌沉浸、内容沉浸或实验性界面可以使用更强的装饰、色彩和动效，但必须有已确定的艺术方向。每项偏离都要支持当前内容、品牌语义或交互反馈，并保持可读性、响应式行为和可访问性；“让页面更丰富”不是理由。

## 验收

- **眯眼测试**：模糊细节后，首要焦点、分组和阅读路径仍然清楚，页面不是等权重区块的堆栈。
- **移除测试**：逐项移除卡片、边框、背景、图标、颜色和动效；不损失含义或可供性的元素不得恢复。
- **移植测试**：页面的主要组织方式不能在只替换文案后直接用于无关业务；能够直接移植说明构图仍由模板主导。
- **同级测试**：每组重复结构中的对象具有相同语义、结构和操作；不等价对象已通过排序、分组、占比或密度体现差异。
- **响应式测试**：窄屏通过重排保持层级与操作，不依赖截断关键内容、隐藏页面溢出或缩小可读字号维持桌面构图。
- **动效测试**：减少动效后，状态、阅读和任务完成仍然完整。
