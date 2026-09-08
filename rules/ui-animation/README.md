# UI Animation 规则

本规则约束 Sweet Kit 全栈应用与组件库中的交互微动效、进出场过渡、布局转场（Layout Animation）与手势动画。

动效是界面的物理触觉与空间线索，不是装饰特效。在生产级 Web 界面中，**最糟糕的动效是延迟用户的操作与感知**。动效必须遵循“自然、即时、克制、可打断”四大铁律，严禁拖沓阻碍操作。

技术选型遵循根目录 `AGENTS.md`：**前端动画统一使用 `motion` (`motion/react`) 或 Tailwind CSS 纯过渡，不引入其他动画库**。

---

## 核心指导原则

1. **频次决定生死（Frequency-Driven）**：高频日常操作零动效；低频结构变化短过渡；只有偶发庆祝或引导才允许增强表现。
2. **物理真实可信（Physical Plausibility）**：严禁 `scale(0)` 凭空出现；必须保持空间连续性（从触发器展开、从原尺寸微缩放）。
3. **极速响应先于缓动（Instant Feedback First）**：UI 过渡黄金时长为 150ms ~ 200ms，严格上限为 300ms；严禁在进场使用起步迟缓的 `ease-in`。
4. **性能防线（GPU Compositing Only）**：100% 仅允许动画化 `transform` 与 `opacity`；严禁使用 `transition-all`，严禁逐帧修改尺寸与边距。
5. **完全可打断（Interruptible）**：连续交互时动效必须平滑跟随最新目标，严禁排队堵塞，严禁业务状态依赖动画完成回调。

---

## 1. 动效必要性决策矩阵（频次铁律）

在编写任何动效代码前，首先自问：**用户一天会触发这个动作多少次？**

| 交互频次 | 典型场景 | 动效决策与执行标准 |
| :--- | :--- | :--- |
| **超高频（100+ 次/天）** | 键盘快捷键、`Cmd+K` 指令面板、表单输入、Tab 切换、主列表翻页 | **绝对 0ms，严禁任何过渡动画**。瞬间展现，即刻响应。 |
| **中高频（数十次/天）** | 导航菜单 Hover、列表项悬停、按钮交互反馈 | **极微短过渡（≤150ms）** 或仅做色彩微变，无位移动画。 |
| **偶发态（数次/天）** | 模态弹窗（Dialog）、侧边抽屉（Sheet）、下拉面板（Popover） | **标准短过渡（150ms ~ 200ms）**，解释空间层级与来源。 |
| **低频/单次** | 首次新手引导（Onboarding）、里程碑达成、支付成功 | **可适度增加物理表现**，但严禁阻断后续操作。 |

> [!IMPORTANT]
> **键盘操作零动画铁律**：凡是由键盘触发的行为（如按下快捷键打开搜索、按上下键切换选项），必须立即呈现，**禁止添加任何展开动画**。键盘用户追求极致效率，任何动画延迟都会造成严重割裂感。

---

## 2. 时间、缓动曲线与 Spring 物理参数

### 2.1 时长阶梯（Duration Scale）

UI 动画的感知速度直接决定用户对应用性能的评价。过长的动效会把极快的后端响应拖累成“卡顿”的负面感知。

- **按压与即时反馈**：`100ms ~ 150ms`（瞬时确认，不可拖泥带水）
- **Tooltip / 气泡提示**：`120ms ~ 160ms`
- **Dropdown / Select 下拉**：`150ms ~ 200ms`
- **Dialog / Sheet 弹窗**：`180ms ~ 250ms`（上限不得超过 300ms）
- **退场时长永远小于等于进场时长**：元素离开屏幕应更快（如进场 200ms，退场 150ms）。

### 2.2 缓动曲线（Easing Selection）

- **进入动画（Entering）**：**必须使用强力 `ease-out`**。起步速度极快，在最后阶段柔和刹车，给予用户即时响应感。
  - 推荐曲线：`cubic-bezier(0.23, 1, 0.32, 1)`（迅捷有力的现代 UI 曲线）
  - 抽屉/大面板曲线：`cubic-bezier(0.32, 0.72, 0, 1)`
