# UI Stability 规则

本规则约束组件与界面的几何稳定性、数据鲁棒性与状态切换抗突变能力。

---

## 核心指导原则

1. **尺寸守恒（Conservation of Dimensions）**：容器与控件的物理尺寸不随异步状态（Loading → Ready → Empty → Error）发生断崖式骤变。
2. **空值防御（Defensive Rendering & Null Safety）**：任何字段均假设可能为 `null`、`undefined`、`""` 或 `[]`；缺失数据绝不导致容器高度归零或结构塌陷。
3. **状态平滑（Shift-Free Transitions）**：状态切换、校验提示显隐或局部内容替换时，避免破坏周围已有元素的几何坐标。
4. **局部吸收（Contained Reflow）**：组件内部的尺寸波动必须在组件内部被约束吸收，严禁引发跨父级、跨区域的多米诺骨牌式整页重排。

---

## 1. 尺寸守恒准则（Dimension Conservation）

### 1.1 异步与动态容器预留最小尺寸

异步获取数据的内容区（图表、列表、详情面板、指标卡片），必须预设与稳态内容等高的最小尺寸或固定比例，禁止在数据返回前高度为 0。

```tsx
// ❌ 错误：未加载前高度为 0，加载完成瞬间把下方内容猛烈下推（引发严重 CLS）
<div className="rounded-xl border p-6">
  {isLoading ? <Loader /> : <ComplexChart data={data} />}
</div>

// ✅ 正确：预设固定高度或 min-h 骨架，空间体量始终恒定
<div className="min-h-[320px] rounded-xl border p-6 flex flex-col">
  {isLoading ? (
    <Skeleton className="h-[280px] w-full rounded-lg" />
  ) : (
    <ComplexChart data={data} />
  )}
</div>
```

### 1.2 媒体与图像必须声明宽高比（Aspect Ratio）

所有异步加载的图片、视频、缩略图，必须显式声明比例（如 `aspect-video`、`aspect-square`）或固定尺寸。禁止依赖图片自然尺寸撑开容器。

```tsx
// ❌ 错误：图片未加载前高度为 0，图片下载完成时界面瞬间跳动
<img src={coverUrl} alt="Cover" className="w-full rounded-lg" />

// ✅ 正确：预声明宽高比，并提供加载底色/骨架
<div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
  <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
</div>
```

### 1.3 交互控件与按钮尺寸锁定（Control Size-Locking）

按钮、输入框进入加载或禁用状态时，必须锁定自身的物理尺寸，**严禁因文案替换为 Spinner 图标而导致宽度缩水或抖动**。

```tsx
// ❌ 错误：加载中文案消失只剩 Loader，按钮宽度骤降（如 120px -> 36px）
<Button disabled={isLoading}>
  {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : "确认提交订单"}
</Button>

// ✅ 正确：锁定最小宽度或采用文字可见性占位，物理尺寸始终恒定
<Button disabled={isLoading} className="min-w-[120px]">
  {isLoading ? (
    <>
      <Loader2Icon className="size-4 animate-spin" />
      <span>处理中...</span>
    </>
  ) : (
    "确认提交订单"
  )}
</Button>
```

---

## 2. 空值与边界数据防塌陷（Defensive Rendering）

### 2.1 文本与指标节点的物理高度保持

由文字自然撑起高度的节点（标题、副标题、指标值），在数据为空或未返回时，外层必须保留最小行高（`min-h-[1lh]` / `min-h-5`），或使用占位符，防止兄弟元素吸顶。

```tsx
// ❌ 错误：subtitle 为空时 div 彻底塌陷，导致下方的按钮向上跳跃 20px
<div>
  <h3 className="text-base font-semibold">{title}</h3>
  {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
</div>

// ✅ 正确：使用兜底或预留最小行高保持垂直节拍
<div>
  <h3 className="text-base font-semibold">{title || "—"}</h3>
  <p className="min-h-[1.25rem] text-sm text-muted-foreground">
    {subtitle || ""}
  </p>
</div>
```

### 2.2 列表与集合数据的结构化兜底

当数据为 `[]`（空数组）时，必须呈现具有等价空间体量的 Empty State，严禁直接渲染为空白或将父容器折叠。

