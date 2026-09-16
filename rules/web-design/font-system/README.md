# Font System 规则

本项目使用 Tailwind CSS 标准字号 utility，禁止任意值（`text-[*]`）。

| Class | 用途 |
| --- | --- |
| `text-xs` | 最小可用字号：辅助标注、badge。正文下限，出于可访问性不使用更小字号 |
| `text-sm` | 次要文本、表单 label、caption |
| `text-base` | 正文默认 |
| `text-lg` | 加强正文、卡片标题 |
| `text-xl` | 小标题 |
| `text-2xl` | 页面标题 |
| `text-3xl` | 大标题 |
| `text-4xl` 及以上 | 展示性标题 |

## 规则

1. 字号只取上表的 Tailwind utility；具体 px 与行高以 Tailwind 默认值为准，不在本文件复制取值。
2. 不使用 `text-[11px]`、`text-[0.8rem]` 等 arbitrary value。
3. 需要超出可用阶梯的字号时，在 Tailwind 配置中扩展 `fontSize` token，不用 arbitrary value。

## 自动化验证

修改涉及字号的代码后运行 `pnpm font:check`。
