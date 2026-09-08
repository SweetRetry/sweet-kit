# Z-Index 规则

本规则约束 Sweet Kit 全栈应用与组件库中的层叠顺序（Stacking Order）、层叠上下文（Stacking Context）与 `z-index` 使用。

界面的层叠必须服从清晰的物理秩序与组件边界，彻底杜绝无序的 `z-index` 军备竞赛（如 `z-[999]`、`z-[9999]`）与层叠上下文外溢。

## 核心指导原则

1. **DOM 顺序优先（DOM Order First）**：位于相同平面的同级元素，后渲染节点天然置于先渲染节点之上。优先依赖自然文档流表达遮盖顺序，禁止在无重叠脱离需求的常规流式布局中滥用 `z-index`。
2. **局部层叠强隔离（Stacking Context Isolation via `isolate`）**：组件内部若存在局部的重合与层级微调（如 Focus 环高亮、头像堆叠、Tab 切换指示器），**容器必须显式声明 `isolate` (`isolation: isolate`)**，将局部 `z-index` 彻底封锁在局部上下文沙箱内，禁止泄露至全局。
3. **全局阶梯离散化（Discrete Semantic Scale）**：全局 `z-index` 严格服从离散的语义阶梯。**严禁使用任何 Arbitrary Value（如 `z-[999]`、`z-[9999]`）**。
4. **Portal 顶层挂载契约（Portal Overlay Contract）**：模态弹窗、侧边抽屉、下拉气泡与浮动提示等全局顶层容器，必须通过 Portal 挂载到根节点（`document.body`），避免被局部容器的 `overflow: hidden` 或 `transform` 形成意外裁剪与上下文困禁。
5. **排查根因优先于数值递增（Debug Before Escalating）**：当元素出现遮挡异常时，**严禁盲目调大 z-index**。必须先排查是否存在意外创建的父级层叠上下文或错误的 DOM 挂载层级。

---

## 全局 Z-Index 语义阶梯

全局 `z-index` 必须严格对齐下表，使用标准 Tailwind class：

| 层级等级 (Layer) | Tailwind Class | 取值 | 语义角色 | 典型对象与场景 |
| :--- | :--- | :--- | :--- | :--- |
| **Under / Behind** | `-z-10` / `-z-1` | < 0 (-10, -1) | **负层基底** | 背景装饰微光、底层粒子动效、画布底层网格与水印 |
| **Base (Default)** | `z-0` / `z-auto` | 0 (默认) | **普通文档流** | 默认页面主体、普通卡片、表格行、表单元素、无重叠布局容器 |
| **Elevated / Local** | `z-10` | 1 ~ 10 | **局部微层级 (必须配合 `isolate`)** | 输入框 Focus 边框环 (`focus-visible:z-10`)、头像堆叠 AvatarGroup、日历选中格、Tab 激活态、卡片 hover 提拉 |
| **Sticky / Handle** | `z-20` | 20 | **局部吸顶与把手** | 表格吸顶表头 (Sticky Header)、分栏拖拽把手 (`ResizableHandle`)、侧边栏拖拽导轨 (`SidebarRail`)、局部滚动吸顶操作条 |
| **Navigation / Fixed** | `z-30` | 30 | **持久性全局导航** | 页面顶部固定导航栏 (Fixed Header/Navbar)、移动端底部操作栏 (Bottom Bar)、固定侧边栏 (Fixed Sidebar) |
| **Backdrop** | `z-40` | 40 | **遮罩蒙层** | 全屏半透明遮罩背景（当遮罩与内容需独立分层控制时） |
| **Modal / Overlays** | `z-50` | 50 | **模态窗口与核心浮层** | Dialog 对话框、Sheet 侧边抽屉、Drawer 底部抽屉、AlertDialog、NavigationMenu 展开视区 |
| **Floating / Popovers** | `z-60` (或 50+Portal) | 60 | **嵌套浮动控件** | 下拉菜单 (DropdownMenu)、气泡卡片 (Popover)、Select 下拉面板、ContextMenu 右键菜单 |
| **Tooltip** | `z-70` (或 50+Portal) | 70 | **全局气泡提示** | Tooltip 气泡（必须能悬浮于模态弹窗及浮动控件之上，不被遮挡截断） |
| **Toast / Notice** | `z-80` | 80 ~ 100 | **全局即时反馈通知** | 全局 Toast (Sonner 消息通知)、系统网络状态横幅、顶层操作反馈 |
| **Spotlight / System** | `z-90` / `z-100` | 90 ~ 100 | **系统最高优先级** | Command Palette (`Cmd+K` cmdk 快捷指令面板)、全屏阻断加载遮罩、系统崩溃 Fatal Error 屏 |

