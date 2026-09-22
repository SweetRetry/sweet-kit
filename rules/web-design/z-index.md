# 层叠上下文与 Z-Index

层叠表达元素在视觉上的前后关系：越接近当前操作焦点越靠前。业务代码禁止任意 z-index（`z-[999]`），严禁突破 `z-50` 上限。

## 层级阶梯

| 层级 | Class | 数值 | 职责 |
| :--- | :--- | :--- | :--- |
| **Below** | `-z-10` | -10 | 背景装饰、水印 |
| **Base** | `z-0` / `z-auto` | 0 | 普通文档流 |
| **Elevated** | `z-10` | 1–10 | 局部微层级（**配合 `isolate`**）：Focus 环、头像堆叠、Tab 激活态 |
| **Sticky** | `z-20` | 20 | 吸顶表头、拖拽把手 |
| **Navigation** | `z-30` | 30 | 固定导航栏、固定侧边栏 |
| **Backdrop** | `z-40` | 40 | 全屏遮罩蒙层 |
| **Overlay** | `z-50` | 50 | 全部顶层浮层（Dialog、Sheet、Popover、Tooltip 等） |

> `z-50` 是业务层上限。浮层组件通过 Portal 挂载至 `<body>` 并使用 `z-50`，同层顺序由挂载先后决定。两个浮层互相遮挡时修挂载顺序，不比拼数值。

## `isolate` 隔离

使用 `z-10` 的局部重叠场景，父容器必须声明 `isolate`，使子元素层叠仅在容器内竞争，不溢出外部文档流。

## 层叠上下文触发陷阱

高 `z-index` 被低层元素遮挡时，**严禁 `z-[9999]`**。通常是祖先创建了独立层叠上下文。以下属性会触发：`transform`、`opacity < 1`、`filter` / `backdrop-filter`、`contain`、`will-change`、`mix-blend-mode`、`perspective`。

解决：Portal 提升至 `body`，或将变换属性限制在纯视觉子容器。

## 浮层 Portal 规范

| 类别 | 是否 Portal | 说明 |
| :--- | :--- | :--- |
| Dialog / AlertDialog / Sheet / Drawer | **强制** | 穿透所有局部容器 |
| DropdownMenu / Popover / Select / ContextMenu | **强制** | 避免 `overflow-hidden` 截断 |
| Tooltip / Toast | **强制** | 全屏可完整显示 |
| Accordion / Collapsible / Tabs | **禁止** | 内容流的一部分 |
| Sticky Header / Table Sticky Columns | **禁止** | 依附滚动视口 |

## 验收清单

- [ ] **阶梯合规**：业务层无大于 `z-50` 的值，无 `z-[*]` 任意值。
- [ ] **局部隔离**：使用 `z-10` 的容器均有 `isolate`。
- [ ] **Portal 归位**：浮层通过 Portal 挂载，未被 `overflow-hidden` 或 `transform` 截断。
- [ ] **层叠可预期**：多个模态依靠挂载顺序层叠，未私自加权。
