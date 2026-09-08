# UI Animation 规则

本规则约束 Sweet Kit 全栈应用与组件库中的交互微动效、进出场过渡、布局转场（Layout Animation）与手势动画。

动效用于解释状态、空间关系与操作反馈，应自然、即时、克制且可打断。装饰性表现只在服务内容与既定设计方向时使用，不能延迟用户操作。

设计取舍以 [Emil Kowalski 的 Design Engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md) 为准；Ant Motion 作为空间与编排的补充，冲突时以 Emil 为准。具体 API 与性能结论以当前依赖版本的官方文档、类型和实测为准。

技术选型遵循根目录 `AGENTS.md`：**前端动画统一使用 `motion` (`motion/react`) 或 Tailwind CSS 纯过渡，不引入其他动画库**。

---

## 核心指导原则

1. **频率与目的**：先判断实际使用频率与输入方式，再确定动画是否帮助识别状态或空间关系；组件名称不能代替判断。
2. **空间连续性**：缩放入场从接近最终尺寸开始，不使用 `scale(0)`；方向与锚点应符合对象来源。
3. **即时响应**：按场景选择时长与缓动，操作立即生效，不等待过渡完成。
4. **控制渲染开销**：优先使用 `transform` 与 `opacity`，明确动画属性，禁止 `transition-all`。
5. **可打断**：连续操作跟随最新目标，不排队播放过期动画，业务状态不依赖动画完成回调。

---

## 1. 动效必要性决策矩阵

在编写任何动效代码前，首先自问：**用户一天会触发这个动作多少次？**

| 交互频次 | 典型场景 | 动效决策与执行标准 |
| :--- | :--- | :--- |
| **超高频（100+ 次/天）** | 反复调用的指令面板、快捷操作 | **绝对 0ms，严禁任何过渡动画**。瞬间展现，即刻响应。 |
| **中高频（数十次/天）** | 导航菜单 Hover、列表项悬停、按钮交互反馈 | **移除或大幅缩短动画**，仅保留有助识别的反馈。 |
| **偶发态（数次/天）** | 模态弹窗（Dialog）、侧边抽屉（Sheet）、下拉面板（Popover） | **按第 2 节选择短过渡**，解释空间层级与来源。 |
| **低频/单次** | 首次新手引导（Onboarding）、里程碑达成、支付成功 | **可适度增加物理表现**，但严禁阻断后续操作。 |

Tab 切换、翻页等按实际使用频率判断，不自动归为超高频。输入和业务状态立即更新，动画只负责呈现。

**分支优先级**：键盘触发或超高频操作直接呈现最终状态；其余操作先应用减少动态效果偏好，再选择组件动画。后文所有示例均服从此顺序，按压反馈也不例外。

---

## 2. 时间、缓动曲线与 Spring 物理参数

### 2.1 时长阶梯（Duration Scale）

以下范围是调参依据，不是要求所有组件采用固定时长。常规 UI 交互优先低于 300ms；较大弹窗、抽屉或说明性动画可更长，但应有空间或内容理由，并保持操作立即生效。

| 场景 | 建议时长 |
| :--- | :--- |
| 按压与即时反馈 | 100–160ms |
| Tooltip / 小型 Popover | 125–200ms |
| Dropdown / Select | 150–250ms |
| Dialog / Sheet | 200–500ms，优先选择较短端 |

退场通常不长于进场，避免让消失的内容持续吸引注意力。

### 2.2 缓动曲线（Easing Selection）

- **进入与退出动画（Entering / Exiting）**：**必须使用强力 `ease-out`**。起步速度极快，在最后阶段柔和刹车，给予用户即时响应感。
  - 推荐曲线：`cubic-bezier(0.23, 1, 0.32, 1)`（迅捷有力的现代 UI 曲线）
  - 抽屉/大面板曲线：`cubic-bezier(0.32, 0.72, 0, 1)`
- **原地位置/形态切换（Moving / Morphing）**：使用 `ease-in-out`（如 `cubic-bezier(0.77, 0, 0.175, 1)`）。
- **Hover / 颜色变化**：使用 `ease`。
- **匀速循环运动**：使用 `linear`，仅用于确需恒定速度的运动。
- **严禁在 UI 交互中使用 `ease-in`**：`ease-in` 启动极慢，会让用户产生“点击后卡死了一拍才动”的迟钝错觉。

### 2.3 Spring 物理弹性参数

Spring 适合手势、动量与中途改变目标的交互。普通业务 UI 避免弹跳；需要轻微弹性时，根据场景调节，不设统一的 stiffness、damping 或 bounce 上限。

两类配置分开使用。下面仅展示参数形式，不是全局预设：