- **原地位置/形态切换（Moving / Morphing）**：使用 `ease-in-out`（如 `cubic-bezier(0.77, 0, 0.175, 1)`）。
- **严禁在 UI 交互中使用 `ease-in`**：`ease-in` 启动极慢，会让用户产生“点击后卡死了一拍才动”的迟钝错觉。

### 2.3 Spring 物理弹性参数

Spring 比固定时长动画更自然，但业务应用中**严禁滥用夸张的果冻弹跳（Jelly Bounce）**。

在 `motion/react` 中推荐采用以下物理配置：

```tsx
// ✅ 紧凑、克制的生产级交互 Spring（微弱弹性，无果冻感）
transition={{
  type: "spring",
  stiffness: 380,
  damping: 30,
  bounce: 0.1
}}

// ✅ 抽屉与滑动手势（强调动量吸收）
transition={{
  type: "spring",
  stiffness: 300,
  damping: 35
}}
```

---

## 3. 物理自然度与微交互规范

### 3.1 严禁从 `scale(0)` 凭空生成

现实物理世界中没有任何物体能从绝对几何零点瞬间膨胀生成。
- **错误**：`scale(0)` ➔ `scale(1)`（看起来像凭空戳出来的假象）。
- **正确**：**从 `scale(0.95)` 开始，配合 `opacity: 0` 渐变**。初始尺寸已具有明确形态暗示，进场更具质感。

### 3.2 按钮瞬时按压确认（Scale-on-Press）

所有主要按钮和可点击单元，必须在 `:active` 伪类或 `whileTap` 时提供瞬时按压缩放反馈：

```tsx
// ✅ Tailwind 实现：微按压反馈
<button className="transition-transform duration-150 ease-out active:scale-[0.97]">
  提交订单
</button>

// ✅ motion 实现：
<motion.button whileTap={{ scale: 0.97 }}>
  提交订单
</motion.button>
```

### 3.3 锚点感知（Origin-Aware Popovers）

- **Popover / 下拉菜单**：必须从其触发按钮（Trigger）所在的方向展开，使用上下文关联的 `transform-origin`，严禁统统从中心点放大。
- **对话框（Modal Dialog）**：居中视口放置的 Dialog 保持中心锚点（`transform-origin: center`）。

### 3.4 气泡提示连环跳过（Instant Subsequent Tooltips）

Tooltip 首次出现需有微小防误触延迟（约 200ms），但在同一工具栏中**光标滑移到相邻图标时，必须跳过延迟与动画，即时切换**，消除繁琐等待感。

---

## 4. 性能防线与代码安全

### 4.1 仅动画化 GPU 合成属性

**铁律：仅允许对 `transform` 和 `opacity` 进行过渡动画。**

- ❌ **严禁动画化排版属性**：严禁对 `height`、`width`、`top`、`left`、`margin`、`padding` 进行 CSS 过渡。这些属性会在每一帧触发浏览器布局重排（Layout Reflow），在低端设备或大页面上造成严重掉帧。
- 尺寸变化确为核心业务语义时（如折叠面板展开），使用 `motion/react` 的 `layout` / `layoutId` 属性，让底层通过 FLIP 逆运算转化为高性能的 `transform` 实现。

### 4.2 严禁 `transition-all`

在 CSS 或 Tailwind 中**严禁直接使用 `transition: all` 或 `transition-all`**。
`transition-all` 会导致意外监听所有的样式变动（包括父级重绘、边框变色、文本换行），引发多余的动画开销并可能引起恶性抖动。必须显式声明受控属性：
```html
<!-- ❌ 错误：滥用 all -->
<div className="transition-all duration-200">...</div>

<!-- ✅ 正确：显式指明属性 -->
<div className="transition-[transform,opacity] duration-200 ease-out">...</div>
```

---

## 5. 可打断性与可访问性

### 5.1 交互可打断（Interruptibility）

