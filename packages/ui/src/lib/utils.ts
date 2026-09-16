/**
 * 上游 shadcn/ui 现在的约定是组件直接从 `cn` 包导入（`shadcn migrate cn`）。
 * 本文件只为保留 `@workspace/ui/lib/utils` 这个公开别名，供 `components.json`
 * 的 `aliases.utils` 解析；组件不再经由它导入，也不要在此重新实现合并逻辑。
 */
export { cn } from "cn"
