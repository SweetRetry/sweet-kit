# 字体与字号

使用 Tailwind 标准字号阶梯，字体族消费主题变量；不在调用处写任意字号或字体族。

| Class | 用途 |
| --- | --- |
| `text-xs` | 辅助标注、Badge；最小可用字号 |
| `text-sm` | 次要文本、表单标签、说明 |
| `text-base` | 正文默认 |
| `text-lg` | 加强正文、卡片标题 |
| `text-xl` | 小标题 |
| `text-2xl` | 页面标题 |
| `text-3xl` | 大标题 |
| `text-4xl` 及以上 | 展示性标题 |

- 用字号、字重和行高建立阅读层级，不通过缩小正文容纳更多内容。
- 需要阶梯外的字号时先扩展主题 Token；具体取值由主题维护。
- 品牌与自定义字体通过 `next/font` 注入主题变量，组件使用 `font-sans` / `font-mono`，接入见 `apps/web/app/layout.tsx`。