- 快速反复点击开关、手势滑动中途松手、或者在动画进行中按下 Escape 键时，元素必须**从当前的即时坐标平滑转向新目标**，绝对禁止跳回初始状态重新播放，严禁排队堆积过期的动画帧。
- **业务逻辑解耦**：表单提交、状态变更或数据拉取，**绝对禁止绑定在 `onAnimationComplete` 回调上**。网络请求必须并行或前置触发，防止因动画被系统打断导致业务逻辑丢失。

### 5.2 尊重减少动态效果偏好（Reduced Motion）

必须支持操作系统的 `prefers-reduced-motion` 设置。对于开启了减少动态效果的用户：
- 彻底移除位移（`translate`）、缩放（`scale`）与 3D 空间运动。
- 仅保留轻微的透明度（`opacity`）淡入淡出，确保状态转换可知。
- 所有功能、交互与信息反馈必须 100% 保持完整可用。

### 5.3 触屏设备的 Hover 防粘连

悬停动画仅在支持鼠标指针的设备上生效。触屏设备点击后会错误保留 `:hover` 状态，造成视觉粘连。必须使用媒体查询或 Tailwind 变体：
```css
@media (hover: hover) and (pointer: fine) {
  .interactive-item:hover {
    transform: translateY(-1px);
  }
}
```

---

## 6. 典型模式对比（Anti-patterns vs Best Practice）

### 模式 1：浮层弹窗进场动画

```tsx
// ❌ 错误：从 scale(0) 凭空钻出、时长过长、ease-in 启动迟缓、全属性监听
<div className="transition-all duration-500 ease-in scale-0 opacity-0 data-[open=true]:scale-100 data-[open=true]:opacity-100">
  <ModalBody />
</div>

// ✅ 正确：从 scale(0.95) 自然展开、200ms 强力 ease-out 瞬间响应、仅动 transform 和 opacity
<div className="origin-center transition-[transform,opacity] duration-200 cubic-bezier(0.23,1,0.32,1) scale-95 opacity-0 data-[open=true]:scale-100 data-[open=true]:opacity-100">
  <ModalBody />
</div>
```

### 模式 2：按钮交互反馈

```tsx
// ❌ 错误：点击时没有物理下沉反馈，或者用了 400ms 慢速果冻 bounce
<button className="bg-primary text-white p-2 rounded-md">
  提交
</button>

// ✅ 正确：瞬时 scale(0.97) 按压确认，150ms 极速复原
<button className="bg-primary text-white p-2 rounded-md transition-transform duration-150 ease-out active:scale-[0.97]">
  提交
</button>
```

### 模式 3：列表元素增删转场（motion/react）

```tsx
// ❌ 错误：直接修改高度导致每帧 Reflow，弹跳夸张
<motion.div
  initial={{ height: 0 }}
  animate={{ height: "auto" }}
  transition={{ type: "spring", bounce: 0.8 }}
>
  <ListItem />
</motion.div>

// ✅ 正确：利用 layout 属性底层 FLIP 转换，仅动 opacity 与微小 y 轴位移
<motion.div
  layout
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -4 }}
  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
>
  <ListItem />
</motion.div>
```

---

## 验收清单

- [ ] **频次合规**：高频与键盘触发操作 0ms 纯瞬时响应；常规 UI 过渡时长严格控制在 ≤200ms（上限 300ms）。
- [ ] **物理真实**：浮层从 `scale(0.95)` 起步配合透明度，无 `scale(0)`；Popover 锚点对齐触发源；按压有 `scale-[0.97]` 瞬时反馈。
- [ ] **缓动安全**：进场使用强力 `ease-out`，无 `ease-in` 起步迟缓感；Spring 弹性克制（`bounce ≤ 0.15`），无夸张果冻抖动。
- [ ] **性能纯净**：仅过渡 `transform` 与 `opacity`，无 `transition-all`，无直接动画化 `height`/`width`/`margin`。
- [ ] **逻辑解耦**：业务状态更新与 API 请求完全独立于动效，不等待 `onAnimationComplete` 回调。
- [ ] **无障碍兼容**：在 `prefers-reduced-motion` 下仅保留基础淡入淡出，无大幅度空间位移与形变。