> [!NOTE]
> **关于 Radix UI 默认 `z-50` 的协作说明**：
> 本项目的 Radix UI 原生浮层组件（Dialog, Sheet, Popover, Dropdown, Tooltip）在 `packages/ui` 中默认挂载至 `<body>` 根节点并使用 `z-50`。
> 在常规单层浮层场景中，依赖 Radix 的 Portal 挂载顺序自然即可维持后开先上的正确次序；
> 但在**跨层级复合场景**（如模态弹窗内弹出 Dropdown、弹窗内悬停显示 Tooltip、弹窗弹出时触发 Toast），必须确保 Tooltip 与 Toast 处于更高阶梯（`z-70` / `z-80`），防止因挂载时序异常引发的遮挡。

---

## 局部层叠上下文与 `isolate` 隔离原则

### 1. 为什么必须使用 `isolate`？

在 CSS 中，如果不创建独立的层叠上下文，一个子元素哪怕只设置了 `z-10`，也会参与整个页面顶层或父级 Stacking Context 的排序。当多个组件交错时，子元素的 `z-10` 极易溢出并意外遮盖外部的同级卡片、固定表头甚至全局导航栏。

`isolation: isolate`（Tailwind 的 `isolate` 类）会强制在当前元素上开辟一个新的局部层叠上下文。其内部所有子元素的 `z-index` 只在容器内部竞争，容器对外只表现为一个不可分割的整体。

### 2. 经典场景对比

#### 场景 A：头像堆叠组件（Avatar Stack）

```tsx
// ❌ 错误：未隔离层叠上下文，hover 时的 z-10 容易穿透遮挡外部元素
<div className="flex -space-x-2">
  <Avatar className="hover:z-10" />
  <Avatar className="hover:z-10" />
  <Avatar className="hover:z-10" />
</div>

// ✅ 正确：容器使用 isolate 封锁局部层叠
<div className="isolate flex -space-x-2">
  <Avatar className="hover:z-10 transition-transform hover:scale-105" />
  <Avatar className="hover:z-10 transition-transform hover:scale-105" />
  <Avatar className="hover:z-10 transition-transform hover:scale-105" />
</div>
```

#### 场景 B：相连控件组边框重合（Connected Inputs / Button Group）

```tsx
// ✅ 正确：相邻输入框 Focus 时利用 focus:z-10 提升边框，父容器使用 isolate 阻断外溢
<div className="isolate inline-flex -space-x-px rounded-md shadow-xs">
  <button className="relative z-0 border border-input focus:z-10 focus:ring-2 focus:ring-ring">
    选项 A
  </button>
  <button className="relative z-0 border border-input focus:z-10 focus:ring-2 focus:ring-ring">
    选项 B
  </button>
</div>
```

---

## 层叠上下文触发陷阱（Stacking Context Triggers）

当发现一个元素设置了高 `z-index`（如 `z-50`）却依然被另一个看似更低层级的元素遮挡时，**绝对不要尝试写 `z-[9999]`**。这几乎 100% 是由于父级或祖先元素无意中创建了独立的层叠上下文。

以下 CSS 属性会导致父容器自建层叠上下文，并将其所有子节点困在其中：