```tsx
transition={{ type: "spring", duration: 0.3, bounce: 0 }}

transition={{ type: "spring", stiffness: 300, damping: 35 }}
```

`duration + bounce` 便于控制视觉节奏；`stiffness + damping + mass` 用于物理弹簧并结合已有速度。设置物理参数后，`duration` 与 `bounce` 会被覆盖，不混写两套参数。[Motion Transitions](https://motion.dev/docs/react-transitions)

---

## 3. 物理自然度与微交互规范

### 3.1 严禁从 `scale(0)` 凭空生成

现实物理世界中没有任何物体能从绝对几何零点瞬间膨胀生成。
- **错误**：`scale(0)` ➔ `scale(1)`（看起来像凭空戳出来的假象）。
- **正确**：**从 `scale(0.95)` 开始，配合 `opacity: 0` 渐变**。初始尺寸已具有明确形态暗示，进场更具质感。

### 3.2 按钮瞬时按压确认（Scale-on-Press）

通过第 1 节决策的按钮可使用轻微按压缩放，例如 `scale(0.97)`。键盘与减少动态效果分支保持原尺寸；复用现有组件反馈，不叠加第二套动画。

下面是局部 CSS 示例；`data-press-feedback` 由调用方按实际使用频率决定。`:active:not(:focus-visible)` 将缩放限制在非键盘焦点场景，组件若已提供输入来源信息应优先复用。

```css
@media (prefers-reduced-motion: no-preference) {
  .pressable[data-press-feedback="true"]:not(:focus-visible) {
    transition: scale 150ms cubic-bezier(0.23, 1, 0.32, 1);
  }

  .pressable[data-press-feedback="true"]:active:not(:focus-visible) {
    scale: 0.97;
  }
}
```

### 3.3 锚点感知（Origin-Aware Popovers）

- **Popover / 下拉菜单**：必须从其触发按钮（Trigger）所在的方向展开，使用上下文关联的 `transform-origin`，严禁统统从中心点放大。
- **对话框（Modal Dialog）**：居中视口放置的 Dialog 保持中心锚点（`transform-origin: center`）。

### 3.4 气泡提示连环跳过（Instant Subsequent Tooltips）

Tooltip 首次出现需有微小防误触延迟（复用组件已有的延迟配置），但在同一工具栏中**光标滑移到相邻图标时，必须跳过延迟与动画，即时切换**，消除繁琐等待感。

---

## 4. 性能防线与代码安全

### 4.1 优先使用合成友好的属性

优先动画化 `transform` 与 `opacity`，允许有意义的颜色过渡。`blur`、`clip-path` 等效果仅在改善理解时使用，并检查实际渲染开销；不因属性名称就断言动画一定由 GPU 加速；独立的 `scale`、`translate`、`rotate` 属性同样按变换类属性处理。

- 位移不通过逐帧修改 `top`、`left`、margin 或 padding 实现。宽高动画可能逐帧触发布局，只有尺寸变化本身是交互语义且验证开销可接受时才使用。
- 布局变化先检查 `layout`；同一对象跨视图衔接再考虑 `layoutId`。它们通过 transform 呈现布局变化，但仍需测量布局，并可能缩放文字或子元素，不能保证所有场景无需调节。[Motion Layout](https://motion.dev/docs/react-layout-animations)
- 异步加载先按 [UI Stability](../ui-stability/README.md) 保持占位；布局动画不能替代稳定的容器尺寸。
- 避免逐帧更新 React 状态或父容器上大量后代继承的 CSS 变量，检查内容加载与连续操作同时发生时的表现。

### 4.2 严禁 `transition-all`

在 CSS 或 Tailwind 中**严禁直接使用 `transition: all` 或 `transition-all`**。
`transition-all` 会让未计划的可动画属性变化也触发过渡。必须显式声明受控属性；它本身并不监听父级重绘或文本换行：
```html
<!-- ❌ 错误：滥用 all -->
<div className="transition-all duration-200">...</div>

<!-- ✅ 正确：显式指明属性 -->
<div className="transition-[transform,opacity] duration-200 ease-out">...</div>
```

---

## 5. 可打断性与可访问性

### 5.1 交互可打断（Interruptibility）

- 快速反复点击开关、手势滑动中途松手、或者在动画进行中按下 Escape 键时，元素必须**从当前视觉状态转向最新目标**；键盘与超高频分支直接呈现最终状态，其他分支平滑衔接，绝对禁止跳回初始状态重新播放，严禁排队堆积过期的动画帧。
- **业务逻辑解耦**：表单提交、状态变更或数据拉取，**绝对禁止绑定在 `onAnimationComplete` 回调上**。网络请求必须并行或前置触发，防止因动画被系统打断导致业务逻辑丢失。

### 5.2 尊重减少动态效果偏好（Reduced Motion）

必须支持操作系统的 `prefers-reduced-motion` 设置。对于开启了减少动态效果的用户：
- 彻底移除位移（`translate`）、缩放（`scale`）与 3D 空间运动。
- 可保留帮助理解状态的轻微透明度或颜色过渡，不强制添加淡入淡出。
- React 中使用 `MotionConfig reducedMotion="user"` 或 `useReducedMotion`；CSS 通过媒体查询单独处理，Motion 配置不会替 CSS 过渡应用该偏好。[Motion Accessibility](https://motion.dev/docs/react-accessibility)
- 所有功能、交互与信息反馈必须 100% 保持完整可用。

### 5.3 触屏设备的 Hover 防粘连

悬停动画仅在支持鼠标指针的设备上生效。触屏设备点击后会错误保留 `:hover` 状态，造成视觉粘连。必须使用媒体查询或 Tailwind 变体：
```css
@media (hover: hover) and (pointer: fine) {
  .interactive-item:hover {
    color: var(--primary);
  }
}
```

---

## 6. 实现示例

### 6.1 浮层过渡样式

以下仅展示浮层已挂载时的样式变化，实际显隐、焦点与退出卸载复用现有浮层组件。`data-instant` 由既有输入来源与频率判断传入；键盘触发时跳过过渡。

```tsx
<div
  data-open={open}
  data-instant={instant}
  className="origin-center scale-95 opacity-0 transition-[scale,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] data-[open=true]:scale-100 data-[open=true]:opacity-100 data-[instant=true]:duration-0 data-[instant=true]:transition-none motion-reduce:scale-100 motion-reduce:transition-opacity"
>
  <ModalBody />
</div>
```

Tailwind CSS v4 的 `scale-*` 使用独立 `scale` 属性，因此上例显式过渡 `scale`。[Tailwind Scale](https://tailwindcss.com/docs/scale) 自定义缓动使用 `ease-[cubic-bezier(...)]`，不能将裸 `cubic-bezier(...)` 作为类名。[Tailwind 缓动](https://tailwindcss.com/docs/transition-timing-function)

### 6.2 列表元素增删与位置变化

`instant` 由调用方根据第 1 节的决策传入，列表数据仍由原状态 owner 管理。稳定 key 标识对象，`AnimatePresence` 保留退出项，`popLayout` 让其余项立即按新布局排列，`layout="position"` 平滑衔接位置而不缩放内容。初次渲染不播放整列入场。

```tsx
"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"

type Item = { id: string; label: string }

export function AnimatedList({
  items,
  instant,
}: {
  items: Item[]
  instant: boolean
}) {
  const reduceMotion = useReducedMotion()
  const allowMovement = !instant && !reduceMotion

  return (
    <ul className="relative">
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout={allowMovement ? "position" : false}
            initial={instant ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              type: "tween",
              duration: instant ? 0 : 0.18,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            {item.label}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}
```

带交互控件的列表还需由现有组件处理删除后的焦点去向与退出项的交互禁用；示例仅包含文本项。

---

## 验收清单

- [ ] **决策一致**：按实际频率与输入方式决定是否动画，键盘与超高频分支即时呈现。
- [ ] **参数适配**：按第 2 节选择时长与缓动，普通业务交互无多余弹跳，Spring 参数未混用。
- [ ] **空间连续**：缩放入场接近最终尺寸，方向与锚点符合来源，布局变化不造成内容塌陷。
- [ ] **可打断**：连续操作停在最新状态，无跳回起点或过期队列；业务状态与请求不等待动画。
- [ ] **性能可控**：显式声明动画属性，复杂效果与必要的尺寸动画已检查实际开销。
- [ ] **可访问**：减少动态效果时无空间运动，键盘、触屏与焦点行为完整；示例中的按压与浮层也遵循这些分支。

## 来源

- [Emil Kowalski：Design Engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md)：动画决策、时长、缓动、组件细节、可打断性与可访问性的主要依据。
- Ant Motion：[动效价值](https://motion.ant.design/language/basic-cn)、[原则](https://motion.ant.design/language/principle-cn)、[速度](https://motion.ant.design/language/speed-cn)、[空间](https://motion.ant.design/language/space-cn)、[组合](https://motion.ant.design/language/combined-cn)、[转场](https://motion.ant.design/language/transition-cn)：空间关系与动效编排的补充参考。
- [Motion](https://motion.dev/docs/react)、[Tailwind CSS](https://tailwindcss.com/docs)：核对实现 API；来源示例中的库名、参数与性能描述不直接作为项目契约。
