# Rules

`rules/` 回答“怎么做”和“绝对不能做什么”，承载当前有效的专项工程规范与 Agent 约束。

根目录 `AGENTS.md` 是规则入口。新增专项规则时必须由 `AGENTS.md` 明确引用，并满足以下条件：

- 规则具体、可执行且能够被代码审查或自动检查验证
- 只描述当前最终约束，不记录讨论过程或历史方案
- 不复制 ADR 的决策背景，也不承载开发教程

自动化门禁只在**边界明确且误报率低**时引入（当前仅：Zod 废弃 API、字号任意值、`transition-all`、`z-index` 任意值）。带判断余地的规则——间距的光学微调值域、圆角公式推导、API 响应形态——由验收清单人工判定，不写启发式扫描：正则推断源码会同时产生误报与漏报，并诱导“为了过检查而写代码”。能写成可执行不变量的（如 `packages/request` 的错误契约测试）优先写测试，而不是扫描。

通用规则直接保留在 `AGENTS.md`；只有需要独立维护的完整专项规范才进入本目录。

## 结构

```text
rules/
  api-contract.md              # API 描述层与 RFC 9457 错误契约
  web-design/                  # 前端设计规则，由根目录 DESIGN.md 路由
    animation.md
    color-and-surface.md
    design-quality.md
    layout-and-loading.md
    radius.md
    stability.md
    z-index.md
    font-system/               # 带扫描脚本的规则保留目录
      README.md
      check.js
      scan.js
  zod-v4/                      # 带扫描脚本的规则保留目录（同上）
```

规则只包含一个文档时，直接写为 `{name}.md`；需要同时维护脚本等其他文件时才建目录，并保留 `README.md` 作为入口。