```tsx
// ❌ 错误：空数组时渲染为空，卡片变成一个干瘪的边框
<div className="rounded-lg border p-4">
  {items.map(item => <ItemRow key={item.id} item={item} />)}
</div>

// ✅ 正确：提供语义完整且空间饱满的空状态占位
<div className="min-h-[200px] rounded-lg border p-4 flex flex-col justify-center">
  {items.length > 0 ? (
    items.map(item => <ItemRow key={item.id} item={item} />)
  ) : (
    <EmptyPlaceholder title="暂无记录" description="当前筛选条件下没有数据" />
  )}
</div>
```

### 2.3 双向防御：防塌陷与防撑爆（Two-Way Resilience）

健壮的组件必须同时具备防御两极的能力：既要防御空值塌陷，也要防御极端长文本撑爆。

- **超长文本**：必须声明溢出控制（`truncate` / `line-clamp-*` / `break-words`）。
- **缺失文本**：使用安全导航与占位字符（`data?.name ?? "—"`）。

```tsx
// ✅ 稳健示范：左右两端均有防御
<div className="flex items-center justify-between gap-4">
  <span className="min-w-0 truncate font-medium">
    {user?.displayName ?? "未知用户"}
  </span>
  <span className="shrink-0 text-xs text-muted-foreground">
    {user?.role ?? "Guest"}
  </span>
</div>
```

---

## 3. 异步与状态防突变（Shift Prevention）

### 3.1 加载反馈选型：Skeleton vs Loader

- **Skeleton（骨架屏）**：用于路由级 `loading.tsx`、页面首次加载与主要内容区首次加载。1:1 复制最终渲染态的体量、`padding`、`gap` 与行高（`text-sm` 对应 `h-4`/`h-5`）；加载完成后周围元素的位置偏移为 0（CLS = 0）。
- **Loader（局部指示器）**：用于按钮提交、局部刷新、分页等操作范围明确、就地生效的反馈，放在触发它的控件内（`<Button disabled>{loading && <Spinner />}保存</Button>`），不阻塞无关区域，增量加载保留已有内容。

### 3.2 表单校验错误的预留空间（Reserved Space）

表单字段下方的校验错误信息，若在输入错误时突然弹出，会把下方表单项下推，造成用户点击目标移动（Misclick）。

- **首选策略**：在输入框下方预留稳定的最小提示空间（`min-h-[1.25rem]`），或配合稳定的布局流。
- **次选策略**：若紧凑表单无法预留空间，通过平滑的高度过渡展开，严禁生硬骤变。

```tsx
// ✅ 稳健表单项：错误信息容器始终占位或高度可控
<div className="space-y-1">
  <Label htmlFor="email">邮箱</Label>
  <Input id="email" {...register("email")} />
  <div className="min-h-[20px]">
    {errors.email && (
      <p className="text-xs text-destructive">{errors.email.message}</p>
    )}
  </div>
</div>
```

---

## 4. Flexbox 与 Grid 容器防穿孔（Containment Defense）

在 Flexbox 或 Grid 布局中，子元素默认的 `min-width: auto` 可能会导致长文本或代码块强行撑宽容器，击穿父级甚至把侧边栏挤出屏幕。

### 4.1 `min-w-0` 黄金防护盾

任何放置在 `flex` 容器中、可能包含文本或动态内容的子项，**必须添加 `min-w-0`**，使其能正确收缩并触发截断。

```tsx
// ❌ 错误：当 title 超长时，flex item 会无视父级宽度把整个卡片横向撑爆
<div className="flex items-center gap-3">
  <Avatar />
  <div>
    <h4 className="truncate">{longTitle}</h4>
  </div>
</div>

// ✅ 正确：min-w-0 解除 min-width: auto 限制，truncate 才能稳定生效
<div className="flex items-center gap-3">
  <Avatar className="shrink-0" />
  <div className="min-w-0 flex-1">
    <h4 className="truncate">{longTitle}</h4>
  </div>
</div>
```

---

## 验收清单

- [ ] **尺寸恒定**：异步加载内容区具备 `min-h-*` 或等比 Skeleton，数据载入前后无明显高度跳跃（CLS = 0）。
- [ ] **媒体受控**：所有图片与多媒体容器具备明确的宽高比（`aspect-*`）或明确尺寸限制。
- [ ] **按钮防抖**：按钮在进入 Loading 状态时物理宽度不缩水、不抖动。
- [ ] **空值防御**：缺失数据或空数组时界面不坍缩，文本节点有行高托底（`min-h-[1lh]` 或 `—` 兜底），列表有等体量 Empty State。
- [ ] **边界安全**：Flex 布局中的动态内容项已添加 `min-w-0`，长文本截断（`truncate` / `line-clamp`）生效，无横向穿孔。