1. **`transform` / `translate` / `scale` / `rotate`**（非 `none`，常用于进入/退出动效）
2. **`opacity < 1`**（淡入淡出动画进行时）
3. **`filter` / `backdrop-filter`**（如毛玻璃模糊 `backdrop-blur-*`、投影 `drop-shadow`）
4. **`contain`**（如 `contain: paint` 或 `contain: layout`）
5. **`will-change`**（指定了包含上述属性）
6. **`mix-blend-mode`**（非 `normal`）
7. **`perspective`**（3D 视距）

### 排查与解决方案

- **排查步骤**：在浏览器 DevTools 中沿该元素向上检查其祖先链，观察是否存在上述属性（尤其是 motion 动画添加的 `transform` 或 `opacity`）。
- **解决手段**：
  - **Portal 提升**：将浮层、弹窗或提示移至 Portal（挂载至 `document.body`），彻底脱离受限制的祖先上下文。
  - **解耦结构**：将动画变换属性限制在纯视觉展示子容器上，避免作用于承载下拉或浮层的外框。

---

## 浮层 Portal 规范

| 类别 | 组件 / 对象 | 是否允许 Portal | 说明 |
| :--- | :--- | :--- | :--- |
| **全局阻断层** | `Dialog`, `AlertDialog`, `Sheet`, `Drawer` | **强制 Portal** | 必须穿透所有局部容器挂载至 `body` |
| **浮动上下文控件** | `DropdownMenu`, `Popover`, `Select`, `ContextMenu` | **强制 Portal** | 避免被包含卡片或父容器的 `overflow-hidden` 截断 |
| **全局即时信息** | `Tooltip`, `Toast` (Sonner) | **强制 Portal** | 独立于局部视图，保证全屏任意位置可完整显示 |
| **局部容器内控件** | `Accordion`, `Collapsible`, `Tabs` | **禁止 Portal** | 属于内容流的一部分，不脱离宿主文档流 |
| **局部吸顶条** | `Sticky Header`, `Table Sticky Columns` | **禁止 Portal** | 依附于滚动视口与容器局部排版 |

---

## 严禁的反模式（Anti-patterns）

1. **禁止任意数值（No Arbitrary z-index）**：严禁出现 `z-[99]`, `z-[999]`, `z-[9999]`, `z-[99999]` 等 arbitrary value。必须严格落在语义阶梯定义内。
2. **禁止裸奔的局部提拉（No Un-isolated Local z-index）**：严禁在未加 `isolate` 的容器内直接对子元素使用 `z-10`、`z-20` 进行重叠排序。
3. **禁止静态文档流无意义赋权**：严禁对既非 `relative`/`absolute`/`fixed`/`sticky` 也非 Flex/Grid item 的普通静态文档流元素添加 `z-index`（该写法在标准 CSS 中无任何实际效果）。
4. **禁止以大盖大（No Escalation Wars）**：当层级被遮挡时，必须定位父级 Stacking Context 和 Portal 挂载点，严禁以“再加个 0”的心态盲目递增。
5. **禁止随意篡改基础组件预设**：严禁在业务层为了单一场景随意覆盖 `packages/ui` 中已标准化的浮层层级（如私自修改 `<Dialog />` 为 `z-[200]`）。

---

## 验收清单

- [ ] **阶梯合规**：所有 `z-*` 属于规范阶梯（`-z-10`, `z-0`, `z-10`, `z-20`, `z-30`, `z-40`, `z-50`, `z-60`, `z-70`, `z-80`, `z-90`, `z-100`），无 `z-[...]` 任意值。
- [ ] **局部隔离**：使用 `z-10` 进行局部重叠（AvatarStack、InputGroup 激活环、日历选中态等）的父容器均显式声明了 `isolate`。
- [ ] **Portal 归位**：所有 Dialog、Sheet、Popover、DropdownMenu、Tooltip 和 Toast 均正确使用 Portal 挂载在顶层，未被父容器 `overflow: hidden` 或 `transform` 截断。
- [ ] **动效安全**：包含 `transform` / `opacity` 动效的父容器未内嵌非 Portal 的浮动菜单或气泡。
- [ ] **层叠可预期**：即使在打开模态弹窗（`z-50`）的情况下，其内部的下拉菜单与 Tooltip 仍能正常清晰展示，Toast 提示仍处于可见最顶层。
