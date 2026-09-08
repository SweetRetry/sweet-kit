# Font System 规则

本项目使用 Tailwind CSS 标准化字体大小 utility，禁止任意值（`text-[*]`）。

## 允许的字体大小

| Class | Size | Line Height | 用途 |
|---|---|---|---|
| `text-xs` | 12px / 0.75rem | 1rem | 最小可用字号，辅助标注、badge |
| `text-sm` | 14px / 0.875rem | 1.25rem | 次要文本、表单 label、caption |
| `text-base` | 16px / 1rem | 1.5rem | 正文默认 |
| `text-lg` | 18px / 1.125rem | 1.75rem | 加强正文、卡片标题 |
| `text-xl` | 20px / 1.25rem | 1.75rem | 小标题 |
| `text-2xl` | 24px / 1.5rem | 2rem | 页面标题 |
| `text-3xl` | 30px / 1.875rem | 2.25rem | 大标题 |
| `text-4xl` | 36px / 2.25rem | 2.5rem | Hero 标题 |
| `text-5xl` | 48px / 3rem | 1 | 展示性标题 |
| `text-6xl` | 60px / 3.75rem | 1 | 展示性标题 |
| `text-7xl` | 72px / 4.5rem | 1 | 展示性标题 |
| `text-8xl` | 96px / 6rem | 1 | 展示性标题 |
| `text-9xl` | 128px / 8rem | 1 | 展示性标题 |

## 规则

1. **使用标准 utility**：所有字体大小必须使用上表中的 Tailwind class。
2. **禁止任意值**：不使用 `text-[11px]`、`text-[0.8rem]` 等 arbitrary value 写法。
3. **最小字号为 `text-xs` (12px)**：出于可访问性考虑（WCAG），不使用小于 12px 的字体。
4. **超出 `text-9xl` 的需求**：如确实需要更大字号，可在 Tailwind 配置中扩展 `fontSize` token，不使用 arbitrary value。

## 为什么

- 统一的字体层级确保视觉一致性和可维护性。
- 避免像素级微调导致的碎片化设计。
- 标准 utility 在 Tailwind 的 purge 和 IDE 自动补全中有更好的支持。
- 12px 下限符合现代浏览器默认最小字体和可访问性标准。

## 自动化验证

修改涉及字号的代码后，运行静态检查脚本验证：

```bash
pnpm font:check
```

