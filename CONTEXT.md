# Sweet Kit

本词表记录 Sweet Kit 的项目术语，作为需求讨论、方案设计与代码命名的共同语言。

## Language

**Sweet Kit**：
本仓库提供的全栈 TypeScript 开发套件，涵盖 Web 与服务端。

**Coding Agent（编码代理）**：
参与本仓库开发、读取项目指引并执行开发任务的 AI 代理；项目工程文档中的 Agent 指此角色。
_Avoid_：Assistant（应用内 AI 助手）

**Assistant（AI 助手）**：
Sweet Kit 应用中面向已登录用户、根据输入生成回复的 AI 能力。
_Avoid_：Coding Agent、编码代理

**HITL（Human-in-the-Loop，人工在环）**：
Agent 改动关键共享设施（如全局样式 `globals.css` 或 `packages/ui` 元组件）时，必须先提出提案并经人工显式确认后方可修改的防险机制。
_Avoid_：自主修改、静默修改

**元组件（Primitive Component）**：
`packages/ui/src/components` 下承载的底层原子 UI 组件（基于 shadcn/ui，实行字节冻结 F1），作为项目的视觉与交互基石。
_Avoid_：业务组件、应用组件
